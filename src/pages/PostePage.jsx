import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Flag, MessageCircle, Loader, Image, CornerDownRight, MoreHorizontal, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { forumService } from '../services/forumService'
import { useAuth } from '../context/AuthContext'
import { timeAgo, getInitials, formatDate } from '../utils/helpers'
import ReportModal from '../components/forum/ReportModal'
import ReactionPicker from '../components/forum/ReactionPicker'
import { UserAvatar } from '../components/layout/Navbar'

function MediaRenderer({ poste }) {
  if (poste.typeMedia === 'image' && poste.mediaUrl)
    return <img src={poste.mediaUrl} alt="Média" className="rounded-xl max-h-96 object-cover w-full" />
  if (poste.typeMedia === 'vocal' && poste.mediaUrl)
    return <audio controls src={poste.mediaUrl} className="w-full mt-2" />
  if (poste.typeMedia === 'video' && poste.mediaUrl)
    return <video controls src={poste.mediaUrl} className="rounded-xl w-full max-h-80" />
  return null
}

// ── 3-dot context menu ──────────────────────────────────────────────────────
function ThreeDotsMenu({ onReport, onMessage, canDelete, onDelete, isAuthor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700"
        title="Options"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-50 fade-in">
          {onMessage && (
            <button
              onClick={() => { onMessage(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <MessageSquare size={14} className="text-blue-500" /> Envoyer un message
            </button>
          )}
          {onReport && (
            <button
              onClick={() => { onReport(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <Flag size={14} className="text-orange-500" /> Signaler
            </button>
          )}
          {canDelete && (
            <>
              <div className="border-t border-neutral-100 my-1" />
              <button
                onClick={() => { onDelete(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Single comment (recursive for replies) ──────────────────────────────────
function CommentItem({ comment, onReport, onDelete, onReply, currentUserId, isModOrAdmin, isAdmin, depth = 0 }) {
  const [likesCount, setLikesCount]         = useState(comment.likesCount || 0)
  const [reactionCounts, setReactionCounts] = useState(comment.reactionCounts || {})
  const [userReaction, setUserReaction]     = useState(comment.userReaction || null)
  const [replying, setReplying]             = useState(false)
  const [replyText, setReplyText]           = useState('')
  const [sending, setSending]               = useState(false)
  const navigate = useNavigate()

  // Always show real nickname and avatar
  const displayUser = { nom: comment.auteurNom || 'Anonyme', avatar: comment.auteurAvatar || null }
  const isAuthor  = currentUserId && comment.auteurId === currentUserId
  const canDelete = isAuthor || isModOrAdmin

  const handleReact = async (emoji) => {
    const prev = userReaction
    const prevCounts = { ...reactionCounts }
    // Optimistic update
    const newCounts = { ...reactionCounts }
    if (prev) newCounts[prev] = Math.max(0, (newCounts[prev] || 1) - 1)
    if (emoji !== prev) {
      newCounts[emoji] = (newCounts[emoji] || 0) + 1
      setUserReaction(emoji)
    } else {
      setUserReaction(null)
    }
    setReactionCounts(newCounts)
    setLikesCount(Object.values(newCounts).reduce((a, b) => a + b, 0))

    forumService.toggleLikeCommentaire(comment.id, emoji).catch(() => {
      setReactionCounts(prevCounts)
      setUserReaction(prev)
    })
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSending(true)
    try {
      await onReply(comment.id, replyText)
      setReplyText('')
      setReplying(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`flex items-start gap-3 fade-in ${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      {depth > 0 && <CornerDownRight size={14} className="text-neutral-300 mt-2.5 shrink-0" />}
      <UserAvatar user={displayUser} size="w-7 h-7" />
      <div className="flex-1 group">
        <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-700">{displayUser.nom}</span>
              <span className="text-xs text-neutral-400">{timeAgo(comment.date)}</span>
            </div>
            {currentUserId && (
              <ThreeDotsMenu
                onReport={!isAuthor ? () => onReport({ type: 'commentaire', id: comment.id }) : null}
                onMessage={!isAuthor && comment.auteurId ? () => navigate(`/chat/${comment.auteurId}`) : null}
                canDelete={canDelete}
                onDelete={() => onDelete(comment.id)}
                isAuthor={isAuthor}
              />
            )}
          </div>
          <p className="text-sm text-neutral-800 leading-relaxed">{comment.contenu}</p>
          {comment.mediaUrl && comment.typeMedia === 'image' && (
            <img src={comment.mediaUrl} alt="" className="rounded-lg mt-2 max-h-40 object-cover" />
          )}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-neutral-100">
            <ReactionPicker
              userReaction={userReaction}
              counts={reactionCounts}
              total={likesCount}
              onReact={handleReact}
              size="sm"
              disabled={!currentUserId}
            />
            {/* Reply button — only for top-level comments */}
            {currentUserId && depth === 0 && (
              <button
                onClick={() => setReplying(r => !r)}
                className="text-xs text-neutral-400 hover:text-primary-600 transition-colors flex items-center gap-1"
              >
                <CornerDownRight size={12} /> Répondre
              </button>
            )}
          </div>
        </div>

        {/* Reply input */}
        {replying && (
          <form onSubmit={handleReply} className="mt-2 flex gap-2 items-center">
            <input
              autoFocus
              className="input text-sm py-2 flex-1"
              placeholder="Votre réponse…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <button type="submit" className="btn-primary text-xs py-2" disabled={sending || !replyText.trim()}>
              <Send size={13} />
            </button>
            <button type="button" onClick={() => setReplying(false)} className="btn-secondary text-xs py-2">
              Annuler
            </button>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {comment.replies.map(r => (
              <CommentItem
                key={r.id}
                comment={r}
                onReport={onReport}
                onDelete={onDelete}
                onReply={onReply}
                currentUserId={currentUserId}
                isModOrAdmin={isModOrAdmin}
                isAdmin={isAdmin}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function PostePage() {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const [poste, setPoste]   = useState(null)
  const [likes, setLikes]               = useState(0)
  const [reactionCounts, setReactionCounts] = useState({})
  const [userReaction, setUserReaction]     = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentFile, setCommentFile] = useState(null)
  const [sending, setSending]   = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const fileRef = useRef()
  const { user, isAdmin, isModerator } = useAuth()
  const isModOrAdmin = isAdmin || isModerator

  useEffect(() => {
    setLoading(true)
    Promise.all([forumService.getPoste(id), forumService.getCommentaires(id)])
      .then(([p, c]) => {
        setPoste(p)
        setLikes(p.likesCount || 0)
        setReactionCounts(p.reactionCounts || {})
        setUserReaction(p.userReaction || null)
        setComments(c)
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [id])

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() && !commentFile) return
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('contenu', newComment)
      if (commentFile) {
        fd.append('media', commentFile)
        if (commentFile.type.startsWith('image/')) fd.append('typeMedia', 'image')
        else if (commentFile.type.startsWith('video/')) fd.append('typeMedia', 'video')
        else if (commentFile.type.startsWith('audio/')) fd.append('typeMedia', 'vocal')
      }
      const c = await forumService.ajouterCommentaire(id, fd)
      setComments(prev => [...prev, { ...c, replies: [] }])
      setNewComment('')
      setCommentFile(null)
    } catch {
      toast.error("Impossible d'ajouter le commentaire")
    } finally {
      setSending(false)
    }
  }

  // Reply to a specific comment
  const handleReply = async (parentId, contenu) => {
    try {
      const fd = new FormData()
      fd.append('contenu', contenu)
      fd.append('parentId', parentId)
      const reply = await forumService.ajouterCommentaire(id, fd)
      // Add reply under the correct parent
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), { ...reply, replies: [] }] }
          : c
      ))
    } catch {
      toast.error("Impossible d'ajouter la réponse")
    }
  }

  const handleDeleteComment = async (cid) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    try {
      await forumService.supprimerCommentaire(cid)
      // Remove from top-level or from replies
      setComments(prev => prev
        .filter(c => c.id !== cid)
        .map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== cid) }))
      )
      toast.success('Commentaire supprimé')
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDeletePoste = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce poste ?')) return
    try {
      await forumService.supprimerPoste(id)
      toast.success('Poste supprimé')
      window.location.href = `/sujets/${poste.sujetId}`
    } catch {
      toast.error('Impossible de supprimer ce poste')
    }
  }

  const handleReactPoste = (emoji) => {
    const prev = userReaction
    const prevCounts = { ...reactionCounts }
    const newCounts = { ...reactionCounts }
    if (prev) newCounts[prev] = Math.max(0, (newCounts[prev] || 1) - 1)
    if (emoji !== prev) {
      newCounts[emoji] = (newCounts[emoji] || 0) + 1
      setUserReaction(emoji)
    } else {
      setUserReaction(null)
    }
    setReactionCounts(newCounts)
    setLikes(Object.values(newCounts).reduce((a, b) => a + b, 0))
    forumService.toggleLikePoste(id, emoji).catch(() => {
      setReactionCounts(prevCounts)
      setUserReaction(prev)
    })
  }

  if (loading) return <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-neutral-300" /></div>
  if (!poste)  return <div className="text-center py-20 text-neutral-400">Post introuvable.</div>

  return (
    <div className="flex flex-col gap-6 fade-in">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors w-fit">
        <ArrowLeft size={15} /> Retour
      </Link>

      {/* Post card */}
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <UserAvatar user={{ nom: poste.auteurNom, avatar: poste.auteurAvatar }} size="w-10 h-10" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-900">{poste.auteurNom || 'Anonyme'}</p>
            <p className="text-xs text-neutral-400">{formatDate(poste.datePublication)}</p>
          </div>
          {user && (
            <ThreeDotsMenu
              onReport={user.id !== poste.auteurId ? () => setReportTarget({ type: 'poste', id: poste.id }) : null}
              onMessage={user.id !== poste.auteurId && poste.auteurId ? () => navigate(`/chat/${poste.auteurId}`) : null}
              canDelete={user.id === poste.auteurId || isAdmin || isModerator}
              onDelete={handleDeletePoste}
              isAuthor={user.id === poste.auteurId}
            />
          )}
        </div>

        {poste.titre && <h1 className="text-lg font-bold text-neutral-900 mb-3">{poste.titre}</h1>}
        <p className="text-neutral-800 leading-relaxed mb-4">{poste.contenu}</p>
        <MediaRenderer poste={poste} />

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-neutral-100">
          <ReactionPicker
            userReaction={userReaction}
            counts={reactionCounts}
            total={likes}
            onReact={handleReactPoste}
            size="md"
            disabled={!user}
          />
        </div>
      </div>

      {/* Comments section */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <MessageCircle size={15} /> {comments.length} Commentaire{comments.length !== 1 ? 's' : ''}
        </h2>

        <div className="flex flex-col gap-4">
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              onReport={setReportTarget}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              currentUserId={user?.id}
              isModOrAdmin={isModOrAdmin}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {/* New comment box */}
        {user ? (
          <form onSubmit={handleComment} className="mt-6 card p-4">
            <textarea
              className="input resize-none mb-3"
              rows={3}
              placeholder="Votre commentaire…"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost p-2" title="Ajouter image">
                <Image size={16} />
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => setCommentFile(e.target.files[0])} />
              {commentFile && <span className="text-xs text-neutral-500 flex-1 truncate">{commentFile.name}</span>}
              <button type="submit" className="btn-primary ml-auto" disabled={sending || (!newComment.trim() && !commentFile)}>
                <Send size={14} /> {sending ? 'Envoi…' : 'Commenter'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 card p-5 text-center text-sm text-neutral-400">
            <Link to="/auth" className="text-primary-600 font-medium hover:underline">Connectez-vous</Link> pour commenter.
          </div>
        )}
      </div>

      {reportTarget && <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />}
    </div>
  )
}