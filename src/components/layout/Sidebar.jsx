import { NavLink, useLocation } from 'react-router-dom'
import { Home, FileText, MessageCircle, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { TOPICS, getDynamicTopicStyles, parseSujetMeta } from '../../utils/helpers'
import { useState, useEffect } from 'react'
import { forumService } from '../../services/forumService'
import { useTranslation } from 'react-i18next'

const navItem = 'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-white transition-colors'
const activeClass = '!bg-primary-50 dark:!bg-primary-900/30 !text-primary-700 dark:!text-primary-400'

function getSujetStyle(sujet) {
  const meta = parseSujetMeta(sujet.description)
  if (meta) return { colorClass: meta.color, Icon: meta.icon }
  const match = TOPICS.find(t => t.label.toLowerCase() === sujet.titre.toLowerCase())
  if (match) return { colorClass: match.color, Icon: match.icon }
  const dyn = getDynamicTopicStyles(sujet.titre)
  return { colorClass: dyn.color, Icon: dyn.icon }
}

// Strip accents to build i18n key: "Éducation" → "education"
function toKey(titre) {
  return titre?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ''
}

export default function Sidebar() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [userSujets, setUserSujets] = useState([])
  const [loadingSujets, setLoadingSujets] = useState(true)

  useEffect(() => {
    forumService.getSujets({ statut: 'valide' })
      .then(data => setUserSujets(data))
      .catch(() => {})
      .finally(() => setLoadingSujets(false))
  }, [location.pathname])

  return (
    <nav className="flex flex-col gap-6 pt-0 pb-5 px-2 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div>
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-2">
          {t('nav.navigation')}
        </p>
        <div className="flex flex-col gap-0.5">
          <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
            <Home size={16} /> {t('nav.home')}
          </NavLink>
          {user && (
            <>
              <NavLink to="/mes-postes" className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
                <FileText size={16} /> {t('nav.myActivity')}
              </NavLink>
              <NavLink to="/chat" className={({ isActive }) => `${navItem} ${isActive ? activeClass : ''}`}>
                <MessageCircle size={16} /> {t('nav.privateMessages')}
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Categories (Subjects) */}
      <div>
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-2">
          {t('nav.sujets')}
        </p>
        <div className="flex flex-col gap-1.5">
          {loadingSujets ? (
            <div className="flex items-center gap-2 px-3 py-2 text-neutral-300 text-xs">
              <Loader size={12} className="animate-spin" /> {t('common.loading')}
            </div>
          ) : (
            userSujets.map(s => {
              const { colorClass, Icon } = getSujetStyle(s)
              const translatedTitle = t(`subjects.${toKey(s.titre)}`, { defaultValue: s.titre })
              return (
                <NavLink
                  key={s.id}
                  to={`/?topic=${encodeURIComponent(s.titre.toLowerCase())}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 !px-3 !py-2 !rounded-xl !text-sm font-medium transition-colors ${colorClass} hover:opacity-80 ${isActive ? 'shadow-sm font-semibold' : 'bg-opacity-40'}`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{translatedTitle}</span>
                </NavLink>
              )
            })
          )}
        </div>
      </div>
    </nav>
  )
}