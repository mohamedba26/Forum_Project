import { useState, useRef, useEffect } from 'react'

const REACTIONS = [
  { emoji: '👍', label: 'J\'aime' },
  { emoji: '❤️', label: 'J\'adore' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '😡', label: 'Grrr' },
]

// Show grouped reaction counts: e.g. 👍3 ❤️1
export function ReactionSummary({ counts = {}, userReaction, total }) {
  const entries = Object.entries(counts).filter(([, c]) => c > 0)
  if (total === 0 && !userReaction) return null
  return (
    <span className="flex items-center gap-0.5">
      {entries.map(([emoji, count]) => (
        <span key={emoji} className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${userReaction === emoji ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-neutral-100 text-neutral-600 dark:text-neutral-300'}`}>
          {emoji} {count}
        </span>
      ))}
      {entries.length === 0 && userReaction && (
        <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
          {userReaction} 1
        </span>
      )}
    </span>
  )
}

// Full reaction picker button (Facebook-style hold/hover to expand)
export default function ReactionPicker({ userReaction, counts = {}, total = 0, onReact, size = 'md', disabled = false }) {
  const [open, setOpen]     = useState(false)
  const [hovered, setHovered] = useState(null)
  const timerRef            = useRef(null)
  const containerRef        = useRef(null)

  const sizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setOpen(true), 400)
  }
  const handleMouseLeave = () => {
    clearTimeout(timerRef.current)
    if (!open) return
    timerRef.current = setTimeout(() => setOpen(false), 300)
  }
  const handleClick = () => {
    if (open) { setOpen(false); return }
    // Quick click = toggle 👍 (or remove current reaction)
    if (!disabled) onReact(userReaction ? userReaction : '👍')
  }
  const handlePickReaction = (emoji) => {
    setOpen(false)
    if (!disabled) onReact(emoji)
  }

  const label = userReaction || '👍'
  const hasReaction = !!userReaction

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1.5">
      {/* Reaction bubble picker */}
      {open && (
        <div
          className="absolute bottom-9 left-0 z-50 flex items-center gap-1 bg-white border border-neutral-200 rounded-2xl shadow-xl px-2 py-1.5 fade-in"
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          {REACTIONS.map(r => (
            <button
              key={r.emoji}
              onClick={() => handlePickReaction(r.emoji)}
              onMouseEnter={() => setHovered(r.emoji)}
              onMouseLeave={() => setHovered(null)}
              className="relative flex flex-col items-center transition-transform hover:scale-125 active:scale-110 p-1"
              title={r.label}
            >
              <span className="text-2xl leading-none select-none">{r.emoji}</span>
              {hovered === r.emoji && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-0.5 rounded-lg whitespace-nowrap shadow">
                  {r.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all select-none
          ${sizeMap[size]}
          ${hasReaction
            ? 'text-blue-600 bg-blue-50 font-semibold hover:bg-blue-100'
            : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="text-base leading-none">{label}</span>
        {!hasReaction}
      </button>

      {/* Reaction summary */}
      <ReactionSummary counts={counts} userReaction={userReaction} total={total} />
    </div>
  )
}