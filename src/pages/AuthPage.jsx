import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

// ─── Nickname generator ────────────────────────────────────────────────────
const ADJECTIVES = ['Brave', 'Curieux', 'Sage', 'Vif', 'Serein', 'Libre', 'Furtif', 'Mystique', 'Calme', 'Éclair', 'Ombre', 'Fantôme', 'Agile', 'Zen', 'Silent']
const NOUNS      = ['Aigle', 'Loup', 'Renard', 'Lynx', 'Faucon', 'Ours', 'Tigre', 'Dauphin', 'Colibri', 'Corbeau', 'Panda', 'Phénix', 'Spectre', 'Voyageur', 'Nomade']

function generateNicknames(fullName = '', email = '') {
  const results = new Set()
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const num  = () => Math.floor(Math.random() * 900) + 100

  // From full name: take first letters or first word
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
  const firstName = nameParts[0] || ''
  const initials  = nameParts.map(w => w[0]).join('').toUpperCase()

  // From email: part before @
  const emailPart = email.split('@')[0].replace(/[^a-zA-Z]/g, '')

  // Generate 6 nicknames
  if (firstName.length > 1) {
    results.add(`${rand(ADJECTIVES)}${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}${num()}`)
    results.add(`${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}${rand(NOUNS)}`)
  }
  if (initials.length > 0) {
    results.add(`${rand(ADJECTIVES)}${initials}${num()}`)
  }
  if (emailPart.length > 2) {
    results.add(`${rand(ADJECTIVES)}${emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase().substring(0,6)}`)
  }
  // Always add 2 random ones to fill
  while (results.size < 6) {
    results.add(`${rand(ADJECTIVES)}${rand(NOUNS)}${num()}`)
  }

  return [...results].slice(0, 6)
}
// ──────────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode]         = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({ nom: '', email: '', motDePasse: '', confirmMotDePasse: '' })
  const { login, register }     = useAuth()
  const navigate                = useNavigate()

  // Registration-specific state
  const [fullName, setFullName]           = useState('')
  const [suggestions, setSuggestions]     = useState([])
  const [selectedNick, setSelectedNick]   = useState('')
  const [customNick, setCustomNick]       = useState('')
  const [nickStep, setNickStep]           = useState(false) // false = name step, true = pick step

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Generate suggestions and move to pick step
  const handleGenerateNicks = () => {
    if (form.motDePasse !== form.confirmMotDePasse) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (!fullName.trim()) { toast.error('Entrez votre vrai prénom d\'abord'); return }
    const nicks = generateNicknames(fullName, form.email)
    setSuggestions(nicks)
    setSelectedNick(nicks[0])
    setNickStep(true)
  }

  const handleRefreshNicks = () => {
    const nicks = generateNicknames(fullName, form.email)
    setSuggestions(nicks)
    setSelectedNick(nicks[0])
    setCustomNick('')
  }

  // Final nickname = custom if typed, else selected suggestion
  const finalNick = customNick.trim() || selectedNick

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email: form.email, motDePasse: form.motDePasse })
        toast.success('Bienvenue !')
      } else {
        if (!finalNick) { toast.error('Choisissez un pseudonyme'); setLoading(false); return }
        await register({ nom: finalNick, email: form.email, motDePasse: form.motDePasse })
        toast.success('Compte créé ! Pseudonyme : ' + finalNick)
      }
      navigate('/')
    } catch (err) {
      toast.error(err || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Reset register state when toggling mode
  const switchMode = (m) => {
    setMode(m)
    setFullName('')
    setSuggestions([])
    setSelectedNick('')
    setCustomNick('')
    setNickStep(false)
  }

  return (
<div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-100 flex items-center justify-center px-4 relative overflow-hidden py-4">      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none select-none animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none select-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left: Branded banner */}
        <div className="hidden lg:flex flex-col justify-center">
          <img src="/banner2.png" alt="Whisper Forum" className="w-full max-w-2xl object-contain animate-float" />
      <div className="grid grid-cols-3 gap-4 mt-8 max-w-xl">

  {/* Anonyme */}
  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
    <div className="pt-2">
      <div className="font-extrabold text-2xl text-neutral-900">100%</div>
      <div className="text-sm text-neutral-500">Anonyme</div>
    </div>
  </div>

  {/* Disponible */}
  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 to-purple-500" />
    <div className="pt-2">
      <div className="font-extrabold text-2xl text-neutral-900">24/7</div>
      <div className="text-sm text-neutral-500">Disponible</div>
    </div>
  </div>

  {/* Discussions */}
  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500" />
    <div className="pt-2">
      <div className="font-extrabold text-2xl text-neutral-900">∞</div>
      <div className="text-sm text-neutral-500">Discussions</div>
    </div>
  </div>

</div>
        </div>

        {/* Right: Auth Card */}
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 mb-3 transition-all bg-white hover:bg-neutral-100 px-3.5 py-2 rounded-xl shadow-sm border border-neutral-200/60">
            <ArrowLeft size={13} /> Retour au forum
          </Link>

          {/* Mobile logo */}


          <div className="bg-white border border-neutral-200 rounded-[32px] pt-3 pb-5 px-7 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-indigo-50/30 pointer-events-none" />

            <div className="relative z-10">
              {/* Desktop logo */}
              <div className="hidden lg:flex justify-center mb-0 pt-6 pb-6 px-6">
              </div>

              {/* Tabs */}
              <div className="bg-neutral-100 rounded-2xl p-1 flex mb-3">
                <button type="button" onClick={() => switchMode('login')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'login' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  Connexion
                </button>
                <button type="button" onClick={() => switchMode('register')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'register' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  Inscription
                </button>

              </div>
                                                      <div className="hidden lg:flex justify-center mb-0 pt-2 pb-2 px-2">
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                {/* ── REGISTER FLOW ── */}
                {mode === 'register' && !nickStep && (
                  <>
                    {/* Step 1: Real name + email + password */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-start gap-2">
                      <ShieldCheck size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                        Votre vrai nom n'est <strong>jamais stocké</strong>. Il sert uniquement à générer votre pseudonyme anonyme.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Votre Vrai Prénom</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-semibold"
                        placeholder="Ex : Mohamed"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Adresse Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-semibold"
                        placeholder="vous@exemple.com"
                        value={form.email}
                        onChange={set('email')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Mot de Passe</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          className="w-full pl-4 pr-10 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-semibold"
                          placeholder="••••••••"
                          value={form.motDePasse}
                          onChange={set('motDePasse')}
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowPass(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Confirmer le Mot de Passe</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          className="w-full pl-4 pr-10 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-semibold"
                          placeholder="••••••••"
                          value={form.confirmMotDePasse}
                          onChange={set('confirmMotDePasse')}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateNicks}
                      className="w-full mt-2 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                    >
                      Générer mon pseudonyme →
                    </button>
                  </>
                )}

                {/* Step 2: Pick a nickname */}
                {mode === 'register' && nickStep && (
                  <div className="fade-in flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Choisissez votre pseudonyme</p>
                      <button type="button" onClick={handleRefreshNicks}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-bold transition-colors">
                        <RefreshCw size={12} /> Régénérer
                      </button>
                    </div>

                    {/* Nickname chips */}
                    <div className="grid grid-cols-2 gap-2">
                      {suggestions.map(nick => (
                        <button
                          key={nick}
                          type="button"
                          onClick={() => { setSelectedNick(nick); setCustomNick('') }}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left truncate ${
                            selectedNick === nick && !customNick
                              ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          {selectedNick === nick && !customNick && <CheckCircle2 size={11} className="inline mr-1" />}
                          {nick}
                        </button>
                      ))}
                    </div>

                    {/* Custom nickname input */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Ou écrivez le vôtre</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-semibold"
                        placeholder="MonPseudo42"
                        value={customNick}
                        onChange={e => setCustomNick(e.target.value)}
                        maxLength={30}
                      />
                    </div>

                    {/* Preview */}
                    {finalNick && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        <p className="text-xs text-green-700 font-bold">Vous apparaîtrez comme : <span className="text-green-900">{finalNick}</span></p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button type="button" onClick={() => setNickStep(false)}
                        className="px-4 py-3 rounded-2xl text-xs font-bold border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all">
                        ← Retour
                      </button>
                      <button type="submit" disabled={loading || !finalNick}
                        className="flex-1 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50">
                        {loading ? 'Création…' : "S'inscrire"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── LOGIN FLOW ── */}
                {mode === 'login' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Adresse Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-semibold"
                        placeholder="vous@exemple.com"
                        value={form.email}
                        onChange={set('email')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Mot de Passe</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          className="w-full pl-4 pr-10 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-semibold"
                          placeholder="••••••••"
                          value={form.motDePasse}
                          onChange={set('motDePasse')}
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowPass(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                                                      <div className="hidden lg:flex justify-center mb-0 pt-2 pb-2 px-2">
              </div>
                    <button type="submit"
                      className="w-full mt-2 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                      disabled={loading}>
                      {loading ? 'Chargement…' : 'Se connecter'}
                    </button>
                                  <div className="hidden lg:flex justify-center mb-0 pt-4 pb-4 px-4">
              </div>
                  </>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
