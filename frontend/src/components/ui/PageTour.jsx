import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { ArrowRight, ArrowLeft, X, Sparkles, HelpCircle } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

function getRect(target) {
  const el = document.querySelector(`[data-tour="${target}"]`)
  return el ? el.getBoundingClientRect() : null
}

function TooltipArrow({ placement }) {
  const base = { position: 'absolute', width: 0, height: 0 }
  if (placement === 'right') return (
    <div style={{
      ...base, left: -8, top: '50%', transform: 'translateY(-50%)',
      borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
      borderRight: '8px solid var(--card-bg, #0f172a)',
    }} />
  )
  if (placement === 'left') return (
    <div style={{
      ...base, right: -8, top: '50%', transform: 'translateY(-50%)',
      borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
      borderLeft: '8px solid var(--card-bg, #0f172a)',
    }} />
  )
  if (placement === 'bottom') return (
    <div style={{
      ...base, top: -8, left: '50%', transform: 'translateX(-50%)',
      borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
      borderBottom: '8px solid var(--card-bg, #0f172a)',
    }} />
  )
  if (placement === 'top') return (
    <div style={{
      ...base, bottom: -8, left: '50%', transform: 'translateX(-50%)',
      borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
      borderTop: '8px solid var(--card-bg, #0f172a)',
    }} />
  )
  return null
}

/* ─────────────────────────────────────────────────────────────────────────────
   PageTour — main component
───────────────────────────────────────────────────────────────────────────── */

/**
 * PageTour
 *
 * @param {object[]} steps     - Array of { target, title, description, icon?, color?, placement? }
 * @param {string}   pageKey   - Used for display only (e.g. step counter colour)
 * @param {boolean}  isOpen    - Whether the tour is active
 * @param {function} onClose   - Called when the tour is dismissed or finished
 * @param {string}   [accentColor='#6366f1'] - Primary accent colour for this page's tour
 */
export default function PageTour({
  steps = [],
  isOpen,
  onClose,
  accentColor = '#6366f1',
}) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const rafRef = useRef(null)

  const current = steps[step]

  const measureTarget = useCallback(() => {
    if (!current) return
    const r = getRect(current.target)
    setRect(r)
  }, [current])

  // Poll target position every animation frame for smooth tracking
  useEffect(() => {
    if (!isOpen) return
    const loop = () => {
      measureTarget()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isOpen, measureTarget])

  // Re-measure immediately & scroll target into view on step change
  useEffect(() => {
    if (isOpen && current) {
      measureTarget()
      const el = document.querySelector(`[data-tour="${current.target}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }
    }
  }, [step, isOpen, current, measureTarget])

  // Reset step when tour re-opens
  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen])

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1)
    else handleFinish()
  }

  const handleBack = () => setStep(s => Math.max(0, s - 1))

  const handleFinish = () => {
    cancelAnimationFrame(rafRef.current)
    onClose?.()
  }

  if (!isOpen || !steps.length) return null

  /* ── Tooltip positioning ── */
  const PADDING = 16
  const TOOLTIP_W = 320
  const color = current?.color || accentColor
  const placement = current?.placement || 'right'

  let tooltipStyle = { position: 'fixed', zIndex: 100001 }

  if (rect) {
    if (placement === 'right') {
      const top = rect.top + rect.height / 2 - 100
      tooltipStyle = {
        ...tooltipStyle,
        top: Math.max(PADDING, Math.min(top, window.innerHeight - 260)),
        left: Math.min(rect.right + PADDING, window.innerWidth - TOOLTIP_W - PADDING),
        width: TOOLTIP_W,
      }
    } else if (placement === 'left') {
      const top = rect.top + rect.height / 2 - 100
      tooltipStyle = {
        ...tooltipStyle,
        top: Math.max(PADDING, Math.min(top, window.innerHeight - 260)),
        left: Math.max(PADDING, rect.left - TOOLTIP_W - PADDING),
        width: TOOLTIP_W,
      }
    } else if (placement === 'bottom') {
      tooltipStyle = {
        ...tooltipStyle,
        top: Math.min(rect.bottom + PADDING, window.innerHeight - 260),
        left: Math.max(PADDING, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - PADDING)),
        width: TOOLTIP_W,
      }
    } else if (placement === 'top') {
      tooltipStyle = {
        ...tooltipStyle,
        top: Math.max(PADDING, rect.top - 240 - PADDING),
        left: Math.max(PADDING, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - PADDING)),
        width: TOOLTIP_W,
      }
    }
  } else {
    // Fallback centre-screen if element not found
    tooltipStyle = {
      ...tooltipStyle,
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TOOLTIP_W,
    }
  }

  /* ── Spotlight rect ── */
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
      {isOpen && (
        <>
          {/* Dark overlay with spotlight cutout */}
          <svg
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 100000, pointerEvents: 'none' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask id="page-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {spotRect && (
                  <rect
                    x={spotRect.left} y={spotRect.top}
                    width={spotRect.width} height={spotRect.height}
                    rx={spotRect.borderRadius} fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%" height="100%"
              fill="rgba(5,5,15,0.55)"
              mask="url(#page-spotlight-mask)"
            />
            {/* Glow ring around spotlight */}
            {spotRect && (
              <rect
                x={spotRect.left - 2} y={spotRect.top - 2}
                width={spotRect.width + 4} height={spotRect.height + 4}
                rx={spotRect.borderRadius + 2}
                fill="none"
                stroke={`${color}99`}
                strokeWidth="1.5"
              />
            )}
          </svg>

          {/* Click blocker (clicking dark area advances) */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 100000 }}
            onClick={handleNext}
          />

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: placement === 'left' ? 16 : -16, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                ...tooltipStyle,
                background: 'var(--card-bg, #0f172a)',
                border: `1px solid ${color}44`,
                borderRadius: 18,
                padding: '22px 22px 18px',
                boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`,
                pointerEvents: 'all',
                position: tooltipStyle.transform ? 'fixed' : tooltipStyle.position,
              }}
              onClick={e => e.stopPropagation()}
            >
              <TooltipArrow placement={placement} />

              {/* Close */}
              <button
                onClick={handleFinish}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 26, height: 26, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={13} />
              </button>

              {/* Step header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `${color}1a`, border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconComp size={16} style={{ color }} />
                </div>
                <div style={{ flex: 1 }}>
                  {/* Progress bar */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {steps.map((_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= step ? color : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
                    Step {step + 1} of {steps.length}
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
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    color: '#fff', fontSize: 12.5, fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: `0 4px 16px ${color}40`,
                  }}
                >
                  {step === steps.length - 1 ? (
                    <><Sparkles size={13} /> Got it!</>
                  ) : (
                    <>Next <ArrowRight size={13} /></>
                  )}
                </button>
              </div>

              <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, opacity: 0.6 }}>
                or click anywhere on the dark area to advance
              </p>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   HelpButton — the ? button rendered on each page
───────────────────────────────────────────────────────────────────────────── */

/**
 * HelpButton — floating ? button that re-opens the page tour.
 * Rendered by each page component (NOT by PageTour itself, so pages control placement).
 */
export function HelpButton({ onClick, accentColor = '#6366f1' }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      title="Page Guide"
      style={{
        position: 'fixed',
        top: 20,
        right: 24,
        zIndex: 500,
        width: 38,
        height: 38,
        borderRadius: '50%',
        border: `1.5px solid ${hovered ? accentColor : 'rgba(255,255,255,0.12)'}`,
        background: hovered
          ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`
          : 'var(--glass-bg, rgba(15,23,42,0.7))',
        backdropFilter: 'blur(12px)',
        color: hovered ? accentColor : 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: hovered
          ? `0 4px 20px ${accentColor}30, 0 0 0 4px ${accentColor}15`
          : '0 2px 12px rgba(0,0,0,0.3)',
        transition: 'border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s',
      }}
    >
      <HelpCircle size={17} strokeWidth={2} />
    </motion.button>
  )
}
