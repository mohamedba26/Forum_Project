import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Eye, EyeOff, User, Lock, Smile, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

// 20 animal/nature avatars using emoji rendered on colored circles
const AVATARS = [
  { id: 'fox',       emoji: '🦊', bg: 'bg-orange-100',  ring: 'ring-orange-400' },
  { id: 'wolf',      emoji: '🐺', bg: 'bg-slate-100',   ring: 'ring-slate-400' },
  { id: 'eagle',     emoji: '🦅', bg: 'bg-sky-100',     ring: 'ring-sky-400' },
  { id: 'lion',      emoji: '🦁', bg: 'bg-amber-100',   ring: 'ring-amber-400' },
  { id: 'owl',       emoji: '🦉', bg: 'bg-stone-100',   ring: 'ring-stone-400' },
  { id: 'bear',      emoji: '🐻', bg: 'bg-yellow-100',  ring: 'ring-yellow-500' },
  { id: 'shark',     emoji: '🦈', bg: 'bg-cyan-100',    ring: 'ring-cyan-400' },
  { id: 'dragon',    emoji: '🐉', bg: 'bg-emerald-100', ring: 'ring-emerald-400' },
  { id: 'cat',       emoji: '🐱', bg: 'bg-pink-100',    ring: 'ring-pink-400' },
  { id: 'penguin',   emoji: '🐧', bg: 'bg-blue-100',    ring: 'ring-blue-400' },
  { id: 'tiger',     emoji: '🐯', bg: 'bg-orange-100',  ring: 'ring-orange-500' },
  { id: 'dolphin',   emoji: '🐬', bg: 'bg-teal-100',    ring: 'ring-teal-400' },
  { id: 'panda',     emoji: '🐼', bg: 'bg-gray-100',    ring: 'ring-gray-400' },
  { id: 'phoenix',   emoji: '🦚', bg: 'bg-green-100',   ring: 'ring-green-400' },
  { id: 'raven',     emoji: '🦅', bg: 'bg-purple-100',  ring: 'ring-purple-400' },
  { id: 'horse',     emoji: '🐴', bg: 'bg-rose-100',    ring: 'ring-rose-400' },
  { id: 'bat',       emoji: '🦇', bg: 'bg-violet-100',  ring: 'ring-violet-400' },
  { id: 'turtle',    emoji: '🐢', bg: 'bg-lime-100',    ring: 'ring-lime-400' },
  { id: 'octopus',   emoji: '🐙', bg: 'bg-red-100',     ring: 'ring-red-400' },
  { id: 'butterfly', emoji: '🦋', bg: 'bg-fuchsia-100', ring: 'ring-fuchsia-400' },
]

export { AVATARS }

const tabs = [
  { id: 'avatar',   labelKey: 'profile.avatar',          icon: Smile },
  { id: 'infos',    labelKey: 'profile.myInfos',       icon: User },
  { id: 'password', labelKey: 'profile.password',    icon: Lock },
]

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { t }                = useTranslation()
  const navigate             = useNavigate()
  const [tab, setTab]        = useState('avatar')
  const [saving, setSaving]  = useState(false)

  // Avatar
  const currentAvatar = AVATARS.find(a => a.id === user?.avatar) || null
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '')

  // Infos
  const [nom, setNom] = useState(user?.nom || '')

  // Password
  const [motDePasseActuel, setMotDePasseActuel]       = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse]     = useState('')
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('')
  const [showPw, setShowPw]                           = useState(false)

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return toast.error(t('profile.toast.chooseAvatar', 'Choisissez un avatar'))
    setSaving(true)
    try {
      await updateUser({ avatar: selectedAvatar })
      toast.success(t('profile.toast.avatarUpdated', 'Avatar mis à jour ✓'))
    } catch {
      toast.error(t('profile.toast.updateError', 'Erreur lors de la mise à jour'))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveInfos = async () => {
    if (!nom.trim()) return toast.error(t('profile.toast.emptyName', 'Le nom ne peut pas être vide'))
    setSaving(true)
    try {
      await updateUser({ nom: nom.trim() })
      toast.success(t('profile.toast.profileUpdated', 'Profil mis à jour ✓'))
    } catch {
      toast.error(t('profile.toast.updateError', 'Erreur lors de la mise à jour'))
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (!motDePasseActuel)            return toast.error(t('profile.toast.enterCurrentPassword', 'Entrez votre mot de passe actuel'))
    if (nouveauMotDePasse.length < 6) return toast.error(t('profile.toast.newPasswordMinLength', 'Le nouveau mot de passe doit faire au moins 6 caractères'))
    if (nouveauMotDePasse !== confirmerMotDePasse) return toast.error(t('profile.toast.passwordsMismatch', 'Les mots de passe ne correspondent pas'))
    setSaving(true)
    try {
      await updateUser({ motDePasseActuel, nouveauMotDePasse })
      toast.success(t('profile.toast.passwordChanged', 'Mot de passe changé ✓'))
      setMotDePasseActuel('')
      setNouveauMotDePasse('')
      setConfirmerMotDePasse('')
    } catch (err) {
      toast.error(err?.response?.data?.message || t('common.error', 'Erreur'))
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const displayAvatar = AVATARS.find(a => a.id === user.avatar)

  return (
    <div className="max-w-2xl mx-auto fade-in">
      {/* Header card */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        {/* Current avatar display */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 ${displayAvatar ? displayAvatar.bg : 'bg-primary-100'} shadow-sm`}>
          {displayAvatar ? displayAvatar.emoji : <User size={36} className="text-primary-400" />}
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{user.nom}</h1>
          <p className="text-sm text-neutral-400">{user.email}</p>
          <span className={`mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            user.role === 'admin'      ? 'bg-red-100 text-red-600' :
            user.role === 'moderateur' ? 'bg-blue-100 text-blue-600' :
                                         'bg-neutral-100 text-neutral-500'
          }`}>
            {user.role === 'admin' ? `👑 ${t('roles.admin', 'Admin')}` : user.role === 'moderateur' ? `🛡️ ${t('roles.moderator', 'Modérateur')}` : `🙋 ${t('roles.user', 'Utilisateur')}`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-6">
        {tabs.map(tabItem => {
          const Icon = tabItem.icon
          return (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === tabItem.id ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300'}`}
            >
              <Icon size={15} /> {t(tabItem.labelKey)}
            </button>
          )
        })}
      </div>

      {/* ── AVATAR TAB ─────────────────────────────────────────────────── */}
      {tab === 'avatar' && (
        <div className="card p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{t('profile.chooseAvatar', 'Choisissez votre avatar')}</h2>
            <p className="text-sm text-neutral-400">{t('profile.avatarDesc', 'Votre avatar sera visible par les administrateurs et modérateurs.')}</p>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {AVATARS.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAvatar(a.id)}
                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all hover:scale-105 active:scale-95 ${
                  selectedAvatar === a.id
                    ? `${a.bg} ring-2 ${a.ring} shadow-md`
                    : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <span className="text-3xl leading-none">{a.emoji}</span>
                {selectedAvatar === a.id && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>

          {selectedAvatar && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              {(() => {
                const av = AVATARS.find(a => a.id === selectedAvatar)
                return av ? (
                  <>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${av.bg}`}>{av.emoji}</div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">{t('profile.selectedAvatar', 'Avatar sélectionné :')} <span className="text-neutral-900 dark:text-neutral-100">{av.emoji}</span></p>
                  </>
                ) : null
              })()}
            </div>
          )}

          <button onClick={handleSaveAvatar} disabled={saving || !selectedAvatar} className="btn-primary justify-center">
            {saving ? t('common.saving', 'Sauvegarde…') : <><Check size={15} /> {t('profile.saveAvatar', "Sauvegarder l'avatar")}</>}
          </button>
        </div>
      )}

      {/* ── INFOS TAB ─────────────────────────────────────────────────── */}
      {tab === 'infos' && (
        <div className="card p-6 flex flex-col gap-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('profile.editInfos', 'Modifier mes informations')}</h2>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('profile.username', "Nom d'utilisateur")}</label>
            <input
              className="input"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder={t('profile.yourPseudo', 'Votre pseudo')}
              maxLength={40}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('profile.email', 'Adresse email')}</label>
            <input className="input opacity-60 cursor-not-allowed" value={user.email} disabled />
            <p className="text-xs text-neutral-400 mt-1">{t('profile.emailCannotBeChanged', "L'email ne peut pas être modifié.")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('profile.role', 'Rôle')}</label>
            <input className="input opacity-60 cursor-not-allowed" value={user.role} disabled />
          </div>

          <button onClick={handleSaveInfos} disabled={saving} className="btn-primary justify-center">
            {saving ? t('common.saving', 'Sauvegarde…') : <><Check size={15} /> {t('common.save', 'Sauvegarder')}</>}
          </button>
        </div>
      )}

      {/* ── PASSWORD TAB ─────────────────────────────────────────────── */}
      {tab === 'password' && (
        <div className="card p-6 flex flex-col gap-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('profile.changePassword', 'Changer de mot de passe')}</h2>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('profile.currentPassword', 'Mot de passe actuel')}</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                value={motDePasseActuel}
                onChange={e => setMotDePasseActuel(e.target.value)}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-300">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('profile.newPassword', 'Nouveau mot de passe')}</label>
            <input type="password" className="input" value={nouveauMotDePasse} onChange={e => setNouveauMotDePasse(e.target.value)} placeholder={t('profile.minCharacters', 'Min. 6 caractères')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('profile.confirmNewPassword', 'Confirmer le nouveau mot de passe')}</label>
            <input type="password" className="input" value={confirmerMotDePasse} onChange={e => setConfirmerMotDePasse(e.target.value)} placeholder="••••••••" />
            {confirmerMotDePasse && nouveauMotDePasse !== confirmerMotDePasse && (
              <p className="text-xs text-red-500 mt-1">{t('profile.toast.passwordsMismatch', 'Les mots de passe ne correspondent pas')}</p>
            )}
          </div>

          <button onClick={handleSavePassword} disabled={saving} className="btn-primary justify-center">
            {saving ? t('common.saving', 'Sauvegarde…') : <><Lock size={15} /> {t('profile.doChangePassword', 'Changer le mot de passe')}</>}
          </button>
        </div>
      )}
    </div>
  )
}