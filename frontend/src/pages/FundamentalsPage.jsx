import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, Clock, Play, CheckCircle2, XCircle, Loader2, LogOut,
  RefreshCw, Cpu, Zap, Check, Lock, Building2, Sparkles, AlertTriangle, AlertCircle
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useAuth } from '@/context/AuthContext'
import PageWrapper from '@/components/layout/PageWrapper'
import api from '@/services/api'

const COMPANY_SPECS = [
  {
    name: 'Amazon',
    logo: '📦',
    duration: 70, // minutes
    questions: 2,
    warnings: 2,
    color: '#ff9900',
    bg: 'rgba(255, 153, 0, 0.08)',
    desc: 'Amazon Online Assessment. Focuses on partitioned log data sequences and capacity truck loading.'
  },
  {
    name: 'Google',
    logo: '🔍',
    duration: 85,
    questions: 2,
    warnings: 2,
    color: '#4285f4',
    bg: 'rgba(66, 133, 244, 0.08)',
    desc: 'Google Elite Candidate Screening. Challenges cover optimized email parsing and greedy server groupings.'
  },
  {
    name: 'TCS',
    logo: '⚙️',
    duration: 60,
    questions: 2,
    warnings: 2,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    desc: 'TCS Digital / Ninja Assessment. Covers mathematical circle distribution puzzles and missing sequence values.'
  }
]

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FundamentalsPage() {
  const { user } = useAuth()
  const [screen, setScreen] = useState('lobby') // lobby | exam | scorecard
  const [activeSession, setActiveSession] = useState(null)
  const [loadingCompany, setLoadingCompany] = useState(null) // null | company name
  const [selectedLanguage, setSelectedLanguage] = useState('python')
  
  // Exam state
  const [challenges, setChallenges] = useState([])
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0)
  const [userCodes, setUserCodes] = useState({}) // { challengeId: code }
  const [submittingIds, setSubmittingIds] = useState({}) // { challengeId: boolean }
  const [submissionResults, setSubmissionResults] = useState({}) // { challengeId: { passed, total, status } }
  const [warnings, setWarnings] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isDisqualified, setIsDisqualified] = useState(false)
  
  // Timer and listeners refs
  const timerIntervalRef = useRef(null)
  const isTabAwayRef = useRef(false)
  const examStartTimestampRef = useRef(0)
  const [isScreenFrozen, setIsScreenFrozen] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [screenshotToast, setScreenshotToast] = useState(false)
  
  // Scorecard state
  const [scorecard, setScorecard] = useState(null)

  // Ref to suppress violations while a confirm modal is open or PrintScreen was pressed
  const isConfirmOpenRef = useRef(false)
  const isPrintScreenRef = useRef(false)
  // Stable ref for triggerViolation — prevents stale-closure in useEffect handlers
  const triggerViolationRef = useRef(null)

  // Track when the exam cockpit starts to prevent initial transition focus noise
  useEffect(() => {
    if (screen === 'exam') {
      examStartTimestampRef.current = Date.now()
    }
  }, [screen])

  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await api.get('/challenges/assessment/active/')
        if (res.data.active) {
          const session = res.data
          setActiveSession(session)
          setChallenges(session.challenges)
          setWarnings(session.total_warnings)
          setTimeLeft(session.time_limit_seconds)
          setIsDisqualified(session.total_warnings >= 3)
          setIsScreenFrozen(true)
          
          const codes = {}
          session.challenges.forEach(c => {
            const saved = localStorage.getItem(`oa_code_${session.session_id}_${c.id}`)
            codes[c.id] = saved || c.default_code[selectedLanguage] || ''
          })
          setUserCodes(codes)
          setSubmissionResults({})
          setActiveChallengeIdx(0)
          setScreen('exam')
        }
      } catch (err) {
        console.error("Failed to check active assessment session:", err)
      }
    }
    
    checkActiveSession()
  }, [])

  // Start assessment handler
  const handleStartAssessment = async (company) => {
    setLoadingCompany(company)
    try {
      // Try to enter fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      } catch (err) {
        console.warn("Fullscreen permission denied:", err)
      }

      const res = await api.post('/challenges/assessment/start/', { company })
      const session = res.data
      
      setActiveSession(session)
      setChallenges(session.challenges)
      setWarnings(session.total_warnings)
      setTimeLeft(session.time_limit_seconds)
      setIsDisqualified(false)
      setIsScreenFrozen(false)
      
      // Initialize codes, checking localStorage
      const codes = {}
      session.challenges.forEach(c => {
        const saved = localStorage.getItem(`oa_code_${session.session_id}_${c.id}`)
        codes[c.id] = saved || c.default_code[selectedLanguage] || ''
      })
      setUserCodes(codes)
      setSubmissionResults({})
      setActiveChallengeIdx(0)
      setScreen('exam')
    } catch (err) {
      alert("Failed to start assessment: " + (err.response?.data?.error || err.message))
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
    } finally {
      setLoadingCompany(null)
    }
  }

  // Submit single challenge code
  const handleSubmitCode = async () => {
    const activeChallenge = challenges[activeChallengeIdx]
    if (!activeChallenge || submittingIds[activeChallenge.id]) return

    setSubmittingIds(prev => ({ ...prev, [activeChallenge.id]: true }))
    try {
      const res = await api.post('/challenges/assessment/submit/', {
        session_id: activeSession.session_id,
        challenge_id: activeChallenge.id,
        code: userCodes[activeChallenge.id],
        language: selectedLanguage
      })
      
      setSubmissionResults(prev => ({
        ...prev,
        [activeChallenge.id]: {
          passed: res.data.passed,
          total: res.data.total,
          status: res.data.status
        }
      }))
      
      // Update session steps
      setActiveSession(prev => ({
        ...prev,
        completed_steps: res.data.completed_steps
      }))
    } catch (err) {
      alert("Submission error: " + (err.response?.data?.error || err.message))
    } finally {
      setSubmittingIds(prev => ({ ...prev, [activeChallenge.id]: false }))
    }
  }

  // Log focus-loss telemetry warning — always up-to-date via ref
  const triggerViolation = async (eventType) => {
    if (!activeSession) return
    if (isConfirmOpenRef.current) return  // suppress: our own React modal is open
    if (isPrintScreenRef.current) {        // suppress: PrintScreen key just pressed
      isPrintScreenRef.current = false
      return
    }
    // Show the freeze overlay immediately — don't wait for the network round-trip
    setIsScreenFrozen(true)
    try {
      const res = await api.post('/challenges/assessment/telemetry/', {
        session_id: activeSession?.session_id,
        event_type: eventType
      })
      setWarnings(res.data.total_warnings)
      if (res.data.warning_threshold_exceeded || res.data.status === 'flagged') {
        setIsDisqualified(true)
      }
    } catch (err) {
      console.error("Failed to log telemetry:", err)
    }
  }
  // Keep the ref always pointing at the latest triggerViolation closure
  triggerViolationRef.current = triggerViolation

  // Finish whole assessment
  const handleFinishAssessment = async (wasDisqualified = false) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setIsScreenFrozen(false)
    setShowFinishConfirm(false)
    setIsFinishing(true)
    // Exit Fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen()
      }
    } catch (e) {}
    try {
      const res = await api.post('/challenges/assessment/finish/', {
        session_id: activeSession?.session_id
      })
      setScorecard(res.data)
      setActiveSession(null)
      setScreen('scorecard')
    } catch (err) {
      console.error("Failed to finish assessment: ", err)
      setScreen('lobby')
    } finally {
      setIsFinishing(false)
    }
  }


  // Telemetry monitoring event hooks
  // NOTE: all handlers call via triggerViolationRef so they always use the latest closure
  useEffect(() => {
    if (screen !== 'exam' || !activeSession) return

    const handleVisibilityChange = () => {
      if (isConfirmOpenRef.current) return
      if (document.visibilityState === 'hidden') {
        if (Date.now() - examStartTimestampRef.current < 3000) return
        isTabAwayRef.current = true
      } else if (document.visibilityState === 'visible' && isTabAwayRef.current) {
        isTabAwayRef.current = false
        triggerViolationRef.current?.('tab_blur')
      }
    }

    const handleFullscreenChange = () => {
      if (isConfirmOpenRef.current) return
      if (Date.now() - examStartTimestampRef.current < 3000) return
      if (!document.fullscreenElement) {
        triggerViolationRef.current?.('fullscreen_exit')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // Countdown Timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current)
          triggerViolationRef.current = null // stop violations
          handleFinishAssessment()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [screen, activeSession])

  // Update default code templates on language switch
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang)
    if (screen === 'exam') {
      const newCodes = { ...userCodes }
      challenges.forEach(c => {
        // Only update if not modified from default
        if (!userCodes[c.id] || c.default_code[lang === 'python' ? 'javascript' : 'python'] === userCodes[c.id]) {
          newCodes[c.id] = c.default_code[lang] || ''
        }
      })
      setUserCodes(newCodes)
    }
  }
  const handleCodeChange = (challengeId, value) => {
    setUserCodes(prev => {
      const next = { ...prev, [challengeId]: value }
      if (activeSession) {
        localStorage.setItem(`oa_code_${activeSession.session_id}_${challengeId}`, value)
      }
      return next
    })
  }
  return (
    <PageWrapper noPadding>
      {/* ── Screenshot detected toast ── */}
      {screenshotToast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 9999,
          background: 'rgba(245,158,11,0.95)', backdropFilter: 'blur(8px)',
          border: '1px solid #f59e0b', borderRadius: 12,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(245,158,11,0.3)', color: '#000',
          fontSize: 13, fontWeight: 800, animation: 'slideInRight 0.3s ease'
        }}>
          <ShieldAlert size={16} /> Screenshot detected — not logged as a violation
        </div>
      )}

      {/* ── Non-exam screens (lobby / scorecard) ── */}
      {screen !== 'exam' && (
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--bg-color)',
        overflow: 'auto',
        padding: '28px 36px',
        boxSizing: 'border-box'
      }}>
        {/* Futuristic Background grids */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px', zIndex: 0 }} />

        <AnimatePresence mode="wait">
          
          {/* ══════════════ 1. LOBBY SCREEN ══════════════ */}
          {screen === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ position: 'relative', zIndex: 1 }}
            >
              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)'
                }}>
                  <Cpu size={12} style={{ color: '#818cf8' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: 0.5 }}>CS FUNDAMENTALS</span>
                </div>
                <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 950, color: 'var(--text-heading)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                  Company OA Mock Rig
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', maxW: 550, margin: 0, lineHeight: 1.6 }}>
                  Simulate strict corporate Online Assessments in a proctored sandboxed coding cockpit. Enter fullscreen mode, maintain window focus, and execute under pressure.
                </p>
              </div>

              {/* Company specs cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 12 }}>
                {COMPANY_SPECS.map(spec => (
                  <motion.div
                    key={spec.name}
                    whileHover={{ y: -6, boxShadow: 'var(--glass-shadow)', border: `1px solid ${spec.color}` }}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderTop: `4px solid ${spec.color}`,
                      borderRadius: 18,
                      padding: 28,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      transition: 'border 0.2s, box-shadow 0.2s, transform 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 32 }}>{spec.logo}</span>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900,
                        background: spec.bg, color: spec.color
                      }}>
                        {spec.name.toUpperCase()} PREP
                      </span>
                    </div>

                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 4px' }}>
                        {spec.name} Mock OA
                      </h2>
                      <p style={{ fontSize: 12.5, color: 'var(--text-color)', lineHeight: 1.5, margin: 0 }}>
                        {spec.desc}
                      </p>
                    </div>

                    {/* Meta stats */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                      padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--card-border)', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)',
                      textAlign: 'center'
                    }}>
                      <div>
                        <div style={{ color: 'var(--text-heading)', fontSize: 14, fontWeight: 900, marginBottom: 2 }}>{spec.duration}m</div>
                        <div>Duration</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--card-border)', borderRight: '1px solid var(--card-border)' }}>
                        <div style={{ color: 'var(--text-heading)', fontSize: 14, fontWeight: 900, marginBottom: 2 }}>{spec.questions}</div>
                        <div>Coding Qs</div>
                      </div>
                      <div>
                        <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 900, marginBottom: 2 }}>{spec.warnings}</div>
                        <div>Blur Limit</div>
                      </div>
                    </div>

                    {/* Guidelines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={12} style={{ color: '#10b981' }} /> Enforced full-screen sandbox
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={12} style={{ color: '#10b981' }} /> Anti-cheat tab-switching tracking
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={12} style={{ color: '#10b981' }} /> Hidden test cases verification
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartAssessment(spec.name)}
                      disabled={loadingCompany !== null}
                      style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none', outline: 'none',
                        background: `linear-gradient(135deg, ${spec.color}, #a855f7)`, color: '#fff',
                        fontSize: 13.5, fontWeight: 900, cursor: loadingCompany !== null ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                        marginTop: 'auto', opacity: loadingCompany !== null && loadingCompany !== spec.name ? 0.5 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {loadingCompany === spec.name ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <><Zap size={14} /> Start Proctored Assessment</>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════ 3. SCORECARD REPORT SCREEN ══════════════ */}
          {screen === 'scorecard' && scorecard && (
            <motion.div
              key="scorecard"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', position: 'relative', zIndex: 1 }}
            >
              <div style={{
                background: 'var(--card-bg)', border: `1px solid ${scorecard.status === 'flagged' ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
                borderRadius: 24, padding: '40px 48px', maxWidth: 640, width: '100%', boxShadow: 'var(--glass-shadow)',
                position: 'relative'
              }}>
                {/* Red warning border or purple top highlight */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '24px 24px 0 0',
                  background: scorecard.status === 'flagged' ? 'linear-gradient(90deg, #ef4444, #f43f5e)' : 'linear-gradient(90deg, #6366f1, #818cf8)'
                }} />

                {/* Scorecard Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ fontSize: 54, marginBottom: 12 }}>
                    {scorecard.status === 'flagged' ? '🚫' : '🏆'}
                  </div>
                  <h1 style={{
                    fontSize: 28, fontWeight: 950, margin: '0 0 6px', letterSpacing: '-0.02em',
                    color: scorecard.status === 'flagged' ? '#ef4444' : 'var(--text-heading)'
                  }}>
                    {scorecard.status === 'flagged' ? 'DISQUALIFIED / FLAGGED' : 'OA SESSION REPORT'}
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    {scorecard.company} Corporate OA Mock simulation finished
                  </p>
                </div>

                {/* Scores grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                  padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--card-border)', marginBottom: 28, textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: scorecard.status === 'flagged' ? '#ef4444' : '#818cf8' }}>
                      {scorecard.score}/100
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                      Overall Score
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--card-border)', borderRight: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-heading)' }}>
                      {scorecard.completed_steps}/2
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                      Challenges Solved
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: scorecard.total_warnings >= 4 ? '#ef4444' : '#f59e0b' }}>
                      {scorecard.total_warnings} warnings
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                      Integrity Log
                    </div>
                  </div>
                </div>

                {/* XP Earned Card */}
                {scorecard.xp_earned > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 12, background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)', marginBottom: 28,
                    color: '#10b981', fontSize: 13, fontWeight: 800
                  }}>
                    <Sparkles size={14} /> Congratulations! You earned +{scorecard.xp_earned} XP
                  </div>
                )}

                {/* Markdown Feedback Report */}
                <div style={{
                  maxHeight: 220, overflowY: 'auto', padding: '16px 20px', borderRadius: 14,
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  fontSize: 12.5, color: 'var(--text-color)', lineHeight: 1.6, marginBottom: 32,
                  textAlign: 'left'
                }} className="no-scrollbar">
                  <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                    🤖 Recruiters Assessment Evaluation
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {scorecard.feedback}
                  </div>
                </div>

                {/* Exit button */}
                <button
                  onClick={() => setScreen('lobby')}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none', outline: 'none',
                    background: 'var(--card-border)', color: 'var(--text-heading)',
                    fontSize: 13.5, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--card-border)'}
                >
                  <RefreshCw size={14} /> Return to OA Lobby
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      )}

      {/* ── EXAM: full-viewport fixed overlay ── */}
      {screen === 'exam' && (() => {
        const isCollapsed = localStorage.getItem('nexora_sidebar_collapsed') === 'true';
        const leftPadding = isCollapsed ? 88 : 236;
        return (
          <motion.div
            key="exam-fixed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              background: 'var(--bg-color)',
              display: 'flex', flexDirection: 'column',
              padding: `16px 24px 16px ${leftPadding}px`,
              boxSizing: 'border-box',
              overflow: 'hidden',
              transition: 'padding-left 0.35s ease'
            }}
          >
          {/* dot-grid background */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          {/* Top proctored HUD */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
            padding: '12px 24px', background: 'rgba(10, 10, 15, 0.9)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, flexShrink: 0, position: 'relative', zIndex: 1
          }}>
            {/* Left: Company */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={18} style={{ color: '#818cf8' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#e2e8f0' }}>
                  {activeSession?.company || 'Company'} Online Assessment
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Candidate Test Session</div>
              </div>
            </div>

            {/* Center: Timer */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px',
              borderRadius: 10,
              background: timeLeft < 120 ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.08)',
              border: `1.5px solid ${timeLeft < 120 ? '#ef4444' : 'rgba(99,102,241,0.25)'}`
            }}>
              <Clock size={14} style={{ color: timeLeft < 120 ? '#ef4444' : '#818cf8' }} />
              <span style={{ fontSize: 16, fontWeight: 900, color: timeLeft < 120 ? '#ef4444' : '#e2e8f0', fontFamily: 'monospace' }}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Right: Warnings + Finish */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-end' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                background: warnings >= 2 ? 'rgba(239,68,68,0.1)' : warnings >= 1 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${warnings >= 2 ? '#ef4444' : warnings >= 1 ? '#f59e0b' : 'var(--card-border)'}`,
                fontSize: 11.5, fontWeight: 800,
                color: warnings >= 2 ? '#f87171' : warnings >= 1 ? '#fbbf24' : 'var(--text-muted)'
              }}>
                <ShieldAlert size={12} style={{ color: warnings >= 2 ? '#f87171' : warnings >= 1 ? '#fbbf24' : 'var(--text-muted)' }} />
                <span>Warnings: {warnings}/2</span>
              </div>
              <button
                onClick={() => { isConfirmOpenRef.current = true; setShowFinishConfirm(true) }}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <LogOut size={13} /> Finish Exam
              </button>
            </div>
          </div>

          {/* Main workspace (Stacked Centered Layout) */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0,
            position: 'relative', zIndex: 1, marginTop: 10, width: '100%', maxWidth: 1100,
            margin: '10px auto 0', boxSizing: 'border-box'
          }}>

            {/* Top: Problem Description (Centered Full-Width) */}
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12,
              maxHeight: 240, flexShrink: 0, overflowY: 'auto', overflowX: 'hidden', wordBreak: 'break-word'
            }} className="no-scrollbar">

              {/* Step Selector Tab */}
              <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--card-border)', paddingBottom: 8, flexWrap: 'wrap' }}>
                {challenges.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChallengeIdx(idx)}
                    style={{
                      flex: 1, minWidth: 90, padding: '6px 12px', borderRadius: 6, border: 'none', outline: 'none',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      background: activeChallengeIdx === idx ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: activeChallengeIdx === idx ? '#818cf8' : 'var(--text-muted)',
                      borderBottom: activeChallengeIdx === idx ? '2px solid #6366f1' : 'none'
                    }}
                  >
                    Challenge {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Question details */}
              {challenges[activeChallengeIdx] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 800, background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>
                      {challenges[activeChallengeIdx].topic}
                    </span>
                    <span style={{
                      padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 800,
                      background: challenges[activeChallengeIdx].difficulty === 'hard' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                      color: challenges[activeChallengeIdx].difficulty === 'hard' ? '#ef4444' : '#f59e0b'
                    }}>
                      {challenges[activeChallengeIdx].difficulty.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-heading)', margin: 0, wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {challenges[activeChallengeIdx].title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {challenges[activeChallengeIdx].description}
                  </p>
                  <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.015)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {submissionResults[challenges[activeChallengeIdx].id] ? (
                      <>
                        {submissionResults[challenges[activeChallengeIdx].id].passed === submissionResults[challenges[activeChallengeIdx].id].total
                          ? <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                          : <XCircle size={15} style={{ color: '#f59e0b' }} />}
                        <div style={{ fontSize: 12, fontWeight: 700 }}>
                          Attempt Status: <span style={{ color: submissionResults[challenges[activeChallengeIdx].id].passed === submissionResults[challenges[activeChallengeIdx].id].total ? '#10b981' : '#f59e0b' }}>
                            {submissionResults[challenges[activeChallengeIdx].id].passed}/{submissionResults[challenges[activeChallengeIdx].id].total} Test Cases Passed
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={15} style={{ color: 'var(--text-muted)' }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>This challenge has not been submitted yet.</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Terminal / Editor Pane (Centered Full-Width) */}
            <div style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Editor control bar */}
              <div style={{
                padding: '10px 16px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid var(--card-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['python', 'javascript'].map(l => (
                    <button
                      key={l}
                      onClick={() => handleLanguageChange(l)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: selectedLanguage === l ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: selectedLanguage === l ? '#818cf8' : 'var(--text-muted)'
                      }}
                    >{l.toUpperCase()}</button>
                  ))}
                </div>
                <button
                  onClick={handleSubmitCode}
                  disabled={submittingIds[challenges[activeChallengeIdx]?.id]}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none', outline: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff',
                    fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {submittingIds[challenges[activeChallengeIdx]?.id]
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                    : <><Play size={13} /> Run & Submit OA</>}
                </button>
              </div>
              {/* Monaco Editor */}
              <div style={{ flex: 1, minHeight: 0 }}>
                {challenges[activeChallengeIdx] && (
                  <Editor
                    height="100%"
                    language={selectedLanguage}
                    theme="vs-dark"
                    value={userCodes[challenges[activeChallengeIdx].id] || ''}
                    onChange={(val) => handleCodeChange(challenges[activeChallengeIdx].id, val || '')}
                    options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Finishing overlay ── */}
          {isFinishing && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(5,5,10,0.92)', backdropFilter: 'blur(16px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
            }}>
              <Loader2 size={40} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#818cf8', fontWeight: 800, fontSize: 15, margin: 0 }}>Submitting assessment…</p>
            </div>
          )}

          {/* ── Inline Finish-Exam confirm modal ── */}
          {showFinishConfirm && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1050,
              background: 'rgba(5,5,10,0.82)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: 'var(--card-bg)', border: '1.5px solid rgba(239,68,68,0.5)',
                  borderRadius: 20, padding: '36px 40px', maxWidth: 440, width: '90%',
                  textAlign: 'center', boxShadow: '0 20px 50px rgba(239,68,68,0.15)'
                }}
              >
                <LogOut size={40} style={{ color: '#ef4444', marginBottom: 16 }} />
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 10px' }}>End Assessment?</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Are you sure you want to finish? Unsubmitted challenges will be marked incomplete.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => { isConfirmOpenRef.current = false; setShowFinishConfirm(false) }}
                    style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >Cancel</button>
                  <button
                    onClick={() => { isConfirmOpenRef.current = false; handleFinishAssessment(false) }}
                    style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.2)' }}
                  >Yes, End Exam</button>
                </div>
              </motion.div>
            </div>
          )}

          {/* ── Proctoring freeze overlay ── */}
          {isScreenFrozen && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: 'var(--card-bg)', border: `1.5px solid ${isDisqualified ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: 20, padding: '36px 40px', maxWidth: 480, width: '90%',
                  textAlign: 'center', boxShadow: `0 20px 50px ${isDisqualified ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}`
                }}
              >
                {isDisqualified ? (
                  <>
                    <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 18 }} />
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 12px' }}>Assessment Terminated</h2>
                    <p style={{ fontSize: 13.5, color: 'var(--text-color)', lineHeight: 1.6, margin: '0 0 24px' }}>
                      You have exceeded the maximum focus change limit of 2 warnings.
                      This assessment session is disqualified due to proctoring violations.
                    </p>
                    <button
                      onClick={() => handleFinishAssessment(true)}
                      style={{ padding: '12px 28px', borderRadius: 10, border: 'none', outline: 'none', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', color: '#fff', fontSize: 13.5, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.2)' }}
                    >Acknowledge & View Scorecard</button>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: 18 }} />
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 12px' }}>Proctoring Warning</h2>
                    <p style={{ fontSize: 13.5, color: 'var(--text-color)', lineHeight: 1.6, margin: '0 0 24px' }}>
                      You navigated away from the assessment page or switched tabs.
                      This violation has been logged to the proctoring server.
                      <br /><br />
                      <strong style={{ color: 'var(--text-heading)' }}>Warnings triggered: {warnings} / 2</strong>
                      <br />
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>A third focus loss will result in automatic disqualification.</span>
                    </p>
                    <button
                      onClick={async () => {
                        setIsScreenFrozen(false)
                        try {
                          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                            await document.documentElement.requestFullscreen()
                          }
                        } catch (e) {}
                      }}
                      style={{ padding: '12px 28px', borderRadius: 10, border: 'none', outline: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 13.5, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.2)' }}
                    >Acknowledge & Resume</button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
        );
      })()}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </PageWrapper>
  )
}
