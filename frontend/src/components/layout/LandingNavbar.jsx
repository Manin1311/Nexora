import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Sun, Moon, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import Avatar from '@/components/ui/Avatar'

const NAV_LINKS = [
  { to: '/#features', hash: 'features', label: 'Features' },
  { to: '/#how-it-works', hash: 'how-it-works', label: 'How it Works' },
  { to: '/about', hash: 'about', label: 'About' },
  { to: '/roadmap', hash: 'roadmap', label: 'Roadmap' },
  { to: '/#pricing', hash: 'pricing', label: 'Pricing' },
]

export default function LandingNavbar() {
  const { user, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header style={{
        position: 'fixed',
        top: scrolled ? '12px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: '1400px',
        zIndex: 100,
        height: '72px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 32px',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        background: theme === 'dark' ? 'rgba(10, 10, 25, 0.65)' : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '9999px',
        border: theme === 'dark' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.12)',
        boxShadow: scrolled ? '0 16px 40px -10px rgba(0,0,0,0.3)' : '0 8px 32px -10px rgba(0,0,0,0.1)',
      }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <motion.div whileHover={{ scale: 1.08, rotate: 8 }} style={{
              width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              <Zap size={17} color="#fff" strokeWidth={2.5} />
            </motion.div>
            <span className="gradient-text" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>Nexora</span>
          </Link>
        </div>

        {/* ── Desktop Nav Links (center) ── */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} className="landing-nav-desktop">
          {NAV_LINKS.map(link => {
            const isHash = link.to.startsWith('/#')
            return (
              <Link key={link.hash}
                to={link.to}
                onClick={(e) => {
                  if (isHash) {
                    e.preventDefault();
                    const el = document.getElementById(link.hash);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  color: 'var(--text-color)',
                  background: 'var(--glass-bg)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#818cf8'
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-color)'
                  e.currentTarget.style.background = 'var(--glass-bg)'
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)'
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }} className="landing-nav-desktop">
          {/* Theme Toggle */}
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={toggleTheme}
            style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-color)', outline: 'none', transition: 'all 0.2s' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </motion.button>

          {isAuthenticated ? (
            <Link to="/challenges" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
              padding: '8px 18px', borderRadius: 9999, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-color)' }}>
              <Avatar src={user?.profile?.avatar} name={user?.full_name} rank={user?.profile?.dev_rank} size="xs" />
              <span>{user?.full_name?.split(' ')[0]}</span>
            </Link>
          ) : (
            <>
              <Link to="/login"
                style={{ padding: '8px 18px', borderRadius: 9999, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)',
                  textDecoration: 'none', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                  transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-heading)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}>
                Sign In
              </Link>
              <Link to="/register">
                <motion.div whileHover={{ scale: 1.04, y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }} whileTap={{ scale: 0.97 }}
                  style={{ padding: '8px 22px', borderRadius: 9999, fontSize: 14, fontWeight: 600, color: '#fff',
                    background: '#111111', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    cursor: 'pointer', transition: 'all 0.2s' }}>
                  Get Started
                </motion.div>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }} className="landing-nav-mobile">
          <button onClick={toggleTheme}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-color)', outline: 'none' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={() => setMobileOpen(o => !o)}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-color)', outline: 'none' }}>
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Dropdown Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed', top: 100, left: '4%', right: '4%', zIndex: 99,
                background: theme === 'dark' ? 'rgba(10, 10, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px', border: '1px solid var(--nav-border)', padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 8,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}>
              {NAV_LINKS.map(link => {
                const isHash = link.to.startsWith('/#')
                return (
                  <NavLink key={link.hash} to={link.to} onClick={() => setMobileOpen(false)}
                    style={({ isActive }) => ({
                      padding: '12px 16px', borderRadius: 12, fontSize: 15, fontWeight: 500, textDecoration: 'none',
                      color: isActive && !isHash ? 'var(--nav-text-active)' : 'var(--nav-text-inactive)',
                      background: isActive && !isHash ? 'rgba(99,102,241,0.1)' : 'transparent',
                    })}>
                    {link.label}
                  </NavLink>
                )
              })}
              <div style={{ borderTop: '1px solid var(--nav-border)', paddingTop: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isAuthenticated ? (
                  <Link to="/challenges" onClick={() => setMobileOpen(false)}
                    style={{ padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#fff',
                      background: '#111111', textDecoration: 'none', textAlign: 'center' }}>
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      style={{ padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, textAlign: 'center',
                        color: 'var(--text-muted)', textDecoration: 'none', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}
                      style={{ padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#fff',
                        background: '#111111', textDecoration: 'none', textAlign: 'center' }}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
            {/* Backdrop */}
            <div onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          </>
        )}
      </AnimatePresence>

      {/* Responsive styles */}
      <style>{`
        .landing-nav-desktop { display: flex !important; }
        .landing-nav-mobile  { display: none  !important; }
        @media (max-width: 768px) {
          .landing-nav-desktop { display: none  !important; }
          .landing-nav-mobile  { display: flex !important; }
        }
      `}</style>
    </>
  )
}
