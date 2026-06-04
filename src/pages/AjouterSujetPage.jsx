import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, BookOpen, Cpu, Gavel, Trophy, Music, Coffee, Car, Heart, Globe, Code, PenTool, Hash, Gamepad2, Film, Plane, Users, ShoppingBag, Leaf, Star, Zap, Camera, Briefcase, Dumbbell } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumService } from '../services/forumService'

const ICON_OPTIONS = [
  { id: 'Hash',        Icon: Hash,        label: 'Général' },
  { id: 'BookOpen',    Icon: BookOpen,    label: 'Éducation' },
  { id: 'Cpu',         Icon: Cpu,         label: 'Tech' },
  { id: 'Gavel',       Icon: Gavel,       label: 'Juridique' },
  { id: 'Trophy',      Icon: Trophy,      label: 'Sport' },
  { id: 'Music',       Icon: Music,       label: 'Musique' },
  { id: 'Coffee',      Icon: Coffee,      label: 'Cuisine' },
  { id: 'Car',         Icon: Car,         label: 'Auto' },
  { id: 'Heart',       Icon: Heart,       label: 'Santé' },
  { id: 'Plane',       Icon: Plane,       label: 'Voyage' },
  { id: 'Code',        Icon: Code,        label: 'Dev' },
  { id: 'PenTool',     Icon: PenTool,     label: 'Art' },
  { id: 'Gamepad2',    Icon: Gamepad2,    label: 'Jeux' },
  { id: 'Film',        Icon: Film,        label: 'Cinéma' },
  { id: 'ShoppingBag', Icon: ShoppingBag, label: 'Shopping' },
  { id: 'Users',       Icon: Users,       label: 'Société' },
  { id: 'Globe',       Icon: Globe,       label: 'Monde' },
  { id: 'Leaf',        Icon: Leaf,        label: 'Nature' },
  { id: 'Star',        Icon: Star,        label: 'Actu' },
  { id: 'Zap',         Icon: Zap,         label: 'Énergie' },
  { id: 'Camera',      Icon: Camera,      label: 'Photo' },
  { id: 'Briefcase',   Icon: Briefcase,   label: 'Business' },
  { id: 'Dumbbell',    Icon: Dumbbell,    label: 'Fitness' },
]

const COLOR_OPTIONS = [
  { id: 'badge-blue',  label: 'Bleu',   bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-400',   dot: 'bg-blue-500' },
  { id: 'badge-pink',  label: 'Rose',   bg: 'bg-pink-100',   text: 'text-pink-700',   ring: 'ring-pink-400',   dot: 'bg-pink-500' },
  { id: 'badge-green', label: 'Vert',   bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-400',  dot: 'bg-green-500' },
  { id: 'badge-amber', label: 'Ambre',  bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-400',  dot: 'bg-amber-500' },
  { id: 'badge-red',   label: 'Rouge',  bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-400',    dot: 'bg-red-500' },
  { id: 'badge-gray',  label: 'Gris',   bg: 'bg-neutral-100',text: 'text-neutral-700 dark:text-neutral-300',ring: 'ring-neutral-400',dot: 'bg-neutral-400' },
]

export default function AjouterSujetPage() {
  const { t } = useTranslation()
  const [form, setForm]       = useState({ titre: '', description: '' })
  const [selectedIcon, setSelectedIcon] = useState('Hash')
  const [selectedColor, setSelectedColor] = useState('badge-blue')
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Encode icon+color as a meta prefix in description
      const metaPrefix = `__meta__${JSON.stringify({ icon: selectedIcon, color: selectedColor })}\n`
      const fullDescription = metaPrefix + (form.description || '')
      await forumService.proposerSujet({ titre: form.titre, description: fullDescription })
      toast.success(t('addSubject.toast.success', 'Sujet proposé ! En attente de validation par un admin.'))
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.message || t('addSubject.toast.error', "Impossible de proposer le sujet")
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const selectedColorObj = COLOR_OPTIONS.find(c => c.id === selectedColor) || COLOR_OPTIONS[0]
  const selectedIconObj  = ICON_OPTIONS.find(i => i.id === selectedIcon) || ICON_OPTIONS[0]
  const PreviewIcon = selectedIconObj.Icon

  return (
    <div className="max-w-xl fade-in">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 mb-6 w-fit">
        <ArrowLeft size={15} /> {t('common.back', 'Retour')}
      </Link>

      <div className="card p-8">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{t('addSubject.title', 'Proposer un sujet')}</h1>
        <p className="text-sm text-neutral-400 mb-2">
          {t('addSubject.subtitle', 'Proposez un nouveau sujet de discussion (ex : Musique, Cinéma, Voyage…).')}
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-amber-700 font-medium leading-relaxed">
            ⏳ {t('addSubject.info', 'Votre proposition sera examinée par un administrateur. Si elle est validée, vous deviendrez automatiquement le modérateur de ce sujet.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Nom du sujet */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('addSubject.topicName', 'Nom du sujet *')}</label>
            <input
              className="input"
              placeholder={t('addSubject.topicNamePlaceholder', 'Ex : Cuisine, Voyage, Musique…')}
              value={form.titre}
              onChange={set('titre')}
              required
              minLength={3}
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('addSubject.icon', 'Icône')}</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  title={t(`subjects.${label.toLowerCase()}`, label)}
                  onClick={() => setSelectedIcon(id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2
                    ${selectedIcon === id
                      ? `${selectedColorObj.bg} ${selectedColorObj.text} border-current shadow-sm scale-110`
                      : 'bg-neutral-50 text-neutral-400 border-transparent hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-300'
                    }`}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('addSubject.color', 'Couleur')}</label>
            <div className="flex gap-3 flex-wrap">
              {COLOR_OPTIONS.map(({ id, label, dot, ring }) => (
                <button
                  key={id}
                  type="button"
                  title={t(`colors.${label.toLowerCase()}`, label)}
                  onClick={() => setSelectedColor(id)}
                  className={`w-8 h-8 rounded-full transition-all border-2 flex items-center justify-center
                    ${dot}
                    ${selectedColor === id ? `ring-2 ring-offset-2 ${ring} border-white scale-110` : 'border-white hover:scale-105'}`}
                />
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
            <p className="text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">{t('addSubject.preview', 'Aperçu')}</p>
            <span className={`${selectedColorObj.id} px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`}>
              <PreviewIcon size={12} />
              {form.titre || t('addSubject.topicNameDefault', 'Nom du sujet')}
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t('addSubject.description', 'Description')} <span className="text-neutral-400 font-normal">({t('addSubject.optional', 'facultatif')})</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder={t('addSubject.descriptionPlaceholder', 'Décrivez brièvement ce sujet…')}
              value={form.description}
              onChange={set('description')}
            />
          </div>

          <button type="submit" className="btn-primary justify-center" disabled={loading}>
            {loading ? t('addSubject.sending', 'Envoi en cours…') : <><Send size={14} /> {t('addSubject.submit', 'Proposer le sujet')}</>}
          </button>
        </form>
      </div>
    </div>
  )
}