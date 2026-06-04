import { Outlet } from 'react-router-dom'
import Navbar   from './Navbar'
import Sidebar  from './Sidebar'
import { Info } from 'lucide-react'
import { useSidebar } from '../../context/SidebarContext'
import { useTranslation } from 'react-i18next'

export default function Layout() {
  const { open } = useSidebar()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {/* Sidebar — controlled by hamburger in Navbar */}
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden hidden lg:block bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-[10px_0_40px_-12px_rgba(0,0,0,0.08)]
            ${open ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
        >
          <div className="w-64 sticky top-14">
            <Sidebar />
          </div>
        </aside>

        {/* Main content wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
            <Outlet />
          </main>

        </div>
      </div>

      <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-8 px-4 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
            <Info size={18} className="text-primary-500 animate-pulse" />
            <h3 className="font-bold text-sm">{t('footer.aboutTitle', 'À propos de Whisper 💬')}</h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed font-medium">
            {t('footer.aboutText', "Whisper est un espace d'échange anonyme sécurisé où vous pouvez vous exprimer librement. Parlez d'éducation, de droit, de technologie, de sport ou proposez votre propre catégorie en un clic !")}
          </p>
          <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-2">
            © {new Date().getFullYear()} Whisper Community. {t('footer.rights', 'Tous droits réservés.')}
          </div>
        </div>
      </footer>
    </div>
  )
}