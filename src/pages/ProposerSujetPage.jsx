import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Image, Mic, Video, FileText, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../services/forumService'
import { useTranslation } from 'react-i18next'

export default function ProposerSujetPage() {
  const { t }             = useTranslation()
  const [form, setForm]   = useState({ titre: '', contenu: '', sujetId: '' })
  const [file, setFile]     = useState(null)
  const [typeMedia, setTypeMedia] = useState('texte')
  const [loading, setLoading] = useState(false)
  const [sujetsList, setSujetsList] = useState([])
  const navigate = useNavigate()
  const fileRef = useRef()

  useEffect(() => {
    forumService.getSujets({ statut: 'valide' })
      .then(data => {
        setSujetsList(data)
      })
      .catch(() => toast.error(t('addPost.errorLoadSubjects', 'Impossible de charger les sujets')))
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sujetId) {
      toast.error(t('addPost.errorSelectSubject', 'Veuillez sélectionner un sujet'))
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('titre', form.titre)
      fd.append('contenu', form.contenu)
      fd.append('typeMedia', typeMedia)
      if (file) fd.append('media', file)
      
      await forumService.creerPoste(form.sujetId, fd)
      toast.success(t('addPost.postAdded', 'Post ajouté !'))
      navigate('/')
    } catch {
      toast.error(t('addPost.errorAddPost', 'Impossible de créer le poste'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl fade-in">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 mb-6 w-fit">
        <ArrowLeft size={15} /> {t('common.back', 'Retour')}
      </Link>

      <div className="card p-8">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{t('addPost.title', 'Ajouter un post')}</h1>
        <p className="text-sm text-neutral-400 mb-6">{t('addPost.subtitle', 'Partagez votre discussion avec la communauté.')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('addPost.subject', 'Sujet *')}</label>
            <select className="input" value={form.sujetId} onChange={set('sujetId')} required>
              <option value="">{t('addPost.selectSubject', 'Sélectionnez le sujet...')}</option>
              {sujetsList.map(sujet => (
                <option key={sujet.id} value={sujet.id}>{sujet.titre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('addPost.postTitle', 'Titre du post *')}</label>
            <input className="input" placeholder={t('addPost.postTitlePlaceholder', 'Ex : Comment apprendre Python en 2025 ?')} value={form.titre} onChange={set('titre')} required minLength={5} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('addPost.description', 'Description')}</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder={t('addPost.descriptionPlaceholder', 'Décrivez brièvement votre post…')}
              value={form.contenu}
              onChange={set('contenu')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('addPost.addMedia', 'Ajouter un média')}</label>
            <div className="flex gap-2 mb-3">
              {[
                { id: 'texte', label: t('mediaType.text', 'Texte'),  icon: FileText },
                { id: 'image', label: t('mediaType.image', 'Image'),  icon: Image    },
                { id: 'video', label: t('mediaType.video', 'Vidéo'),  icon: Video    }
              ].map(mediaTypeItem => {
                const Icon = mediaTypeItem.icon
                return (
                  <button key={mediaTypeItem.id} type="button" onClick={() => { setTypeMedia(mediaTypeItem.id); setFile(null) }}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${typeMedia === mediaTypeItem.id ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>
                    <Icon size={16} /> {mediaTypeItem.label}
                  </button>
                )
              })}
            </div>
            {typeMedia !== 'texte' && (
              <div className="mt-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-4 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                  <Upload size={20} />
                  <span className="text-sm">{file ? file.name : t('addPost.clickToSelectFile', 'Cliquez pour sélectionner un fichier')}</span>
                </button>
                <input 
                  ref={fileRef} 
                  type="file" 
                  accept={typeMedia === 'image' ? 'image/*' : typeMedia === 'vocal' ? 'audio/*' : 'video/*'} 
                  className="hidden" 
                  onChange={e => setFile(e.target.files[0])} 
                />
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary justify-center" disabled={loading}>
            {loading ? t('addPost.creating', 'Création en cours…') : t('addPost.addPostBtn', 'Ajouter le post')}
          </button>
        </form>
      </div>
    </div>
  )
}
