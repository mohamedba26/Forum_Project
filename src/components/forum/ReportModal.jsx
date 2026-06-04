import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../../services/forumService'

const RAISONS = [
  'Contenu inapproprié',
  'Harcèlement',
  'Spam',
  'Fausses informations',
  'Haine ou discrimination',
  'Autre',
]

const TYPE_LABELS = {
  utilisateur: 'cet utilisateur',
  poste:       'ce post',
  commentaire: 'ce commentaire',
}

export default function ReportModal({ target, onClose }) {
  // target = { type: 'utilisateur'|'poste'|'commentaire', id: number }
  const [raison, setRaison]   = useState('')
  const [detail, setDetail]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!raison) return toast.error('Choisissez une raison')
    setLoading(true)
    try {
      const payload = { id: target.id, raison, detail }
      if (target.type === 'utilisateur') {
        await forumService.reporterUtilisateur(payload)
      } else if (target.type === 'poste') {
        await forumService.reporterPoste(payload)
      } else {
        await forumService.reporterCommentaire(payload)
      }
      toast.success('Signalement envoyé. Le modérateur sera notifié.')
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors du signalement'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 fade-in">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            Signaler {TYPE_LABELS[target.type] || 'ce contenu'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Motif *</label>
            <div className="flex flex-col gap-1.5">
              {RAISONS.map(r => (
                <label key={r} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${raison === r ? 'border-red-300 bg-red-50 text-red-700' : 'border-neutral-200 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300'}`}>
                  <input type="radio" name="raison" value={r} className="sr-only" onChange={() => setRaison(r)} />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${raison === r ? 'border-red-500' : 'border-neutral-300'}`}>
                    {raison === r && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  </span>
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Précisions (optionnel)</label>
            <textarea className="input resize-none" rows={2} placeholder="Décrivez le problème…" value={detail} onChange={e => setDetail(e.target.value)} />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-danger" disabled={loading}>
              {loading ? 'Envoi…' : 'Signaler'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}