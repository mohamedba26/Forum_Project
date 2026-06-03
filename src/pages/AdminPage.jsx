import { useState, useEffect } from 'react'
import { Users, BookOpen, Flag, FileText, Search, Ban, ShieldCheck, ShieldOff, CheckCircle, Trash2, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../services/adminService'
import { forumService } from '../services/forumService'
import { ROLES, timeAgo, getInitials } from '../utils/helpers'

const tabs = [
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { id: 'sujets',       label: 'Sujets',            icon: BookOpen },
  { id: 'rapports',     label: 'Rapports',     icon: Flag },
]

export default function AdminPage() {
  const [tab, setTab]         = useState('utilisateurs')
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [badges, setBadges]   = useState({ sujets: 0, postes: 0, rapports: 0, utilisateurs: 0 })

  const loadBadges = async () => {
    const [sujetsRes, postesRes, rapportsRes, utilisateursEnAttenteRes] = await Promise.allSettled([
      adminService.getSujetsEnAttente(),  // badge still shows pending count
      forumService.getPostesEnAttente(),
      adminService.getRapports(),
      adminService.getUtilisateursEnAttente(),
    ])
    setBadges({
      sujets:       sujetsRes.status                 === 'fulfilled' ? sujetsRes.value.length                                          : 0,
      postes:       postesRes.status                 === 'fulfilled' ? postesRes.value.length                                          : 0,
      rapports:     rapportsRes.status               === 'fulfilled' ? rapportsRes.value.filter(r => r.statut === 'en_attente').length  : 0,
      utilisateurs: utilisateursEnAttenteRes.status  === 'fulfilled' ? utilisateursEnAttenteRes.value.count                            : 0,
    })
  }

  const load = async () => {
    setLoading(true)
    setData([])
    try {
      if (tab === 'utilisateurs') setData(await adminService.getUtilisateurs())
      if (tab === 'sujets') {
        setData(await adminService.getAllSujets())
      }
      if (tab === 'postes')       setData(await forumService.getPostesEnAttente())
      if (tab === 'rapports')     setData(await adminService.getAdminRapports())
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBadges() }, [])
  useEffect(() => { load() }, [tab])

  const action = (fn, msg) => async (...args) => {
    try { await fn(...args); toast.success(msg); load(); loadBadges() }
    catch { toast.error('Erreur') }
  }

  const bloquer      = action((id) => adminService.bloquerUtilisateur(id),   'Utilisateur bloqué')
  const debloquer    = action((id) => adminService.debloquerUtilisateur(id), 'Utilisateur débloqué')
  const donnerMod    = action((id) => adminService.donnerRoleModo(id),       'Rôle modérateur attribué')
  const retirerMod   = action((id) => adminService.supprimerRoleModo(id),    'Rôle modérateur retiré')
  const validerSujet  = action((id) => adminService.validerSujet(id),          'Sujet validé ✓')
  const supprimerSujet = action((id) => adminService.supprimerSujet(id),      'Sujet supprimé')
  const validerPoste = action((id) => forumService.validerPoste(id),         'Poste validé ✓')
  const refuserPoste = action((id) => forumService.supprimerPoste(id),       'Poste refusé')
  const traiterReport     = action((id) => adminService.traiterRapport(id),          'Contenu supprimé ✓')
  const bloquerUserReport = action((uid) => adminService.bloquerDepuisReport(uid),   'Utilisateur bloqué ✓')
  const ignorerUserReport = action((uid) => adminService.ignorerUserReports(uid),    'Signalements ignorés')

  const filtered = data.filter(d =>
    (d.nom || d.titre || d.contenu || d.raison || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Tableau de bord admin</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Gestion du forum</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon
          const badgeCount = badges[t.id] || 0
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Icon size={15} /> {t.label}
              {badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input className="input pl-9 max-w-xs" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-neutral-300" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && <p className="text-neutral-400 text-sm">Aucun élément.</p>}

          {/* Utilisateurs */}
          {tab === 'utilisateurs' && filtered.map(u => {
            const role = ROLES[u.role] || ROLES.utilisateur
            const isPending = u.hasSujetEnAttente && u.role === 'utilisateur'
            return (
              <div key={u.id} className={`card p-4 flex items-center gap-4 fade-in transition-all ${isPending ? 'border-l-4 border-amber-400 bg-amber-50/40' : ''}`}>
                <div className={`avatar w-10 h-10 text-sm shrink-0 ${isPending ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400 ring-offset-1' : 'bg-neutral-100 text-neutral-600'}`}>
                  {getInitials(u.nom)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-neutral-900 truncate">{u.nom}</p>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-300">
                        ⏳ Demande modérateur
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 truncate">{u.email}</p>
                </div>
                <span className={role.color}>{role.label}</span>
                {u.estBloque && <span className="badge badge-red">Bloqué</span>}
                <div className="flex items-center gap-1 shrink-0">
                  {u.estBloque
                    ? <button onClick={() => debloquer(u.id)} className="btn-secondary text-xs py-1"><ShieldCheck size={13} /> Débloquer</button>
                    : <button onClick={() => bloquer(u.id)} className="btn-secondary text-xs py-1 text-red-600 hover:bg-red-50"><Ban size={13} /> Bloquer</button>
                  }
                  {u.role === 'utilisateur'
                    ? <button onClick={() => donnerMod(u.id)} className={`btn-secondary text-xs py-1 ${isPending ? 'border-amber-400 text-amber-700 hover:bg-amber-50' : ''}`}><ShieldCheck size={13} /> Modérateur</button>
                    : u.role === 'moderateur'
                    ? <button onClick={() => retirerMod(u.id)} className="btn-secondary text-xs py-1 text-amber-600"><ShieldOff size={13} /> Retirer modo</button>
                    : null
                  }
                </div>
              </div>
            )
          })}


          {/* Sujets — tous les sujets */}
          {tab === 'sujets' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                Tous les sujets ({filtered.length})
              </p>
              {filtered.length === 0 && (
                <div className="card p-8 text-center text-neutral-400 text-sm border-dashed shadow-none">
                  Aucun sujet.
                </div>
              )}
              {filtered.map(s => (
                <div key={s.id} className={`card p-5 fade-in ${s.statut === 'en_attente' ? 'border-l-4 border-amber-400 bg-amber-50/20' : 'border-l-4 border-green-400 bg-green-50/10'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900">{s.titre}</p>
                        {s.statut === 'en_attente'
                          ? <span className="badge badge-amber text-[10px]">⏳ En attente</span>
                          : <span className="badge badge-green text-[10px]">✓ Validé</span>
                        }
                      </div>
                      {s.description && <p className="text-xs text-neutral-500 mb-2">{s.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
                        <span>Proposé par <span className="font-semibold text-neutral-600">{s.auteur?.nom || '—'}</span></span>
                        <span>·</span>
                        <span>
                          Modérateur : <span className={`font-semibold ${s.moderateur ? 'text-primary-600' : 'text-neutral-400 italic'}`}>
                            {s.moderateur?.nom || 'Aucun'}
                          </span>
                        </span>
                        <span>·</span>
                        <span>{s.nombrePostes ?? 0} posts</span>
                        <span>·</span>
                        <span>{timeAgo(s.dateCreation)}</span>
                      </div>
                      {s.statut === 'en_attente' && (
                        <p className="text-[10px] text-amber-600 font-medium mt-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 inline-block">
                          ✦ En validant, l'auteur devient modérateur de ce sujet
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {s.statut === 'en_attente' && (
                        <button onClick={() => validerSujet(s.id)} className="btn-primary text-xs py-1.5">
                          <CheckCircle size={13} /> Valider
                        </button>
                      )}
                      <button onClick={() => supprimerSujet(s.id)} className="btn-danger text-xs py-1.5">
                        <Trash2 size={13} /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Posts */}
          {tab === 'posts' && filtered.map(s => (
            <div key={s.id} className={`card p-5 fade-in ${s.statut === 'en_attente' ? 'border-l-4 border-amber-400 bg-amber-50/20' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-neutral-900">{s.titre}</p>
                    {s.statut === 'en_attente' ? (
                      <span className="badge badge-yellow text-[10px]">En attente</span>
                    ) : (
                      <span className="badge badge-green text-[10px]">Validé</span>
                    )}
                  </div>
                  {s.description && <p className="text-xs text-neutral-500 mb-2">{s.description}</p>}
                  <p className="text-xs text-neutral-400">
                    Sous le sujet : <span className="font-medium">{s.categorie || 'Aucun'}</span> · {timeAgo(s.dateCreation)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {s.statut === 'en_attente' && (
                    <button onClick={() => validerSujet(s.id)} className="btn-primary text-xs py-1.5">
                      <CheckCircle size={13} /> Valider
                    </button>
                  )}
                  <button onClick={() => refuserSujet(s.id)} className="btn-danger text-xs py-1.5">
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Postes en attente */}
          {tab === 'postes' && filtered.map(p => (
            <div key={p.id} className="card p-5 fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400 mb-1">
                    Par <span className="font-medium text-neutral-600">{p.auteurNom || 'Anonyme'}</span> · {timeAgo(p.datePublication)}
                  </p>
                  <p className="text-sm text-neutral-800 leading-relaxed">{p.contenu}</p>
                  {p.typeMedia !== 'texte' && (
                    <span className="badge badge-gray mt-2">{p.typeMedia}</span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => validerPoste(p.id)} className="btn-primary text-xs py-1.5">
                    <CheckCircle size={13} /> Valider
                  </button>
                  <button onClick={() => refuserPoste(p.id)} className="btn-danger text-xs py-1.5">
                    <Trash2 size={13} /> Refuser
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Rapports */}
          {tab === 'rapports' && (
            <div className="flex flex-col gap-4">
              {filtered.length === 0 && (
                <div className="card p-12 text-center text-neutral-400 text-sm border-dashed shadow-none">
                  ✓ Aucun utilisateur signalé en attente.
                </div>
              )}
              {filtered.map(entry => (
                <div key={entry.utilisateur?.id} className="card p-5 fade-in border-l-4 border-red-400 bg-red-50/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900">{entry.utilisateur?.nom}</p>
                        <span className="badge badge-red text-[10px]">🚩 {entry.count} signalement{entry.count > 1 ? 's' : ''}</span>
                        {entry.utilisateur?.estBloque && <span className="badge badge-gray text-[10px]">🔒 Bloqué</span>}
                      </div>
                      <p className="text-xs text-neutral-400 mb-2">{entry.utilisateur?.email}</p>
                      <div className="flex flex-col gap-1">
                        {entry.reports?.slice(0, 3).map(r => (
                          <p key={r.id} className="text-xs text-neutral-600 bg-neutral-100 rounded-lg px-2.5 py-1.5">
                            <span className="font-medium">{r.raison}</span>
                            {r.detail && <span className="text-neutral-400"> — {r.detail}</span>}
                            <span className="text-neutral-400 ml-2">{timeAgo(r.date)}</span>
                          </p>
                        ))}
                        {entry.count > 3 && <p className="text-xs text-neutral-400 px-2">+{entry.count - 3} autre(s)…</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {!entry.utilisateur?.estBloque && (
                        <button onClick={() => bloquerUserReport(entry.utilisateur?.id)} className="btn-danger text-xs py-1.5">
                          <Ban size={13} /> Bloquer
                        </button>
                      )}
                      <button onClick={() => ignorerUserReport(entry.utilisateur?.id)} className="btn-secondary text-xs py-1.5">
                        Ignorer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}