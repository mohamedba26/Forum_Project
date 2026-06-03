import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Search, MessageCircle, Plus, X, ArrowLeft } from 'lucide-react'
import { socketService } from '../services/socketService'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../utils/helpers'
import { UserAvatar } from '../components/layout/Navbar'
import api from '../services/api'

// ── helpers ─────────────────────────────────────────────────────────────────
const fetchConversations = () => api.get('/chat/conversations')
const fetchHistory       = (id) => api.get(`/chat/history/${id}`)
const fetchUsers         = (q) => api.get(`/chat/users?q=${encodeURIComponent(q)}`)

// ── Components ───────────────────────────────────────────────────────────────
function ConvItem({ conv, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${active ? 'bg-primary-50 border border-primary-100' : 'hover:bg-neutral-50'}`}
    >
      <div className="relative shrink-0">
        <UserAvatar user={{ nom: conv.nom, avatar: conv.avatar }} size="w-9 h-9" />
        {conv.unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {conv.unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}`}>
          {conv.nom}
        </p>
        <p className="text-xs text-neutral-400 truncate">{conv.lastMessage}</p>
      </div>
      <span className="text-[10px] text-neutral-300 shrink-0">{timeAgo(conv.lastDate)}</span>
    </button>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user }                    = useAuth()
  const [conversations, setConvs]   = useState([])
  const [activeUserId, setActive]   = useState(null)
  const [activeUser, setActiveUser] = useState(null)
  const [messages, setMessages]     = useState([])
  const [text, setText]             = useState('')
  const [connected, setConnected]   = useState(false)
  const [searching, setSearching]   = useState(false)
  const [searchQ, setSearchQ]       = useState('')
  const [searchResults, setResults] = useState([])
  const [loadingHistory, setLoadH]  = useState(false)
  const [showMobileList, setMobileList] = useState(true)
  const endRef                      = useRef()
  const socketRef                   = useRef(null)

  // Connect socket once
  useEffect(() => {
    const token  = localStorage.getItem('fm_token')
    const socket = socketService.connect(token)
    socketRef.current = socket

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg])
      // Update conversation last message
      setConvs(prev => prev.map(c =>
        c.userId === msg.senderId
          ? { ...c, lastMessage: msg.message, lastDate: msg.date, unread: c.userId === activeUserId ? 0 : c.unread + 1 }
          : c
      ))
    })

    loadConversations()
    return () => socketService.disconnect()
  }, [])

  const loadConversations = async () => {
    try {
      const data = await fetchConversations()
      setConvs(data)
    } catch {}
  }

  // Open conversation
  const openConv = useCallback(async (targetUser) => {
    setActive(targetUser.id)
    setActiveUser(targetUser)
    setSearching(false)
    setSearchQ('')
    setResults([])
    setMobileList(false)
    setLoadH(true)

    // Join socket room
    const chatId = [user.id, targetUser.id].sort().join('_')
    socketRef.current?.emit('join_chat', { chatId })

    try {
      const history = await fetchHistory(targetUser.id)
      setMessages(history)
      // Mark as read in conversations
      setConvs(prev => prev.map(c => c.userId === targetUser.id ? { ...c, unread: 0 } : c))
      // Add to list if not there
      if (!conversations.find(c => c.userId === targetUser.id)) {
        setConvs(prev => [{ userId: targetUser.id, nom: targetUser.nom, avatar: targetUser.avatar, lastMessage: '', lastDate: new Date(), unread: 0 }, ...prev])
      }
    } catch {}
    setLoadH(false)
  }, [user?.id, conversations])

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Search users
  useEffect(() => {
    if (!searchQ.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const data = await fetchUsers(searchQ)
        setResults(data)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [searchQ])

  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !activeUserId) return
    const chatId = [user.id, activeUserId].sort().join('_')
    socketService.sendMessage(chatId, text.trim())
    // Optimistic
    setMessages(prev => [...prev, {
      id: Date.now(), senderId: user.id, senderNom: user.nom,
      message: text.trim(), date: new Date(), lu: false
    }])
    setConvs(prev => prev.map(c => c.userId === activeUserId ? { ...c, lastMessage: text.trim(), lastDate: new Date() } : c))
    setText('')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-10rem)] flex gap-0 card overflow-hidden fade-in">

      {/* ── Left panel: conversation list ─────────────────────────── */}
      <div className={`
        flex flex-col border-r border-neutral-100 bg-white
        ${showMobileList ? 'flex' : 'hidden'} md:flex
        w-full md:w-72 shrink-0
      `}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <MessageCircle size={15} className="text-primary-500" /> Messages
          </h2>
          <button
            onClick={() => setSearching(s => !s)}
            className={`btn-ghost p-1.5 rounded-lg ${searching ? 'bg-primary-50 text-primary-600' : ''}`}
            title="Nouvelle conversation"
          >
            {searching ? <X size={15} /> : <Plus size={15} />}
          </button>
        </div>

        {/* Search new user */}
        {searching && (
          <div className="px-3 py-2 border-b border-neutral-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                autoFocus
                className="input pl-8 py-2 text-sm"
                placeholder="Rechercher un utilisateur…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => openConv(u)}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-neutral-50 text-left w-full"
                  >
                    <UserAvatar user={u} size="w-7 h-7" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{u.nom}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQ && searchResults.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-3">Aucun utilisateur trouvé</p>
            )}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucune conversation</p>
              <p className="text-xs mt-1">Cliquez sur <strong>+</strong> pour commencer</p>
            </div>
          ) : conversations.map(c => (
            <ConvItem
              key={c.userId}
              conv={c}
              active={c.userId === activeUserId}
              onClick={() => openConv({ id: c.userId, nom: c.nom, avatar: c.avatar })}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: chat window ──────────────────────────────── */}
      <div className={`flex-1 flex flex-col bg-white min-w-0 ${!showMobileList ? 'flex' : 'hidden'} md:flex`}>
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-300">
            <MessageCircle size={48} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">Sélectionnez une conversation</p>
            <p className="text-xs mt-1 opacity-70">ou cliquez sur + pour en démarrer une</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 shrink-0">
              <button
                onClick={() => setMobileList(true)}
                className="md:hidden btn-ghost p-1"
              >
                <ArrowLeft size={18} />
              </button>
              <UserAvatar user={activeUser} size="w-9 h-9" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">{activeUser?.nom}</p>
                <p className="text-xs text-neutral-400 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-neutral-300'}`} />
                  {connected ? 'En ligne' : 'Hors ligne'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {loadingHistory ? (
                <div className="flex-1 flex items-center justify-center text-neutral-300 text-sm">Chargement…</div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 mt-16">
                  <p className="text-sm">Démarrez la conversation !</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id
                const showDate = i === 0 || new Date(messages[i-1].date).toDateString() !== new Date(msg.date).toDateString()
                return (
                  <div key={msg.id || i}>
                    {showDate && (
                      <div className="text-center my-2">
                        <span className="text-[10px] text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                          {new Date(msg.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <UserAvatar user={{ nom: msg.senderNom, avatar: msg.senderAvatar }} size="w-6 h-6" />
                      )}
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'}`}>
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-neutral-400'}`}>
                          {msg.date ? timeAgo(msg.date) : 'À l\'instant'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="px-4 py-3 border-t border-neutral-100 flex items-center gap-2 shrink-0">
              <input
                className="input flex-1 py-2.5"
                placeholder="Votre message…"
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={!connected}
              />
              <button
                type="submit"
                className="btn-primary p-2.5 shrink-0"
                disabled={!text.trim() || !connected}
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}