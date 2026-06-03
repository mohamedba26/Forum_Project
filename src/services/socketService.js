import { io } from 'socket.io-client'

let socket = null

export const socketService = {
  connect(token) {
    socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    })
    return socket
  },

  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  getSocket() {
    return socket
  },

  joinChat(chatId) {
    socket?.emit('join_chat', { chatId })
  },

  sendMessage(chatId, message) {
    socket?.emit('send_message', { chatId, message })
  },

  onMessage(callback) {
    socket?.on('receive_message', callback)
  },

  offMessage() {
    socket?.off('receive_message')
  },
}
