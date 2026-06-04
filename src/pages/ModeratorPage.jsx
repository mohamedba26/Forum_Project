import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Trash2, Loader, MessageSquare, FileText, BookOpen, ArrowLeft, Clock, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../services/forumService'
import { adminService } from '../services/adminService'
import { timeAgo, truncate, getDynamicTopicStyles } from '../utils/helpers'

const tabs = [
  { id: 'sujets',       labelKey: 'forum.topics',        icon: BookOpen },
  { id: 'postes',       labelKey: 'moderator.pendingPosts', icon: FileText },
  { id: 'signalements', labelKey: 'moderator.reports',      icon: Flag },
]

export default function ModeratorPage() {
  const { t }                   = useTranslation()
  const [tab, setTab]           = useState('sujets')
  const [mesSujets, setMesSujets] = useState([])
  const [selectedSujet, setSelectedSujet] = useState(null)  // { id, titre }
  const [sujetPostes, setSujetPostes]     = useState([])
  const [postes, setPostes]     = useState([])
  const [comments, setComments] = useState([])
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading]   = useState(true)
  const [loadingPostes, setLoadingPostes] = useState(false)

  // Load moderator's sujets + pending posts + comments
  useEffect(() => {
    setLoading(true)
    Promise.all([
      forumService.getMesSujets(),
      forumService.getPostesEnAttente(),
      forumService.getCommentairesEnAttente(),
      adminService.getModoRapports(),
    ])
      .then(([sujets, p, c, sig]) => {
        setMesSujets(sujets)
        setPostes(p)
        setComments(c)
        setSignalements(sig)
      })
      .catch(() => toast.error(t('common.errorLoading', 'Erreur de chargement')))
      .finally(() => setLoading(false))
  }, [])

  // When a sujet is selected, load all its posts (valide + en_attente)
  const openSujet = async (sujet) => {
    setSelectedSujet(sujet)
    setLoadingPostes(true)
    try {
      // Fetch without statut filter — backend returns all non-supprime for modo
      const postes = await forumService.getPostes(sujet.id, {})
      setSujetPostes(postes)
    } catch {
      toast.error(t('moderator.errorLoadingPosts', 'Impossible de charger les posts'))
    } finally {
      setLoadingPostes(false)
    }
  }

  const traiterSignalement = async (reportId) => {
    try {
      await adminService.traiterRapport(reportId)
      setSignalements(s => s.filter(x => x.id !== reportId))
      toast.success(t('moderator.contentDeleted', 'Contenu supprimé ✓'))
    } catch { toast.error(t('common.error', 'Erreur')) }
  }

  const ignorerSignalement = async (reportId) => {
    try {
      await adminService.ignorerRapport(reportId)
      setSignalements(s => s.filter(x => x.id !== reportId))
      toast.success(t('moderator.reportIgnored', 'Signalement ignoré'))
    } catch { toast.error(t('common.error', 'Erreur')) }
  }

  const validerPoste = async (id) => {
    try {
      await forumService.validerPoste(id)
      // Update in both lists
      setPostes(p => p.filter(x => x.id !== id))
      setSujetPostes(p => p.map(x => x.id === id ? { ...x, statut: 'valide' } : x))
      toast.success(t('admin.postValidated', 'Post validé ✓'))
    } catch { toast.error(t('common.error', 'Erreur')) }
  }

  const supprimerPoste = async (id) => {
    try {
      await forumService.supprimerPoste(id)
      setPostes(p => p.filter(x => x.id !== id))
      setSujetPostes(p => p.filter(x => x.id !== id))
      toast.success(t('admin.postDeleted', 'Post supprimé'))
    } catch { toast.error(t('common.error', 'Erreur')) }
  }

  const supprimerComment = async (id) => {
    try {
      await forumService.supprimerCommentaire(id)
      setComments(c => c.filter(x => x.id !== id))
      toast.success(t('moderator.commentDeleted', 'Commentaire supprimé'))
    } catch { toast.error(t('common.error', 'Erreur')) }
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('moderator.title', 'Espace modération')}</h1>
        <p className="text-sm text-neutral-400 mt-0.5">{t('moderator.subtitle', 'Gérez les contenus de vos sujets assignés')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(tabItem => {
          const Icon = tabItem.icon
          const count = tabItem.id === 'sujets' ? mesSujets.length
                      : tabItem.id === 'postes' ? postes.length
                      : tabItem.id === 'commentaires' ? comments.length
                      : signalements.length
          return (
            <button key={tabItem.id} onClick={() => { setTab(tabItem.id); setSelectedSujet(null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${tab === tabItem.id ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300'}`}>
              <Icon size={15} /> {t(tabItem.labelKey)}
              {count > 0 && (
                <span className="ml-1 bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-md">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-neutral-300" /></div>
      ) : (
        <>
          {/* ── MES SUJETS TAB ──────────────────────────────────────────── */}
          {tab === 'sujets' && !selectedSujet && (
            <div className="flex flex-col gap-3">
              {mesSujets.length === 0 ? (
                <div className="card p-12 text-center text-neutral-400 text-sm border-dashed shadow-none">
                  {t('moderator.noSubjects', "Vous n'avez aucun sujet assigné pour le moment.")}
                </div>
              ) : (
                mesSujets.map(s => {
                  const { colorClass, Icon: TopicIcon } = getDynamicTopicStyles(s.titre)
                  const pendingCount = postes.filter(p => p.sujetId === s.id || p.sujetTitre === s.titre).length
                  return (
                    <button
                      key={s.id}
                      onClick={() => openSujet(s)}
                      className="card p-5 fade-in text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} shrink-0`}>
                            {TopicIcon && <TopicIcon size={18} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 transition-colors">
                                {s.titre}
                              </p>
                              {s.statut === 'en_attente' && (
                                <span className="badge badge-amber text-[10px]">⏳ {t('status.pending', 'En attente')}</span>
                              )}
                            </div>
                            {s.description && (
                              <p className="text-xs text-neutral-500 mt-0.5 truncate">{s.description}</p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                              <Clock size={10} /> {timeAgo(s.dateCreation)}
                              <span className="mx-1">·</span>
                              {s.nombrePostes ?? 0} {t('admin.posts', 'posts')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {pendingCount > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                              {pendingCount} {t('moderator.pending', 'en attente')}
                            </span>
                          )}
                          <span className="text-neutral-300 group-hover:text-primary-400 text-lg">›</span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {/* ── SUJET DETAIL VIEW (posts list) ──────────────────────────── */}
          {tab === 'sujets' && selectedSujet && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setSelectedSujet(null)}
                className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 transition-colors w-fit"
              >
                <ArrowLeft size={15} /> {t('moderator.backToSubjects', 'Retour à mes sujets')}
              </button>

              <div className="card p-4 bg-neutral-50">
                <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">{selectedSujet.titre}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{sujetPostes.length} {t('admin.posts', 'posts')} ({t('moderator.allStatuses', 'tous statuts')})</p>
              </div>

              {loadingPostes ? (
                <div className="flex justify-center py-10"><Loader size={22} className="animate-spin text-neutral-300" /></div>
              ) : sujetPostes.length === 0 ? (
                <div className="card p-10 text-center text-neutral-400 text-sm border-dashed shadow-none">
                  {t('moderator.noPostsInSubject', 'Aucun post dans ce sujet.')}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sujetPostes.map(p => (
                    <div key={p.id} className={`card p-5 fade-in ${p.statut === 'en_attente' ? 'border-l-4 border-amber-400 bg-amber-50/20' : 'border-l-4 border-green-400'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{p.titre}</p>
                            {p.statut === 'en_attente'
                              ? <span className="badge badge-amber text-[10px]">⏳ {t('status.pending', 'En attente')}</span>
                              : <span className="badge badge-green text-[10px]">{t('status.validated', '✓ Validé')}</span>
                            }
                          </div>
                          <p className="text-xs text-neutral-500 mb-1">{truncate(p.contenu, 150)}</p>
                          <p className="text-xs text-neutral-400">{p.auteurNom || t('moderator.anonymous', 'Anonyme')} · {timeAgo(p.datePublication)}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {p.statut === 'en_attente' && (
                            <button onClick={() => validerPoste(p.id)} className="btn-primary text-xs py-1.5">
                              <CheckCircle size={13} /> {t('admin.validate', 'Valider')}
                            </button>
                          )}
                          <button onClick={() => supprimerPoste(p.id)} className="btn-danger text-xs py-1.5">
                            <Trash2 size={13} /> {t('admin.delete', 'Supprimer')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── POSTS EN ATTENTE TAB ────────────────────────────────────── */}
          {tab === 'postes' && (
            <div className="flex flex-col gap-3">
              {postes.length === 0 ? (
                <div className="card p-12 text-center text-neutral-400 text-sm border-dashed shadow-none">
                  {t('moderator.noPendingPosts', '✓ Aucun post en attente de modération.')}
                </div>
              ) : postes.map(p => (
                <div key={p.id} className="card p-5 fade-in border-l-4 border-amber-400 bg-amber-50/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {p.sujetTitre && (
                          <span className="badge badge-blue text-[10px]">{p.sujetTitre}</span>
                        )}
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{p.titre}</p>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">{truncate(p.contenu, 200)}</p>
                      <p className="text-xs text-neutral-400">{p.auteurNom || t('moderator.anonymous', 'Anonyme')} · {timeAgo(p.datePublication)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => validerPoste(p.id)} className="btn-primary text-xs py-1.5">
                        <CheckCircle size={13} /> {t('admin.validate', 'Valider')}
                      </button>
                      <button onClick={() => supprimerPoste(p.id)} className="btn-danger text-xs py-1.5">
                        <Trash2 size={13} /> {t('admin.delete', 'Supprimer')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── COMMENTAIRES TAB ────────────────────────────────────────── */}
          {tab === 'commentaires' && (
            <div className="flex flex-col gap-3">
              {comments.length === 0 ? (
                <div className="card p-12 text-center text-neutral-400 text-sm border-dashed shadow-none">
                  {t('moderator.noReportedComments', '✓ Aucun commentaire signalé.')}
                </div>
              ) : comments.map(c => (
                <div key={c.id} className="card p-5 fade-in">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">{c.auteurNom || t('moderator.anonymous', 'Anonyme')} · {timeAgo(c.date)}</p>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200">{truncate(c.contenu, 200)}</p>
                    </div>
                    <button onClick={() => supprimerComment(c.id)} className="btn-danger text-xs py-1.5 shrink-0">
                      <Trash2 size={13} /> {t('admin.delete', 'Supprimer')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SIGNALEMENTS TAB ─────────────────────────────────────── */}
          {tab === 'signalements' && (
            <div className="flex flex-col gap-3">
              {signalements.length === 0 ? (
                <div className="card p-12 text-center text-neutral-400 text-sm border-dashed shadow-none">
                  {t('moderator.noPendingReports', '✓ Aucun signalement en attente.')}
                </div>
              ) : signalements.map(s => (
                <div key={s.id} className={`card p-5 fade-in border-l-4 ${s.type === 'poste' ? 'border-orange-400 bg-orange-50/20' : 'border-yellow-400 bg-yellow-50/20'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.type === 'poste' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          🚩 {s.type === 'poste' ? t('moderator.postType', 'Post') : t('moderator.commentType', 'Commentaire')}
                        </span>
                        {s.sujetTitre && (
                          <span className="text-[10px] text-neutral-400 font-medium">#{s.sujetTitre}</span>
                        )}
                        <span className="text-[10px] text-neutral-400">{timeAgo(s.date)}</span>
                      </div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-0.5">{t('moderator.reason', 'Motif :')} {s.raison}</p>
                      {s.detail && <p className="text-xs text-neutral-500 mb-1">"{s.detail}"</p>}
                      {(s.type === 'commentaire' ? s.contenu : s.posteTitre) && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2 mt-1 italic">
                          {truncate(s.type === 'commentaire' ? s.contenu : s.posteTitre, 160)}
                        </p>
                      )}
                      {s.type === 'commentaire' && s.posteTitre && (
                        <p className="text-xs text-neutral-400 mt-1">{t('moderator.post', 'Post :')} <span className="font-medium text-neutral-600 dark:text-neutral-300">{s.posteTitre}</span></p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => traiterSignalement(s.id)} className="btn-danger text-xs py-1.5">
                        <Trash2 size={13} /> {t('admin.delete', 'Supprimer')}
                      </button>
                      <button onClick={() => ignorerSignalement(s.id)} className="btn-secondary text-xs py-1.5">
                        {t('moderator.ignore', 'Ignorer')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}