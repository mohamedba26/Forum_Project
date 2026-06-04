import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'en', label: 'English',  flag: 'EN' },
  { code: 'ar', label: 'العربية',  flag: 'AR' },
]

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 shadow-sm transition-all text-sm font-medium"
        title="Change language"
      >
        <Globe size={15} className="text-primary-500" />
        <span className="text-xs font-bold">{current.flag} {current.label}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden z-50 fade-in">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                ${lang.code === current.code
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
            >
              <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 leading-none w-6">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
              {lang.code === current.code && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
