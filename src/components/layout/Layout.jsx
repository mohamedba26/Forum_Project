import { Outlet } from 'react-router-dom'
import Navbar   from './Navbar'
import Sidebar  from './Sidebar'
import { Info } from 'lucide-react'
import { useSidebar } from '../../context/SidebarContext'

export default function Layout() {
  const { open } = useSidebar()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex gap-6 items-start">

          {/* Sidebar — controlled by hamburger in Navbar */}
          <aside
            className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden hidden lg:block
              ${open ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
          >
            <div className="w-64">
              <Sidebar />
            </div>
          </aside>

          {/* Main content expands when sidebar is hidden */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 mt-12 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
            <Info size={18} className="text-primary-500 animate-pulse" />
            <h3 className="font-bold text-sm">À propos de Whisper 💬</h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed font-medium">
            Whisper est un espace d'échange anonyme sécurisé où vous pouvez vous exprimer librement.
            Parlez d'éducation, de droit, de technologie, de sport ou proposez votre propre catégorie en un clic !
          </p>
          <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-2">
            © {new Date().getFullYear()} Whisper Community. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}