import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * ConfirmModal — a beautiful, accessible confirmation dialog.
 *
 * Usage:
 *   const [modal, setModal] = useState(null)
 *
 *   // Trigger:
 *   setModal({ message: 'Delete this?', onConfirm: () => doDelete() })
 *
 *   // In JSX:
 *   <ConfirmModal modal={modal} onClose={() => setModal(null)} />
 */
export default function ConfirmModal({ modal, onClose }) {
  const { t } = useTranslation()
  const confirmBtnRef = useRef()

  // Focus the cancel button on open (safer UX), close on Escape
  useEffect(() => {
    if (!modal) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [modal, onClose])

  if (!modal) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon + Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 size={22} className="text-red-500 dark:text-red-400" />
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2">
            {modal.title || t('common.confirm', 'Confirmation')}
          </h3>

          {/* Message */}
          <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {modal.message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary py-2.5 text-sm"
          >
            {t('common.cancel', 'Annuler')}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => { modal.onConfirm(); onClose() }}
            className="flex-1 btn-danger py-2.5 text-sm"
          >
            {modal.confirmLabel || t('admin.delete', 'Supprimer')}
          </button>
        </div>
      </div>
    </div>
  )
}
