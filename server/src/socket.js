import jwt from 'jsonwebtoken'
import { prisma } from './prisma.js'

export function initSocket(io) {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Auth required'))
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = payload.id
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: user ${socket.userId}`)

    socket.on('join_chat', ({ chatId }) => {
      socket.join(chatId)
    })

    socket.on('get_history', async ({ chatId }, callback) => {
      const [idA, idB] = chatId.split('_').map(Number)
      const messages   = await prisma.chat.findMany({
        where: {
          OR: [
            { expediteurId: idA, destinataireId: idB },
            { expediteurId: idB, destinataireId: idA },
          ]
        },
        orderBy: { date: 'asc' },
        take: 100,
        include: { expediteur: { select: { nom: true } } }
      })
      callback(messages.map(m => ({
        id:         m.id,
        senderId:   m.expediteurId,
        senderNom:  m.expediteur.nom,
        message:    m.message,
        date:       m.date,
        lu:         m.lu,
      })))
    })

    socket.on('send_message', async ({ chatId, message }) => {
      const [idA, idB] = chatId.split('_').map(Number)
      const destinataireId = socket.userId === idA ? idB : idA

      const user = await prisma.utilisateur.findUnique({
        where:  { id: socket.userId },
        select: { nom: true }
      })

      const chat = await prisma.chat.create({
        data: { message, expediteurId: socket.userId, destinataireId }
      })

      const payload = {
        id:        chat.id,
        senderId:  socket.userId,
        senderNom: user.nom,
        message:   chat.message,
        date:      chat.date,
        lu:        chat.lu,
      }

      io.to(chatId).emit('receive_message', payload)
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: user ${socket.userId}`)
    })
  })
}