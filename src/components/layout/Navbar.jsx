import { Link, useNavigate } from 'react-router-dom'
import { LogOut, MessageSquare, Shield, Edit3, User, Menu, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSidebar } from '../../context/SidebarContext'
import { useTheme } from '../../context/ThemeContext'
import { getInitials } from '../../utils/helpers'
import { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import NotificationBell from '../NotificationBell'
import { AVATARS } from '../../pages/ProfilePage'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher'

function NotifBadge({ count }) {
  if (!count || count === 0) return null
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function UserAvatar({ user, size = 'w-8 h-8' }) {
  const av = AVATARS.find(a => a.id === user?.avatar)
  if (av) {
    return (
      <div className={`${size} ${av.bg} rounded-full flex items-center justify-center text-lg cursor-pointer hover:ring-2 ${av.ring} transition-all`}>
        {av.emoji}
      </div>
    )
  }
  return (
    <div className={`avatar ${size} bg-primary-100 text-primary-700 text-xs cursor-pointer hover:bg-primary-200 transition-colors`}>
      {getInitials(user?.nom)}
    </div>
  )
}

export { UserAvatar }

export default function Navbar() {
  const { user, logout, isAdmin, isModerator } = useAuth()
  const { toggle } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [pendingStats, setPendingStats] = useState({ adminCount: 0, modCount: 0 })

  useEffect(() => {
    if (!user || (!isAdmin && !isModerator)) return
    const fetchStats = () => {
      adminService.getPendingStats()
        .then(data => setPendingStats(data))
        .catch(() => {})
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [user, isAdmin, isModerator])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
      <div className="w-full px-4 h-14 flex items-center justify-between gap-4">
        {/* Hamburger + Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggle}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300 dark:text-neutral-400"
            title="Basculer le menu"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold text-base">
            <img src={theme === 'dark' ? '/logo3.png' : '/logo2.png'} alt="Whisper Logo" className="w-40 h-40 object-contain" />
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded-lg"
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            {theme === 'dark' ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} />}
          </button>

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="relative btn-ghost text-xs gap-1.5 hidden md:inline-flex">
                  <Shield size={15} /> {t('nav.admin')}
                  <NotifBadge count={pendingStats.adminCount} />
                </Link>
              )}
              {isModerator && !isAdmin && (
                <Link to="/moderation" className="relative btn-ghost text-xs gap-1.5 hidden md:inline-flex">
                  <Edit3 size={15} /> {t('nav.moderation')}
                  <NotifBadge count={pendingStats.modCount} />
                </Link>
              )}

              {/* Avatar menu + notification bell */}
              <div className="flex items-center gap-1">
                <NotificationBell />
                <div className="relative group">
                  <UserAvatar user={user} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-md py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2.5">
                      <UserAvatar user={user} size="w-9 h-9" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 dark:text-white truncate">{user.nom}</p>
                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/profil" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <User size={14} /> {t('nav.profile')}
                    </Link>
                    <Link to="/mes-postes" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <MessageSquare size={14} /> {t('nav.myPosts')}
                    </Link>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                        <LogOut size={14} /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn-primary text-sm py-1.5">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}