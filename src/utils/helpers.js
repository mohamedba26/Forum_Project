import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BookOpen, Cpu, Gavel, Trophy, Music, Coffee, Car, Heart, Globe, Code, PenTool, Hash, Gamepad2, Film, Plane, Users, ShoppingBag, Leaf, Star, Zap, Camera, Briefcase, Dumbbell } from 'lucide-react';

export const timeAgo = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'dd MMM yyyy à HH:mm', { locale: fr })
}

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export const TOPICS = [
  { id: 'education',   label: 'Éducation',   color: 'badge-blue',  icon: BookOpen },
  { id: 'technologie', label: 'Technologie', color: 'badge-pink',  icon: Cpu },
  { id: 'juridique',   label: 'Juridique',   color: 'badge-green', icon: Gavel }
];
export const TOPIC_MAP = TOPICS.reduce((map, t) => ({ ...map, [t.id]: t }), {});

// Map of icon string IDs to Lucide components (used when parsing __meta__ from description)
const ICON_MAP = {
  Hash, BookOpen, Cpu, Gavel, Trophy, Music, Coffee, Car, Heart, Globe,
  Code, PenTool, Gamepad2, Film, Plane, Users, ShoppingBag,
  Leaf, Star, Zap, Camera, Briefcase, Dumbbell,
}

/**
 * Parse the __meta__ prefix embedded in a sujet's description field.
 * Format: "__meta__{"icon":"BookOpen","color":"badge-blue"}\nOptional real description"
 * Returns { icon: LucideComponent, color: string } or null if not present.
 */
export const parseSujetMeta = (description) => {
  if (!description || !description.startsWith('__meta__')) return null
  try {
    const jsonPart = description.slice('__meta__'.length).split('\n')[0]
    const { icon, color } = JSON.parse(jsonPart)
    const IconComponent = ICON_MAP[icon] || Hash
    return { icon: IconComponent, color: color || 'badge-gray' }
  } catch {
    return null
  }
}

/**
 * Strip the __meta__ prefix from description for display.
 */
export const getCleanDescription = (description) => {
  if (!description || !description.startsWith('__meta__')) return description || ''
  return description.split('\n').slice(1).join('\n').trim()
}

export const getDynamicTopicStyles = (titre) => {
  if (!titre) return { icon: Hash, color: 'badge-gray' };
  const t = titre.toLowerCase();

  if (t.match(/sport|foot|tennis|basket|course/)) return { icon: Trophy, color: 'badge-amber' };
  if (t.match(/musique|audio|chanson|concert/))   return { icon: Music,   color: 'badge-pink' };
  if (t.match(/cuisine|recette|manger|repas/))    return { icon: Coffee,  color: 'badge-amber' };
  if (t.match(/auto|voiture|moto|véhicule/))      return { icon: Car,     color: 'badge-blue' };
  if (t.match(/santé|amour|bien-être|psy/))       return { icon: Heart,   color: 'badge-red' };
  if (t.match(/voyage|monde|pays|tourisme/))      return { icon: Plane,   color: 'badge-blue' };
  if (t.match(/dev|code|informatique|tech/))      return { icon: Code,    color: 'badge-pink' };
  if (t.match(/art|dessin|design|peinture/))      return { icon: PenTool, color: 'badge-pink' };
  if (t.match(/jeu|game|play|console/))           return { icon: Gamepad2,color: 'badge-pink' };
  if (t.match(/film|cinéma|série|tv/))            return { icon: Film,    color: 'badge-gray' };
  if (t.match(/achat|shopping|mode|vêtement/))    return { icon: ShoppingBag, color: 'badge-pink' };
  if (t.match(/gens|communauté|société/))         return { icon: Users,   color: 'badge-blue' };

  return { icon: Hash, color: 'badge-gray' };
};

export const ROLES = {
  admin:       { label: 'Admin',       color: 'badge-red'   },
  moderateur:  { label: 'Modérateur',  color: 'badge-amber' },
  utilisateur: { label: 'Utilisateur', color: 'badge-gray'  },
};

export const STATUTS_SUJET = {
  'en_attente': { label: 'En attente', color: 'badge-amber' },
  'valide':     { label: 'Validé',     color: 'badge-green' },
  'supprime':   { label: 'Supprimé',   color: 'badge-red'   },
}

export const clsx = (...classes) => classes.filter(Boolean).join(' ')

export const truncate = (str, n = 120) =>
  str?.length > n ? str.slice(0, n) + '…' : str

export const generateAnonymousName = () => {
  const adj = ['Brave','Curieux','Sage','Vif','Serein','Doux','Fort','Libre']
  const nom = ['Aigle','Loup','Renard','Lynx','Faucon','Ours','Tigre','Dauphin']
  return `${adj[Math.floor(Math.random()*adj.length)]}${nom[Math.floor(Math.random()*nom.length)]}${Math.floor(Math.random()*100)}`
}