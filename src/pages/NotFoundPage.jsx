import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center fade-in">
      <p className="text-6xl font-semibold text-neutral-100 mb-4">404</p>
      <h1 className="text-xl font-semibold text-neutral-900 mb-2">Page introuvable</h1>
      <p className="text-sm text-neutral-400 mb-8">Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-primary">
        <ArrowLeft size={16} /> Retour à l'accueil
      </Link>
    </div>
  )
}
