import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageSquare, Clock, Plus, Loader, Search, TrendingUp, BarChart2, FileText, Image, Mic, Video, Hash } from 'lucide-react';
import { forumService } from '../services/forumService';
import { useAuth } from '../context/AuthContext';
import { timeAgo, TOPICS, getDynamicTopicStyles, truncate, parseSujetMeta } from '../utils/helpers';
import toast from 'react-hot-toast';
import ReactionPicker from '../components/forum/ReactionPicker';
import { UserAvatar } from '../components/layout/Navbar';
import { useTranslation } from 'react-i18next';

const TYPE_ICONS = { texte: FileText, image: Image, vocal: Mic, video: Video };

// ── Accent color helper for sidebar
const getAccentBg = (colorClass) => {
  if (!colorClass) return 'bg-neutral-400';
  if (colorClass.includes('blue'))  return 'bg-blue-500';
  if (colorClass.includes('pink'))  return 'bg-pink-500';
  if (colorClass.includes('green')) return 'bg-green-500';
  if (colorClass.includes('amber')) return 'bg-amber-500';
  if (colorClass.includes('red'))   return 'bg-red-500';
  return 'bg-neutral-400';
};

// ── Get style for a sujet
function getSujetStyle(sujet) {
  const meta = parseSujetMeta(sujet.description);
  if (meta) return { colorClass: meta.color, Icon: meta.icon };
  const match = TOPICS.find(t => t.label.toLowerCase() === sujet.titre.toLowerCase());
  if (match) return { colorClass: match.color, Icon: match.icon };
  const dyn = getDynamicTopicStyles(sujet.titre);
  return { colorClass: dyn.color, Icon: dyn.icon };
}

// ── Translate sujet title based on current language
function useTranslatedTitle(titre) {
  const { t } = useTranslation();
  const key = titre?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const translated = t(`subjects.${key}`, { defaultValue: titre });
  return translated;
}

// ── Post card
function PosteCard({ poste, sujet }) {
  const [reactionCounts, setReactionCounts] = useState(poste.reactionCounts || {});
  const [userReaction, setUserReaction] = useState(poste.userReaction || null);
  const [likes, setLikes] = useState(poste.likesCount || 0);
  const TypeIcon = TYPE_ICONS[poste.typeMedia] || FileText;
  const { colorClass, Icon: TopicIcon } = sujet ? getSujetStyle(sujet) : { colorClass: 'badge-gray', Icon: Hash };
  const authorUser = { nom: poste.auteurNom || 'Anonyme', avatar: poste.auteurAvatar || null };
  const translatedSujetTitle = useTranslatedTitle(sujet?.titre);

  const handleReact = (emoji) => {
    const prev = userReaction;
    const prevCounts = { ...reactionCounts };
    const newCounts = { ...reactionCounts };
    if (prev) newCounts[prev] = Math.max(0, (newCounts[prev] || 1) - 1);
    if (emoji !== prev) {
      newCounts[emoji] = (newCounts[emoji] || 0) + 1;
      setUserReaction(emoji);
    } else {
      setUserReaction(null);
    }
    setReactionCounts(newCounts);
    setLikes(Object.values(newCounts).reduce((a, b) => a + b, 0));
    forumService.toggleLikePoste(poste.id, emoji).catch(() => {
      setReactionCounts(prevCounts);
      setUserReaction(prev);
      toast.error('Erreur lors du like');
    });
  };

  return (
    <Link to={`/postes/${poste.id}`} className="card p-5 hover:shadow-md transition-shadow block group fade-in">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <UserAvatar user={authorUser} size="w-9 h-9" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`${colorClass} px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1`}>
              {TopicIcon && <TopicIcon size={10} />}
              {translatedSujetTitle}
            </span>
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Clock size={11} /> {timeAgo(poste.datePublication)}
            </span>
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <TypeIcon size={11} /> {poste.typeMedia}
            </span>
          </div>

          {poste.titre && (
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-snug mb-1 group-hover:text-primary-600 transition-colors">
              {poste.titre}
            </p>
          )}

          {poste.contenu && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {truncate(poste.contenu, 120)}
            </p>
          )}

          <div
            className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100/60 dark:border-neutral-800"
            onClick={e => e.preventDefault()}
          >
            <ReactionPicker
              userReaction={userReaction}
              counts={reactionCounts}
              total={likes}
              onReact={handleReact}
              size="sm"
            />
            <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-primary-500 transition-colors px-2 py-1">
              <MessageSquare size={14} />
              <span className="text-xs">{poste.nombreCommentaires ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [allSujets, setAllSujets]   = useState([]);
  const [allPostes, setAllPostes]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const { user, isAdmin }           = useAuth();
  const [searchParams]              = useSearchParams();
  const topicFilter                 = searchParams.get('topic');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    forumService.getSujets({ statut: 'valide' })
      .then(async (sujets) => {
        setAllSujets(sujets);
        const results = await Promise.all(
          sujets.map(s =>
            forumService.getPostes(s.id, { statut: 'valide' })
              .then(postes => postes.map(p => ({ ...p, sujet: s })))
              .catch(() => [])
          )
        );
        const flat = results.flat().sort(
          (a, b) => new Date(b.datePublication) - new Date(a.datePublication)
        );
        setAllPostes(flat);
      })
      .catch(() => toast.error('Impossible de charger les posts'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPostes = allPostes.filter(p => {
    const matchesTopic = !topicFilter || p.sujet?.titre.toLowerCase() === topicFilter.toLowerCase();
    const matchesSearch = !searchQuery ||
      p.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contenu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sujet?.titre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const popularSujets = [...allSujets]
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6 fade-in">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e0e15] via-[#161622] to-[#252538] p-6 md:p-8 text-white shadow-xl min-h-[160px] flex flex-col justify-center">
        <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden select-none">
          <div className="absolute inset-0 animate-logo-reveal animate-float" style={{ clipPath: 'inset(0 60% 0 0)' }}>
            <img src="/dark-banner.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 animate-text-reveal" style={{ clipPath: 'inset(0 0 0 38%)' }}>
            <img src="/dark-banner.png" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-primary-200">
              {t('hero.title')}
            </h1>
            <p className="text-neutral-300 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
          <div className="flex gap-4 self-start md:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 flex flex-col min-w-[90px]">
              <span className="text-2xl md:text-3xl font-extrabold">{allSujets.length}</span>
              <span className="text-xs text-neutral-300 font-semibold uppercase tracking-wider">{t('forum.topics')}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 flex flex-col min-w-[90px]">
              <span className="text-2xl md:text-3xl font-extrabold">{allPostes.length}</span>
              <span className="text-xs text-neutral-300 font-semibold uppercase tracking-wider">{t('forum.posts')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Add topic */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('forum.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-white focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all shadow-sm font-medium"
          />
        </div>
        {user && (
          <Link to="/ajouter-sujet" className="btn-secondary rounded-2xl px-5 py-3 whitespace-nowrap shadow-sm bg-white dark:bg-neutral-900">
            <Plus size={16} /> {t('forum.addSubject')}
          </Link>
        )}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Posts feed */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {topicFilter ? topicFilter.charAt(0).toUpperCase() + topicFilter.slice(1) : t('forum.allPosts')}
              </h2>
              <p className="text-xs text-neutral-400 font-medium">
                {filteredPostes.length} {t('forum.posts').toLowerCase()}
              </p>
            </div>
            {user && (
              <Link to="/proposer-sujet" className="btn-primary rounded-xl text-xs py-2 px-3 shadow-md shadow-primary-500/10">
                <Plus size={14} /> {t('forum.addPost')}
              </Link>
            )}
          </div>

          {/* Topic filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/"
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all backdrop-blur-sm border ${!topicFilter ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/10' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:shadow-sm'}`}
            >
              {t('forum.all')}
            </Link>
            {allSujets.map(s => {
              const { colorClass, Icon } = getSujetStyle(s);
              const isActive = topicFilter && s.titre.toLowerCase() === topicFilter.toLowerCase();
              const translatedTitle = t(`subjects.${s.titre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, { defaultValue: s.titre });
              return (
                <Link
                  key={s.id}
                  to={`/?topic=${encodeURIComponent(s.titre.toLowerCase())}`}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all backdrop-blur-sm flex items-center gap-1.5 ${colorClass} border hover:opacity-80 ${isActive ? 'shadow-sm font-bold border-current' : 'bg-opacity-40 border-transparent font-medium'}`}
                >
                  {Icon && <Icon size={13} />}
                  {translatedTitle}
                </Link>
              );
            })}
          </div>

          {/* Posts list */}
          {loading ? (
            <div className="flex justify-center py-16 text-neutral-300">
              <Loader size={28} className="animate-spin" />
            </div>
          ) : filteredPostes.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center shadow-sm">
              <MessageSquare size={56} className="mx-auto text-neutral-300 mb-4 animate-pulse" />
              <h3 className="font-bold text-neutral-800 dark:text-white text-lg">{t('forum.noPosts')}</h3>
              <p className="text-neutral-500 text-sm mt-2 max-w-sm mx-auto">
                {searchQuery ? t('forum.noPostsSearch') : t('forum.noPostsYet')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredPostes.map(p => (
                <PosteCard key={p.id} poste={p} sujet={p.sujet} />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">

          {/* Popular Topics */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-amber-500" /> {t('forum.popularTopics')} 🔥
            </h3>
            <div className="flex flex-col gap-3">
              {popularSujets.map((s, idx) => {
                const { colorClass, Icon } = getSujetStyle(s);
                const accentBg = getAccentBg(colorClass);
                const translatedTitle = t(`subjects.${s.titre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, { defaultValue: s.titre });
                return (
                  <Link
                    key={s.id}
                    to={`/?topic=${encodeURIComponent(s.titre.toLowerCase())}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-600 dark:text-neutral-400">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-800 dark:text-white truncate group-hover:text-primary-600 transition-colors">{translatedTitle}</p>
                        <p className="text-[10px] text-neutral-400 font-medium">{s.nombrePostes ?? 0} {t('forum.posts').toLowerCase()} · {s.likesCount || 0} {t('forum.likes')}</p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${accentBg}`} />
                  </Link>
                );
              })}
              {popularSujets.length === 0 && <p className="text-xs text-neutral-400 text-center py-2">{t('forum.noTopics')}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-primary-500" /> {t('forum.stats')} 📊
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-2xl text-center">
                <span className="block text-xl font-extrabold text-neutral-800 dark:text-white">{allSujets.length}</span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{t('forum.topics')}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-2xl text-center">
                <span className="block text-xl font-extrabold text-neutral-800 dark:text-white">{allPostes.length}</span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{t('forum.posts')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}