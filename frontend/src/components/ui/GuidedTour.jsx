import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  ArrowRight, ArrowLeft, X, Rocket, Swords, Gamepad2,
  FlaskConical, Map, Microscope, FileText, BookOpen,
  TrendingUp, Bot, Sparkles, MapPin, Palette
} from 'lucide-react'

const TOUR_STEPS = [
  {
    target: 'tour-logo',
    title: '👋 Welcome to Nexora!',
    description: "You're now inside the developer growth ecosystem. This 30-second tour will show you everything available at your fingertips.",
    icon: Rocket,
    color: '#6366f1',
    placement: 'right',
  },
  {
    target: 'tour-challenges',
    title: '⚔️ Challenges',
    description: 'Solve real-world LeetCode-style coding problems. Each challenge earns you XP and helps boost your developer rank.',
    icon: Swords,
    color: '#f59e0b',
    placement: 'right',
  },
  {
    target: 'tour-arena',
    title: '🎮 Code Arena',
    description: 'Battle other developers in live 1v1 coding duels or aptitude fights. CS Fundamentals quizzes are also here!',
    icon: Gamepad2,
    color: '#ec4899',
    placement: 'right',
  },
  {
    target: 'tour-interview',
    title: '🧪 Interview Lab',
    description: 'Practice AI-powered mock interviews. Get real-time scoring, detailed feedback and transcripts for every session.',
    icon: FlaskConical,
    color: '#10b981',
    placement: 'right',
  },
  {
    target: 'tour-roadmap',
    title: '🗺️ My Roadmap',
    description: 'Upload your resume and get a personalised week-by-week learning roadmap with curated YouTube resources.',
    icon: Map,
    color: '#3b82f6',
    placement: 'right',
  },
  {
    target: 'tour-codereview',
    title: '🔬 Code Review',
    description: 'Paste any code and receive instant AI-powered quality analysis, security checks, and refactoring suggestions.',
    icon: Microscope,
    color: '#8b5cf6',
    placement: 'right',
  },
  {
    target: 'tour-resume',
    title: '📄 Resume Hub',
    description: 'Build and manage your developer resume. Nexora uses it to personalise your roadmap and match your skills.',
    icon: FileText,
    color: '#06b6d4',
    placement: 'right',
  },
  {
    target: 'tour-revision',
    title: '📚 Revision Hub',
    description: 'AI-generated spaced repetition flashcards built from your past mistakes and study patterns to keep knowledge fresh.',
    icon: BookOpen,
    color: '#f97316',
    placement: 'right',
  },
  {
    target: 'tour-showcase',
    title: '🎨 Showcase',
    description: 'Build your public developer portfolio. Share your projects, skills, and certifications with the world and stand out to recruiters.',
    icon: Palette,
    color: '#ec4899',
    placement: 'right',
  },
  {
    target: 'tour-progress',
    title: '📈 Progress',
    description: 'Track your XP growth, developer rank, coding streaks, and GitHub contribution analytics all in one place.',
    icon: TrendingUp,
    color: '#34d399',
    placement: 'right',
  },
  {
    target: 'tour-mentor',
    title: '🤖 Dev Mentor',
    description: "Your always-available AI dev mentor. Ask anything — coding doubts, career advice, system design, or interview tips.",
    icon: Bot,
    color: '#a78bfa',
    placement: 'right',
  },
]

function getRect(selector) {
  const el = document.querySelector(`[data-tour="${selector}"]`)
  if (!el) return null
  return el.getBoundingClientRect()
}

function TooltipArrow({ placement }) {
  if (placement === 'right') {
    return (
      <div style={{
        position: 'absolute',
        left: -8,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: '8px solid var(--card-bg, #0f172a)',
      }} />
    )
  }
  return null
}

export default function GuidedTour({ isActive, onClose, onForceExpand }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const rafRef = useRef(null)

  const current = TOUR_STEPS[step]

  const measureTarget = useCallback(() => {
    if (!current) return
    const r = getRect(current.target)
    setRect(r)
  }, [current])

  // Poll target element position every animation frame for smooth tracking
  useEffect(() => {
    if (!isActive || showWelcome) return
    const loop = () => {
      measureTarget()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isActive, showWelcome, measureTarget])

  // Re-measure on step change
  useEffect(() => {
    if (!showWelcome) measureTarget()
  }, [step, showWelcome, measureTarget])

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1)
    else handleFinish()
  }

  const handleBack = () => setStep(s => Math.max(0, s - 1))

  const handleFinish = () => {
    localStorage.setItem('nexora_tour_done', 'true')
    onClose?.()
    cancelAnimationFrame(rafRef.current)
  }

  const handleStart = () => {
    setShowWelcome(false)
    onForceExpand?.()
  }

  if (!isActive) return null

  // Compute tooltip position
  const PADDING = 16
  const TOOLTIP_W = 320
  let tooltipStyle = { position: 'fixed', zIndex: 100001 }
  if (rect) {
    const top = rect.top + rect.height / 2 - 100
    const left = rect.right + PADDING
    tooltipStyle = {
      ...tooltipStyle,
      top: Math.max(PADDING, Math.min(top, window.innerHeight - 260)),
      left: Math.min(left, window.innerWidth - TOOLTIP_W - PADDING),
      width: TOOLTIP_W,
    }
  }

  // Spotlight clip rect with padding
  const SP = 8
  const spotRect = rect ? {
    top: rect.top - SP,
    left: rect.left - SP,
    width: rect.width + SP * 2,
    height: rect.height + SP * 2,
    borderRadius: 12,
  } : null

  const IconComp = current?.icon || Sparkles

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <>
          {/* === Welcome Modal === */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                key="welcome-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed', inset: 0, zIndex: 100000,
                  background: 'rgba(5, 5, 15, 0.85)', backdropFilter: 'blur(20px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  style={{
                    background: 'var(--card-bg, #0f172a)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 24,
                    padding: '40px 40px 36px',
                    maxWidth: 480, width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
                  }} />

                  {/* Icon */}
                  <div style={{
                    width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Rocket size={36} style={{ color: '#818cf8' }} />
                  </div>

                  {/* Gradient badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 14px', borderRadius: 20, marginBottom: 16,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: 1.2,
                  }}>
                    <MapPin size={11} /> FIRST TIME SETUP
                  </div>

                  <h2 style={{
                    fontSize: 26, fontWeight: 900, color: 'var(--text-heading, #fff)',
                    margin: '0 0 12px', letterSpacing: '-0.03em',
                    fontFamily: 'var(--font-display, inherit)',
                  }}>
                    Welcome to <span style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nexora</span>!
                  </h2>

                  <p style={{
                    fontSize: 14, color: 'var(--text-muted, #94a3b8)', lineHeight: 1.7,
                    margin: '0 0 32px',
                  }}>
                    You've joined the developer growth ecosystem. Take a <strong style={{ color: 'var(--text-color)' }}>30-second tour</strong> to discover every feature built to accelerate your engineering career.
                  </p>

                  {/* Step preview pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
                    {['Challenges', 'Code Arena', 'Interview Lab', 'Roadmap', 'Code Review', 'Resume', 'Revision', 'Showcase', 'Progress', 'Mentor'].map(f => (
                      <span key={f} style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-muted)',
                      }}>{f}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      onClick={handleFinish}
                      style={{
                        padding: '11px 22px', borderRadius: 12, border: '1px solid var(--glass-border)',
                        background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-color)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      Skip Tour
                    </button>
                    <motion.button
                      onClick={handleStart}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '11px 28px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                        fontSize: 13, fontWeight: 900, cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      Start Tour <ArrowRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === Spotlight Overlay === */}
          {!showWelcome && (
            <>
              {/* Dark overlay with spotlight cutout using SVG clip */}
              <svg
                style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 100000, pointerEvents: 'none' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    {spotRect && (
                      <rect
                        x={spotRect.left}
                        y={spotRect.top}
                        width={spotRect.width}
                        height={spotRect.height}
                        rx={spotRect.borderRadius}
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(5,5,15,0.78)"
                  mask="url(#spotlight-mask)"
                />
                {/* Spotlight glow ring */}
                {spotRect && (
                  <rect
                    x={spotRect.left - 2}
                    y={spotRect.top - 2}
                    width={spotRect.width + 4}
                    height={spotRect.height + 4}
                    rx={spotRect.borderRadius + 2}
                    fill="none"
                    stroke="rgba(99,102,241,0.6)"
                    strokeWidth="1.5"
                  />
                )}
              </svg>

              {/* Click blocker overlay (allows spotlight area to be interactive) */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 100000 }}
                onClick={handleNext}
              />

              {/* Tooltip Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -16, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    ...tooltipStyle,
                    background: 'var(--card-bg, #0f172a)',
                    border: `1px solid ${current?.color || '#6366f1'}44`,
                    borderRadius: 18,
                    padding: '22px 22px 18px',
                    boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${current?.color || '#6366f1'}22`,
                    pointerEvents: 'all',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <TooltipArrow placement={current?.placement} />

                  {/* Close button */}
                  <button
                    onClick={handleFinish}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 26, height: 26, borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11,
                    }}
                  >
                    <X size={13} />
                  </button>

                  {/* Step progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: `${current?.color || '#6366f1'}1a`,
                      border: `1px solid ${current?.color || '#6366f1'}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconComp size={16} style={{ color: current?.color || '#6366f1' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {TOUR_STEPS.map((_, i) => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i <= step ? (current?.color || '#6366f1') : 'rgba(255,255,255,0.08)',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
                        Step {step + 1} of {TOUR_STEPS.length}
                      </div>
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: 15, fontWeight: 900, color: 'var(--text-heading, #fff)',
                    margin: '0 0 8px', letterSpacing: '-0.02em',
                  }}>
                    {current?.title}
                  </h3>
                  <p style={{
                    fontSize: 12.5, color: 'var(--text-muted, #94a3b8)',
                    lineHeight: 1.65, margin: '0 0 18px',
                  }}>
                    {current?.description}
                  </p>

                  {/* Controls */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {step > 0 && (
                      <button
                        onClick={handleBack}
                        style={{
                          padding: '8px 14px', borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <ArrowLeft size={13} /> Back
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      style={{
                        flex: 1, padding: '9px 16px', borderRadius: 10, border: 'none',
                        background: `linear-gradient(135deg, ${current?.color || '#6366f1'}, ${current?.color || '#6366f1'}cc)`,
                        color: '#fff', fontSize: 12.5, fontWeight: 900, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: `0 4px 16px ${current?.color || '#6366f1'}40`,
                      }}
                    >
                      {step === TOUR_STEPS.length - 1 ? (
                        <><Sparkles size={13} /> Finish Tour</>
                      ) : (
                        <>Next <ArrowRight size={13} /></>
                      )}
                    </button>
                  </div>

                  {/* Hint to click anywhere */}
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, opacity: 0.6 }}>
                    or click anywhere on the dark area to advance
                  </p>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
