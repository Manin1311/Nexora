import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, FlaskConical, Map, Microscope, FileText,
  Palette, TrendingUp, Bot, User, LogOut, Moon, Sun,
  ChevronRight, Clock, Swords, Home
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const ALL_COMMANDS = [
  { id: 'home',       label: 'Go to Home',           group: 'Navigate', icon: Home,         path: '/' },
  { id: 'challenges', label: 'Go to Challenges',     group: 'Navigate', icon: Swords,       path: '/challenges' },
  { id: 'interview',  label: 'Interview Lab',         group: 'Navigate', icon: FlaskConical, path: '/interview' },
  { id: 'roadmap',    label: 'My Roadmap',            group: 'Navigate', icon: Map,          path: '/roadmap' },
  { id: 'codereview', label: 'Code Review',           group: 'Navigate', icon: Microscope,   path: '/codereview' },
  { id: 'resume',     label: 'Resume Hub',            group: 'Navigate', icon: FileText,     path: '/resume' },
  { id: 'showcase',   label: 'Showcase',              group: 'Navigate', icon: Palette,      path: '/showcase' },
  { id: 'progress',   label: 'Progress',              group: 'Navigate', icon: TrendingUp,   path: '/progress' },
  { id: 'mentor',     label: 'Dev Mentor',            group: 'Navigate', icon: Bot,          path: '/mentor' },
  { id: 'profile',    label: 'My Profile',            group: 'Navigate', icon: User,         path: '/profile' },
  { id: 'theme',      label: 'Toggle Dark / Light Mode', group: 'Actions', icon: Moon,      action: 'theme' },
  { id: 'logout',     label: 'Log Out',               group: 'Actions',  icon: LogOut,       action: 'logout' },
]

function fuzzyMatch(text, query) {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length
}

function Highlighted({ text, query }) {
  if (!query) return <span>{text}</span>
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const parts = []
  let qi = 0
  for (let i = 0; i < text.length; i++) {
    if (qi < q.length && lower[i] === q[qi]) {
      parts.push({ ch: text[i], match: true })
      qi++
    } else {
      parts.push({ ch: text[i], match: false })
    }
  }
  return (
    <span>
      {parts.map((p, i) =>
        p.match
          ? <span key={i} style={{ color: '#818cf8', fontWeight: 700 }}>{p.ch}</span>
          : <span key={i}>{p.ch}</span>
      )}
    </span>
  )
}

export default function CommandPalette() {
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)
  const [recent, setRecent]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexora_cmd_recent') || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)
  const listRef  = useRef(null)
  const navigate  = useNavigate()
  const { logout } = useAuth()
  const { toggleTheme } = useTheme()

  const closePalette = useCallback(() => { setOpen(false); setQuery('') }, [])

  // Global Ctrl+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => {
          if (!prev) { setQuery(''); setSelected(0) }
          return !prev
        })
      }
      if (e.key === 'Escape') closePalette()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closePalette])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  // Lock background scroll when palette is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Build filtered + grouped list
  const filtered = query
    ? ALL_COMMANDS.filter(c => fuzzyMatch(c.label, query))
    : [
        ...recent.map(id => ALL_COMMANDS.find(c => c.id === id)).filter(Boolean).map(c => ({ ...c, group: 'Recent' })),
        ...ALL_COMMANDS.filter(c => !recent.includes(c.id)),
      ]

  const groups = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})
  const flat = Object.values(groups).flat()

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter')     { e.preventDefault(); execute(flat[selected]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flat, selected])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelectorAll('[data-cmd-item]')[selected]
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  const execute = (cmd) => {
    if (!cmd) return
    closePalette()
    const newRecent = [cmd.id, ...recent.filter(r => r !== cmd.id)].slice(0, 5)
    setRecent(newRecent)
    localStorage.setItem('nexora_cmd_recent', JSON.stringify(newRecent))
    if (cmd.path)            navigate(cmd.path)
    else if (cmd.action === 'theme')  toggleTheme()
    else if (cmd.action === 'logout') logout()
  }

  const kbd = (label) => (
    <kbd style={{
      fontSize: 9, padding: '2px 6px', borderRadius: 5,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--text-muted)', fontFamily: 'monospace',
    }}>{label}</kbd>
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closePalette}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          />

          {/* Palette box */}
          <motion.div
            key="cmd-palette"
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'fixed', top: '17%', left: '50%', transform: 'translateX(-50%)',
              width: '95%', maxWidth: 580, zIndex: 9999,
              background: 'var(--card-bg)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 18,
              boxShadow: '0 32px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)', opacity: 0.8 }} />

            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--glass-border)' }}>
              <Search size={17} style={{ color: '#818cf8', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0) }}
                placeholder="Type a command or page name..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, fontWeight: 500, color: 'var(--text-color)', fontFamily: 'inherit',
                }}
              />
              {kbd('ESC')}
            </div>

            {/* Results */}
            <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
              {flat.length === 0 ? (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No results for "<strong>{query}</strong>"
                </div>
              ) : Object.entries(groups).map(([group, cmds]) => (
                <div key={group}>
                  <div style={{ padding: '6px 18px 3px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {group === 'Recent' && <Clock size={9} />}
                    {group}
                  </div>
                  {cmds.map(cmd => {
                    const globalIdx = flat.findIndex(f => f.id === cmd.id)
                    const isActive  = globalIdx === selected
                    const Icon = cmd.icon
                    return (
                      <motion.div
                        key={cmd.id}
                        data-cmd-item
                        onMouseEnter={() => setSelected(globalIdx)}
                        onClick={() => execute(cmd)}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 18px', cursor: 'pointer',
                          background: isActive ? 'rgba(99,102,241,0.13)' : 'transparent',
                          borderLeft: `3px solid ${isActive ? '#6366f1' : 'transparent'}`,
                          transition: 'background 0.1s ease, border-color 0.1s ease',
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isActive ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.07)',
                          border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                          transition: 'all 0.15s ease',
                        }}>
                          <Icon size={16} style={{ color: isActive ? '#818cf8' : 'var(--text-muted)' }} />
                        </div>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: isActive ? 'var(--text-color)' : 'var(--text-muted)', transition: 'color 0.1s' }}>
                          <Highlighted text={cmd.label} query={query} />
                        </span>
                        {isActive && (
                          <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
                            <ChevronRight size={14} style={{ color: '#6366f1' }} />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Footer hints */}
            <div style={{ padding: '8px 18px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 14, opacity: 0.45 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {kbd('↑')} {kbd('↓')} <span style={{ marginLeft: 2 }}>navigate</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {kbd('↵')} open
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {kbd('Ctrl+K')} toggle
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
