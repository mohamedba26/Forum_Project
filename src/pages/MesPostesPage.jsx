import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../services/forumService'
import { timeAgo, truncate, TOPIC_MAP } from '../utils/helpers'

const tabs = [
  { id: 'sujets', label: 'Mes sujets' },
  { id: 'postes', label: 'Mes postes' },
]

const STATUT_BADGE = {
  en_attente: { label: 'En attente',  cls: 'badge-amber', icon: AlertCircle },
  valide:     { label: 'Validé',      cls: 'badge-green', icon: CheckCircle },
  supprime:   { label: 'Supprimé',    cls: 'badge-red',   icon: AlertCircle },
}

export default function MesPostesPage() {
  const [tab, setTab] = useState('postes')
  const [postes, setPostes] = useState([])
  const [sujets, setSujets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      forumService.getMesPostes().catch(() => []),
      forumService.getMesSujets().catch(() => [])
    ])
      .then(([p, s]) => {
        setPostes(p)
        setSujets(s)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDeletePoste = async (id) => {
    if (!confirm('Supprimer ce post définitivement ?')) return
    try {
      await forumService.supprimerPoste(id)
      setPostes(p => p.filter(x => x.id !== id))
      toast.success('Post supprimé')
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDeleteSujet = async (id) => {
    if (!confirm('Supprimer ce sujet définitivement ?')) return
    try {
      await forumService.supprimerSujet(id)
      setSujets(s => s.filter(x => x.id !== id))
      toast.success('Sujet supprimé')
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Mon activité</h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Suivez l'état de vos propositions de sujets et de vos postes
        </p>
      </div>

      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-neutral-300" /></div>
      ) : tab === 'postes' && postes.length === 0 ? (
        <div className="card p-12 text-center text-neutral-400 text-sm">
          Vous n'avez pas encore de postes.
        </div>
      ) : tab === 'sujets' && sujets.length === 0 ? (
        <div className="card p-12 text-center text-neutral-400 text-sm">
          Vous n'avez pas encore proposé de sujets.
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
                        <Icon size={11} /> {s.label}
                      </span>
                      <span className="badge badge-gray flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(p.datePublication)}
                      </span>
                    </div>
                    <Link to={`/postes/${p.id}`} className="text-sm text-neutral-800 hover:text-primary-600 leading-relaxed block">
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
                        <StatusIcon size={11} /> {s.label}
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
                    <Link to={`/sujets/${sujet.id}`} className="text-sm font-semibold text-neutral-900 hover:text-primary-600 leading-relaxed block mb-1">
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
        </div>
      )}
    </div>
  )
}
