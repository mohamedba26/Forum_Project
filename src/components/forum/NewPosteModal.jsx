import { useState, useRef } from 'react'
import { X, Image, Mic, Video, FileText, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../../services/forumService'

const TYPES = [
  { id: 'texte', label: 'Texte',  icon: FileText },
  { id: 'image', label: 'Image',  icon: Image    },
  { id: 'video', label: 'Vidéo',  icon: Video    },
]

const ACCEPT = { image: 'image/*', vocal: 'audio/*', video: 'video/*' }

export default function NewPosteModal({ sujetId, onClose, onCreated }) {
  const [type, setType]     = useState('texte')
  const [titre, setTitre]   = useState('')
  const [contenu, setContenu] = useState('')
  const [file, setFile]     = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titre.trim()) return toast.error('Ajoutez un titre')
    if (!contenu.trim() && !file) return toast.error('Ajoutez du contenu')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('titre', titre)
      fd.append('contenu', contenu)
      fd.append('typeMedia', type)
      if (file) fd.append('media', file)
      const poste = await forumService.creerPoste(sujetId, fd)
      onCreated(poste)
    } catch {
      toast.error('Impossible de publier le post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 fade-in">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Nouveau post</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Type de contenu</label>
            <div className="flex gap-2">
              {TYPES.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} type="button" onClick={() => { setType(t.id); setFile(null) }}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${type === t.id ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>
                    <Icon size={18} /> {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Titre</label>
            <input
              className="input w-full"
              type="text"
              placeholder="Titre de votre post…"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              required
            />
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Contenu</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder={type === 'texte' ? 'Écrivez votre message…' : 'Décrivez votre média (optionnel)…'}
              value={contenu}
              onChange={e => setContenu(e.target.value)}
              required={type === 'texte'}
            />
          </div>

          {/* File upload for non-text types */}
          {type !== 'texte' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Fichier {type}
              </label>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                <Upload size={22} />
                <span className="text-sm">{file ? file.name : 'Cliquez pour sélectionner'}</span>
              </button>
              <input ref={fileRef} type="file" accept={ACCEPT[type]} className="hidden" onChange={e => setFile(e.target.files[0])} />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
