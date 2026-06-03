import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Clock, MessageSquare, Loader, Image, Mic, Video, FileText, ThumbsUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../services/forumService'
import { useAuth } from '../context/AuthContext'
import { TOPIC_MAP, timeAgo, truncate, getInitials, getDynamicTopicStyles } from '../utils/helpers'
import NewPosteModal from '../components/forum/NewPosteModal'

const TYPE_ICONS = { texte: FileText, image: Image, vocal: Mic, video: Video }

function PosteCard({ poste, isAdmin }) {
  const [likes, setLikes] = useState(poste.likesCount || 0);
  const [liked, setLiked] = useState(poste.userLiked || false);
  const TypeIcon = TYPE_ICONS[poste.typeMedia] || FileText
  const displayName = isAdmin ? (poste.auteurNom || 'Anonyme') : 'Anonyme';
  const displayAvatar = isAdmin ? getInitials(poste.auteurNom || 'AN') : 'A';
  
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLikes(l => liked ? l - 1 : l + 1);
    setLiked(l => !l);
    forumService.toggleLikePoste(poste.id).catch(() => {
      setLikes(l => liked ? l + 1 : l - 1);
      setLiked(l => !l);
      toast.error('Erreur lors du like');
    });
  };
  
  return (
    <Link to={`/postes/${poste.id}`} className="card p-5 hover:shadow-md transition-shadow block group fade-in">
      <div className="flex items-start gap-3">
        <div className={`avatar w-9 h-9 text-xs shrink-0 ${isAdmin ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
          {displayAvatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-xs text-neutral-400 flex-wrap">
            <span className="font-medium text-neutral-600">{displayName}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(poste.datePublication)}</span>
            <span className="flex items-center gap-1"><TypeIcon size={11} /> {poste.typeMedia}</span>
          </div>
          <p className="text-sm text-neutral-800 leading-relaxed group-hover:text-neutral-900">
            {truncate(poste.contenu)}
          </p>
          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-neutral-100/60">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md -ml-2 ${liked ? 'text-blue-500 bg-blue-50' : 'text-neutral-400 group-hover:text-blue-500 hover:bg-blue-50'}`}
            >
              <ThumbsUp size={14} className={liked ? 'fill-blue-500' : ''} />
              <span className="text-xs font-medium">{likes}</span>
            </button>
            <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-primary-500 transition-colors px-2 py-1">
              <MessageSquare size={14} />
              <span className="text-xs">{poste.nombreCommentaires ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function SujetPage() {
  const { id }            = useParams()
  const [sujet, setSujet] = useState(null)
  const [postes, setPostes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { user, isAdmin, isModerator } = useAuth()
  const isModOrAdmin = isAdmin || isModerator
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      forumService.getSujet(id),
      forumService.getPostes(id, { statut: 'valide' }),
    ])
      .then(([s, p]) => { 
        setSujet(s)
        setPostes(p)
        setLikes(s.likesCount || 0)
        setLiked(s.userLiked || false)
      })
      .catch(() => toast.error('Impossible de charger ce sujet'))
      .finally(() => setLoading(false))
  }, [id])

  const topic = sujet ? getDynamicTopicStyles(sujet.titre) : null

  const handlePosteCreated = (newPoste) => {
    setPostes(p => [newPoste, ...p])
    setShowModal(false)
    toast.success('Post publié, en attente de validation')
  }

  const handleLikeSujet = () => {
    if (!user) {
      toast.error('Connectez-vous pour aimer ce sujet');
      return;
    }
    setLikes(l => liked ? l - 1 : l + 1);
    setLiked(l => !l);
    forumService.toggleLikeSujet(id).catch(() => {
      setLikes(l => liked ? l + 1 : l - 1);
      setLiked(l => !l);
      toast.error('Erreur lors du like');
    });
  };

  const handleDeleteSujet = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce sujet ?')) return
    try {
      await forumService.supprimerSujet(id)
      toast.success('Sujet supprimé')
      window.location.href = '/'
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-neutral-300" /></div>

  return (
    <div className="flex flex-col gap-6 fade-in">
      {/* Back */}
      <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors w-fit">
        <ArrowLeft size={15} /> Retour
      </Link>

      {/* Header */}
      {sujet && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {topic && (
                <span className={`${topic.color} mb-3 inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-current/10 items-center`}>
                  {(() => { const Icon = topic.icon; return <Icon size={12} className="mr-1" />; })()}
                  {topic.label}
                </span>
              )}
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-xl font-bold text-neutral-900 mb-2 leading-snug">{sujet.titre}</h1>
                {isAdmin && (
                  <button onClick={handleDeleteSujet} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 shrink-0">
                    Supprimer le post
                  </button>
                )}
              </div>
              {sujet.description && <p className="text-sm text-neutral-600 leading-relaxed mt-2">{sujet.description}</p>}
              
              {/* Like / Comment counts for the POST */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-neutral-100/80">
                <button 
                  onClick={handleLikeSujet}
                  className={`flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-full text-xs font-semibold ${
                    liked 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                      : 'text-neutral-500 bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  <ThumbsUp size={14} className={liked ? 'fill-blue-600 text-blue-600' : 'text-neutral-400'} />
                  <span>{likes}</span>
                </button>
                <div className="flex items-center gap-1.5 text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <MessageSquare size={14} className="text-neutral-400" />
                  <span>{postes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-neutral-700 tracking-wide">{postes.length} post{postes.length !== 1 ? 's' : ''}</p>
          {user && (
            <button onClick={() => setShowModal(true)} className="btn-primary rounded-xl text-xs py-2 px-3 shadow-md shadow-primary-500/10">
              <Plus size={14} /> Ajouter un post
            </button>
          )}
        </div>
        {postes.length === 0 ? (
          <div className="card p-10 text-center text-neutral-400 text-sm border-dashed shadow-none">Soyez le premier à ajouter un post !</div>
        ) : (
          <div className="flex flex-col gap-3">
            {postes.map(p => <PosteCard key={p.id} poste={p} isAdmin={isAdmin} />)}
          </div>
        )}
      </div>

      {showModal && (
        <NewPosteModal sujetId={id} onClose={() => setShowModal(false)} onCreated={handlePosteCreated} />
      )}
    </div>
  )
}
