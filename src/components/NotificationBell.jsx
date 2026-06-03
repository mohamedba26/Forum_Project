import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, Check } from 'lucide-react'
import { forumService } from '../services/forumService'
import { timeAgo } from '../utils/helpers'

const TYPE_ICONS = {
  report_post:    '🚩',
  report_comment: '🚩',
  user_flagged:   '⚠️',
  comment:        '💬',
  reply:          '↩️',
  like:           '👍',
}

export default function NotificationBell() {
  const [notifs, setNotifs]   = useState([])
  const [open, setOpen]       = useState(false)
  const ref                   = useRef()
  const navigate              = useNavigate()

  const unread = notifs.filter(n => !n.lu).length

  useEffect(() => {
    loadNotifs()
    const interval = setInterval(loadNotifs, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifs = async () => {
    try {
      const data = await forumService.getNotifications()
      setNotifs(data)
    } catch {}
  }

  const markRead = async (id) => {
    try {
      await forumService.marquerNotifLue(id)
      setNotifs(n => n.map(x => x.id === id ? { ...x, lu: true } : x))
    } catch {}
  }

  const handleNotifClick = async (n) => {
  if (!n.lu) await markRead(n.id)

  if (n.posteId) {
    setOpen(false)
    navigate(`/postes/${n.posteId}`)
  }
}

  const markAllRead = async () => {
  try {
    await forumService.marquerToutesLues()
    setNotifs(n => n.map(x => ({ ...x, lu: true })))
  } catch (error) {
    console.error(error)
  }
}

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost p-2 relative"
        title="Notifications"
      >
        <Bell size={18} className="text-neutral-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-sm font-semibold text-neutral-800">Notifications</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1">
                  <Check size={11} /> Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="btn-ghost p-1"><X size={14} /></button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-sm text-neutral-400">
                Aucune notification
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-neutral-50 transition-colors hover:bg-neutral-50 ${!n.lu ? 'bg-blue-50/40' : ''} ${n.posteId ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${!n.lu ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(n.date)}</p>
                </div>
                {!n.lu && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}