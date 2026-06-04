import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../services/forumService'
import { timeAgo, truncate, TOPIC_MAP } from '../utils/helpers'
import ConfirmModal from '../components/ConfirmModal'

const tabs = [
  { id: 'postes', labelKey: 'myActivity.myPosts' },
  { id: 'commentaires', labelKey: 'myActivity.myComments' },
  { id: 'reactions', labelKey: 'myActivity.myReactions' }
]

const STATUT_BADGE = {
  en_attente: { labelKey: 'status.pending',  cls: 'badge-amber', icon: AlertCircle },
  valide:     { labelKey: 'status.validated',      cls: 'badge-green', icon: CheckCircle },
  supprime:   { labelKey: 'status.deleted',    cls: 'badge-red',   icon: AlertCircle },
}

export default function MesPostesPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('postes')
  const [postes, setPostes] = useState([])
  const [sujets, setSujets] = useState([])
  const [commentaires, setCommentaires] = useState([])
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      forumService.getMesPostes().catch(() => []),
      forumService.getMesSujets().catch(() => []),
      forumService.getMesCommentaires().catch(() => []),
      forumService.getMesReactions().catch(() => [])
    ])
      .then(([p, s, c, r]) => {
        setPostes(p)
        setSujets(s)
        setCommentaires(c)
        setReactions(r)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDeletePoste = (id) => {
    setModal({
      title: t('common.confirm', 'Confirmation'),
      message: t('myActivity.confirmDeletePost', 'Supprimer ce post définitivement ?'),
      onConfirm: async () => {
        try {
          await forumService.supprimerPoste(id)
          setPostes(p => p.filter(x => x.id !== id))
          toast.success(t('myActivity.postDeleted', 'Post supprimé'))
        } catch {
          toast.error(t('common.error', 'Erreur'))
        }
      }
    })
  }

  const handleDeleteSujet = (id) => {
    setModal({
      title: t('common.confirm', 'Confirmation'),
      message: t('myActivity.confirmDeleteSubject', 'Supprimer ce sujet définitivement ?'),
      onConfirm: async () => {
        try {
          await forumService.supprimerSujet(id)
          setSujets(s => s.filter(x => x.id !== id))
          toast.success(t('myActivity.subjectDeleted', 'Sujet supprimé'))
        } catch {
          toast.error(t('common.error', 'Erreur'))
        }
      }
    })
  }

  return (
    <>
      <ConfirmModal modal={modal} onClose={() => setModal(null)} />
      <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('myActivity.title', 'Mon activité')}</h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          {t('myActivity.subtitle', "Suivez l'état de vos propositions de sujets et de vos postes")}
        </p>
      </div>

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {tabs.map(tabItem => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === tabItem.id ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300'}`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-neutral-300" /></div>
      ) : tab === 'postes' && postes.length === 0 ? (
        <div className="card p-12 text-center text-neutral-400 text-sm">
          {t('myActivity.noPosts', "Vous n'avez pas encore de postes.")}
        </div>
      ) : tab === 'sujets' && sujets.length === 0 ? (
        <div className="card p-12 text-center text-neutral-400 text-sm">
          {t('myActivity.noSubjects', "Vous n'avez pas encore proposé de sujets.")}
        </div>
      ) : tab === 'commentaires' && commentaires.length === 0 ? (
        <div className="card p-12 text-center text-neutral-400 text-sm">
          {t('myActivity.noComments', "Vous n'avez pas encore posté de commentaires.")}
        </div>
      ) : tab === 'reactions' && reactions.length === 0 ? (
        <div className="card p-12 text-center text-neutral-400 text-sm">
          {t('myActivity.noReactions', "Vous n'avez réagi à aucun contenu.")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tab === 'postes' && postes.map(p => {
            const s = STATUT_BADGE[p.statut] || STATUT_BADGE.en_attente
            const Icon = s.icon
            return (
              <div key={p.id} className="card p-5 fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`${s.cls} flex items-center gap-1`}>
                        <Icon size={11} /> {t(s.labelKey)}
                      </span>
                      <span className="badge badge-gray flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(p.datePublication)}
                      </span>
                    </div>
                    <Link to={`/postes/${p.id}`} className="text-sm text-neutral-800 dark:text-neutral-200 hover:text-primary-600 leading-relaxed block">
                      {truncate(p.contenu, 180)}
                    </Link>
                  </div>
                  <button onClick={() => handleDeletePoste(p.id)} className="btn-ghost p-2 text-neutral-400 hover:text-red-500 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}

          {tab === 'sujets' && sujets.map(sujet => {
            const s = STATUT_BADGE[sujet.statut] || STATUT_BADGE.en_attente
            const StatusIcon = s.icon
            const topic = TOPIC_MAP[sujet.categorie]
            return (
              <div key={sujet.id} className="card p-5 fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`${s.cls} flex items-center gap-1`}>
                        <StatusIcon size={11} /> {t(s.labelKey)}
                      </span>
                      {topic && (
                        <span className={topic.color}>
                          {(() => { const Icon = topic.icon; return <Icon size={12} className="mr-1 inline-block align-text-bottom" />; })()}
                          {topic.label}
                        </span>
                      )}
                      <span className="badge badge-gray flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(sujet.dateCreation)}
                      </span>
                    </div>
                    <Link to={`/?topic=${encodeURIComponent(sujet.titre.toLowerCase())}`} className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 leading-relaxed block mb-1">
                      {sujet.titre}
                    </Link>
                    {sujet.description && (
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {truncate(sujet.description, 180)}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteSujet(sujet.id)} className="btn-ghost p-2 text-neutral-400 hover:text-red-500 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}

          {tab === 'commentaires' && commentaires.map(c => (
            <div key={c.id} className="card p-5 fade-in">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap text-sm text-neutral-500">
                    <span className="badge badge-gray flex items-center gap-1">
                      <Clock size={11} /> {timeAgo(c.date)}
                    </span>
                    <span>
                      {t('myActivity.commentedOn')} <Link to={c.posteId ? `/postes/${c.posteId}` : '#'} className="font-semibold text-neutral-700 dark:text-neutral-300 hover:text-primary-600 truncate max-w-[200px] inline-block align-bottom">{c.posteTitre || t('myActivity.deletedItem')}</Link>
                    </span>
                  </div>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed mt-2">
                    {truncate(c.contenu, 180)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {tab === 'reactions' && reactions.map(r => (
            <div key={r.id} className="card p-4 fade-in flex items-center gap-4">
              <div className="text-2xl bg-neutral-100 dark:bg-neutral-800 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                {r.reaction}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-500 mb-1">
                  {t('myActivity.reactedTo')} {r.type === 'sujet' ? t('forum.topic', 'Sujet') : r.type === 'poste' ? t('admin.postType', 'Post') : t('admin.commentType', 'Commentaire')}
                </p>
                <Link 
                  to={r.targetId ? (r.type === 'sujet' ? '/' : `/postes/${r.targetId}`) : '#'} 
                  className="text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-primary-600 block truncate"
                >
                  {r.type === 'commentaire' ? truncate(r.contenu, 100) : truncate(r.targetTitre || t('myActivity.deletedItem', 'Élément supprimé'), 100)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
