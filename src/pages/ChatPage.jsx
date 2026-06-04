import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Send, Search, MessageCircle, Plus, X, ArrowLeft, Trash2 } from 'lucide-react'
import { socketService } from '../services/socketService'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { timeAgo } from '../utils/helpers'
import { UserAvatar } from '../components/layout/Navbar'
import api from '../services/api'
import ConfirmModal from '../components/ConfirmModal'

// ── helpers ─────────────────────────────────────────────────────────────────
const fetchConversations = () => api.get('/chat/conversations')
const fetchHistory       = (id) => api.get(`/chat/history/${id}`)
const fetchUsers         = (q) => api.get(`/chat/users?q=${encodeURIComponent(q)}`)

// ── Components ───────────────────────────────────────────────────────────────
function ConvItem({ conv, active, onClick, onDelete }) {
  return (
    <div className="relative group/item">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left pr-8 ${active ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
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
          <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-neutral-900 dark:text-neutral-100' : 'font-medium text-neutral-700 dark:text-neutral-300'}`}>
            {conv.nom}
          </p>
          <p className="text-xs text-neutral-400 truncate">{conv.lastMessage}</p>
        </div>
        <span className="text-[10px] text-neutral-300 shrink-0">{timeAgo(conv.lastDate)}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Supprimer la conversation"
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 text-neutral-300 hover:text-red-500"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { userId }                  = useParams()
  const { user }                    = useAuth()
  const { t }                       = useTranslation()
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
  const [modal, setModal]           = useState(null)
  const endRef                      = useRef()
  const socketRef                   = useRef(null)
  const activeUserIdRef             = useRef(null)

  // Keep ref in sync for use inside socket callbacks
  useEffect(() => { activeUserIdRef.current = activeUserId }, [activeUserId])

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

    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => {
        const next = prev.filter(m => m.id !== messageId)
        if (prev.length === next.length) return prev
        const lastMsg = next.length > 0 ? next[next.length - 1].message : ''
        const lastDate = next.length > 0 ? next[next.length - 1].date : new Date()
        setConvs(convs => convs.map(c => c.userId === activeUserIdRef.current ? { ...c, lastMessage: lastMsg, lastDate } : c))
        return next
      })
    })

    socket.on('chat_deleted', () => {
      setMessages([])
      setConvs(prev => prev.filter(c => c.userId !== activeUserIdRef.current))
      setActive(null)
      setActiveUser(null)
      setMobileList(true)
    })

    loadConversations()
    return () => socketService.disconnect()
  }, [])

  // Initialize chat from URL if provided
  useEffect(() => {
    if (userId && user && Number(userId) !== activeUserId) {
      api.get(`/chat/users/${userId}`)
        .then(u => openConv(u))
        .catch(e => console.error(e))
    }
  }, [userId, user?.id])

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
      setConvs(prev => {
        if (prev.find(c => c.userId === targetUser.id)) return prev;
        return [{ userId: targetUser.id, nom: targetUser.nom, avatar: targetUser.avatar, lastMessage: '', lastDate: new Date(), unread: 0 }, ...prev];
      })
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
    const msgText = text.trim()
    const tempId = Date.now()

    // Optimistic
    setMessages(prev => [...prev, {
      id: tempId, senderId: user.id, senderNom: user.nom,
      message: msgText, date: new Date(), lu: false
    }])
    setConvs(prev => prev.map(c => c.userId === activeUserId ? { ...c, lastMessage: msgText, lastDate: new Date() } : c))
    setText('')

    socketService.sendMessage(chatId, msgText).then(realMsg => {
      if (realMsg && realMsg.id) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: realMsg.id, date: realMsg.date } : m))
      }
    })
  }

  const deleteMessage = (messageId) => {
    if (!activeUserId) return
    const chatId = [user.id, activeUserId].sort().join('_')
    socketRef.current?.emit('delete_message', { messageId, chatId })
    // Optimistic
    setMessages(prev => {
      const next = prev.filter(m => m.id !== messageId)
      const lastMsg = next.length > 0 ? next[next.length - 1].message : ''
      const lastDate = next.length > 0 ? next[next.length - 1].date : new Date()
      setConvs(convs => convs.map(c => c.userId === activeUserId ? { ...c, lastMessage: lastMsg, lastDate } : c))
      return next
    })
  }

  const deleteChat = () => {
    if (!activeUserId) return
    const chatId = [user.id, activeUserId].sort().join('_')
    setModal({
      title: t('common.confirm', 'Confirmation'),
      message: t('chat.deleteConvConfirm', 'Supprimer toute la conversation ?'),
      confirmLabel: t('admin.delete', 'Supprimer'),
      onConfirm: () => {
        socketRef.current?.emit('delete_chat', { chatId })
        setMessages([])
        setConvs(prev => prev.filter(c => c.userId !== activeUserId))
        setActive(null)
        setActiveUser(null)
        setMobileList(true)
      }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ConfirmModal modal={modal} onClose={() => setModal(null)} />
      <div className="h-[calc(100vh-10rem)] flex gap-0 card overflow-hidden fade-in">

      {/* ── Left panel: conversation list ─────────────────────────── */}
      <div className={`
        flex flex-col border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900
        shadow-[2px_0_12px_0_rgba(0,0,0,0.07)] dark:shadow-[2px_0_12px_0_rgba(0,0,0,0.3)]
        ${showMobileList ? 'flex' : 'hidden'} md:flex
        w-full md:w-72 shrink-0
      `}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <MessageCircle size={15} className="text-primary-500" /> {t('chat.title', 'Messages')}
          </h2>
          <button
            onClick={() => setSearching(s => !s)}
            className={`btn-ghost p-1.5 rounded-lg ${searching ? 'bg-primary-50 text-primary-600' : ''}`}
            title={t('chat.newConv', 'Nouvelle conversation')}
          >
            {searching ? <X size={15} /> : <Plus size={15} />}
          </button>
        </div>

        {/* Search new user */}
        {searching && (
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                autoFocus
                className="input pl-8 py-2 text-sm"
                placeholder={t('chat.searchUser', 'Rechercher un utilisateur…')}
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
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left w-full"
                  >
                    <UserAvatar user={u} size="w-7 h-7" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{u.nom}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQ && searchResults.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-3">{t('chat.noUserFound', 'Aucun utilisateur trouvé')}</p>
            )}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">{t('chat.noConv', 'Aucune conversation')}</p>
              <p className="text-xs mt-1" dangerouslySetInnerHTML={{ __html: t('chat.clickToStart', 'Cliquez sur <strong>+</strong> pour commencer') }} />
            </div>
          ) : conversations.map(c => (
            <ConvItem
              key={c.userId}
              conv={c}
              active={c.userId === activeUserId}
              onClick={() => openConv({ id: c.userId, nom: c.nom, avatar: c.avatar })}
              onDelete={() => {
                setModal({
                  title: t('common.confirm', 'Confirmation'),
                  message: t('chat.deleteConvConfirm', 'Supprimer cette conversation ?'),
                  confirmLabel: t('admin.delete', 'Supprimer'),
                  onConfirm: () => {
                    const chatId = [user.id, c.userId].sort().join('_')
                    socketRef.current?.emit('delete_chat', { chatId })
                    setConvs(prev => prev.filter(x => x.userId !== c.userId))
                    if (activeUserId === c.userId) {
                      setMessages([])
                      setActive(null)
                      setActiveUser(null)
                      setMobileList(true)
                    }
                  }
                })
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: chat window ──────────────────────────────── */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-neutral-900 min-w-0 ${!showMobileList ? 'flex' : 'hidden'} md:flex`}>
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-300">
            <MessageCircle size={48} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">{t('chat.selectConv', 'Sélectionnez une conversation')}</p>
            <p className="text-xs mt-1 opacity-70">{t('chat.orClickToStart', 'ou cliquez sur + pour en démarrer une')}</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <button
                onClick={() => setMobileList(true)}
                className="md:hidden btn-ghost p-1"
              >
                <ArrowLeft size={18} />
              </button>
              <UserAvatar user={activeUser} size="w-9 h-9" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{activeUser?.nom}</p>
                <p className="text-xs text-neutral-400 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-neutral-300'}`} />
                  {connected ? t('chat.online', 'En ligne') : t('chat.offline', 'Hors ligne')}
                </p>
              </div>
              <button
                onClick={deleteChat}
                title="Supprimer la conversation"
                className="btn-ghost p-2 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {loadingHistory ? (
                <div className="flex-1 flex items-center justify-center text-neutral-300 text-sm">{t('common.loading', 'Chargement…')}</div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 mt-16">
                  <p className="text-sm">{t('chat.startConv', 'Démarrez la conversation !')}</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id
                const showDate = i === 0 || new Date(messages[i-1].date).toDateString() !== new Date(msg.date).toDateString()
                return (
                  <div key={msg.id || i}>
                    {showDate && (
                      <div className="text-center my-2">
                        <span className="text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                          {new Date(msg.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex gap-2 items-end group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <UserAvatar user={{ nom: msg.senderNom, avatar: msg.senderAvatar }} size="w-6 h-6" />
                      )}
                      <div className={`relative max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-sm'}`}>
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-neutral-400'}`}>
                          {msg.date ? timeAgo(msg.date) : t('chat.justNow', "À l'instant")}
                        </p>
                      </div>
                      {isMe && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-400 hover:text-red-500 shrink-0 mb-1"
                          title="Supprimer ce message"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 shrink-0">
              <input
                className="input flex-1 py-2.5"
                placeholder={t('chat.yourMessage', 'Votre message…')}
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
    </>
  )
}