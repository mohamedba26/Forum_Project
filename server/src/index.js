import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'
import { createServer } from 'http'
import { Server  } from 'socket.io'

import authRoutes   from './routes/auth.js'
import sujetsRoutes from './routes/sujets.js'
import postesRoutes from './routes/postes.js'
import adminRoutes  from './routes/admin.js'
import reportRoutes from './routes/reports.js'
import likesRoutes  from './routes/likes.js'
import { authenticate } from './middleware/auth.js'
import { initSocket } from './socket.js'
import { prisma } from './prisma.js'

export { prisma }

const app    = express()
const server = createServer(app)
const io     = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Routes
import categoriesRouter from './routes/categories.js';
app.use('/api/categories', categoriesRouter);
app.use('/api/auth',   authRoutes)
app.use('/api/sujets', sujetsRoutes)
app.use('/api',        postesRoutes)
app.use('/api/admin',  authenticate, adminRoutes)
app.use('/api/reports',authenticate, reportRoutes)
app.use('/api/likes',  likesRoutes)

// Socket
initSocket(io)

// Chat REST routes
app.get('/api/chat/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    // Get all users this person has chatted with
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ expediteurId: userId }, { destinataireId: userId }]
      },
      orderBy: { date: 'desc' },
      include: {
        expediteur:  { select: { id: true, nom: true, avatar: true } },
        destinataire: { select: { id: true, nom: true, avatar: true } },
      }
    })

    // Build unique conversation list
    const seen = new Set()
    const conversations = []
    for (const c of chats) {
      const otherId = c.expediteurId === userId ? c.destinataireId : c.expediteurId
      const other   = c.expediteurId === userId ? c.destinataire  : c.expediteur
      if (!seen.has(otherId)) {
        seen.add(otherId)
        const unread = await prisma.chat.count({
          where: { expediteurId: otherId, destinataireId: userId, lu: false }
        })
        conversations.push({
          userId:      other.id,
          nom:         other.nom,
          avatar:      other.avatar,
          lastMessage: c.message,
          lastDate:    c.date,
          unread,
        })
      }
    }
    res.json(conversations)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

app.get('/api/chat/history/:otherId', authenticate, async (req, res) => {
  try {
    const userId  = req.user.id
    const otherId = +req.params.otherId
    const messages = await prisma.chat.findMany({
      where: {
        OR: [
          { expediteurId: userId,  destinataireId: otherId },
          { expediteurId: otherId, destinataireId: userId  },
        ]
      },
      orderBy: { date: 'asc' },
      take: 100,
      include: { expediteur: { select: { nom: true, avatar: true } } }
    })
    // Mark received messages as read
    await prisma.chat.updateMany({
      where: { expediteurId: otherId, destinataireId: userId, lu: false },
      data:  { lu: true }
    })
    res.json(messages.map(m => ({
      id:        m.id,
      senderId:  m.expediteurId,
      senderNom: m.expediteur.nom,
      senderAvatar: m.expediteur.avatar,
      message:   m.message,
      date:      m.date,
      lu:        m.lu,
    })))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

app.get('/api/chat/users', authenticate, async (req, res) => {
  try {
    const q = req.query.q || ''
    const users = await prisma.utilisateur.findMany({
      where: {
        id:        { not: req.user.id },
        estBloque: false,
        nom:       { contains: q, mode: 'insensitive' }
      },
      select: { id: true, nom: true, avatar: true, role: true },
      take: 20,
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})
app.get('/api/stats/pending', authenticate, async (req, res) => {
  try {
    const { role } = req.user
    let adminCount = 0
    let modCount = 0

    const postesPending = await prisma.poste.count({ where: { statut: 'en_attente' } })

    if (role === 'admin') {
      const sujetsPending = await prisma.sujet.count({ where: { statut: 'en_attente' } })
      const reportsPending = await prisma.report.count({ where: { statut: 'en_attente' } })
      adminCount = sujetsPending + postesPending + reportsPending
    }
    
    if (role === 'admin' || role === 'moderateur') {
      modCount = postesPending
    }

    res.json({ adminCount, modCount })
  } catch (error) {
    res.status(500).json({ message: 'Erreur Serveur' })
  }
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err)
  res.status(500).json({ message: 'Erreur Serveur', details: err.message })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))