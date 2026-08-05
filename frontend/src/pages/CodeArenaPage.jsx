import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Trophy, Gamepad2, Clock, Terminal,
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Sparkles, Flame, Copy, Check, Users, Play,
  Zap, Code2, Link2, LogOut, RefreshCw, Shield,
  Heart, Brain, Calculator, Cpu, ShieldAlert, AlertTriangle
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useAuth } from '@/context/AuthContext'
import PageWrapper from '@/components/layout/PageWrapper'
import Footer from '@/components/layout/Footer'
import Confetti from '@/components/ui/Confetti'
import api from '@/services/api'
import FundamentalsPage from '@/pages/FundamentalsPage'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const ARENA_TOUR_STEPS = [
  {
    target: 'arena-header',
    title: '🎮 Code Arena',
    description: 'Welcome to the live 1v1 multiplayer battle arena! Track your wins, losses, and win streaks right at the top.',
    color: '#ec4899',
    placement: 'bottom',
  },
  {
    target: 'arena-mode',
    title: '⚔️ Battle Modes',
    description: 'Choose between Coding Battle (LeetCode style unit testing), Aptitude Battle (speed logical puzzles), or CS Fundamentals (full CS MCQs).',
    color: '#6366f1',
    placement: 'bottom',
  },
  {
    target: 'arena-create',
    title: '🚀 Host a Battle',
    description: 'Select your preferred language (JavaScript/Python) and click "Create Room" to generate a room code and invite a friend.',
    color: '#8b5cf6',
    placement: 'right',
  },
  {
    target: 'arena-join',
    title: '🔑 Join a Room',
    description: 'Have a room code from a rival developer? Paste it here and hit "Join Arena" to enter their lobby instantly.',
    color: '#10b981',
    placement: 'left',
  },
]

// ── Constants ────────────────────────────────────────────────────────────────

const getWSBase = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '')
  }
  return 'ws://localhost:8000'
}
const WS_BASE = getWSBase()

const LANG_CONFIG = {
  javascript: { label: 'JavaScript', monaco: 'javascript', color: '#f0db4f', bg: 'rgba(240,219,79,0.08)' },
  python:     { label: 'Python',     monaco: 'python',     color: '#3572A5', bg: 'rgba(53,114,165,0.08)' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

// ── Pyodide loader (singleton) ────────────────────────────────────────────────

let pyodideInstance = null
let pyodideLoading = false
let pyodideCallbacks = []

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance
  if (pyodideLoading) {
    return new Promise((res) => pyodideCallbacks.push(res))
  }
  pyodideLoading = true
  const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs')
  pyodideInstance = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/' })
  pyodideCallbacks.forEach((cb) => cb(pyodideInstance))
  pyodideCallbacks = []
  return pyodideInstance
}

// ── Test runner ───────────────────────────────────────────────────────────────

async function runTests(code, language, tests) {
  if (language === 'javascript') {
    try {
      const fn = new Function(`${code}; return typeof solve !== 'undefined' ? solve : null;`)()
      if (!fn) return [{ index: 1, passed: false, error: 'No function named "solve" found.' }]
      return tests.map((t, i) => {
        try {
          const out = fn(...t.args)
          const passed = JSON.stringify(out) === JSON.stringify(t.expected)
          return { index: i+1, passed, actual: JSON.stringify(out), expected: JSON.stringify(t.expected), error: null }
        } catch (e) {
          return { index: i+1, passed: false, error: e.message, actual: null, expected: JSON.stringify(t.expected) }
        }
      })
    } catch (e) {
      return [{ index: 1, passed: false, error: `Syntax Error: ${e.message}` }]
    }
  }

  // Python via Pyodide
  const py = await getPyodide()
  const testDefs = JSON.stringify(tests)
  const runnerCode = `
import json, traceback

${code}

tests = json.loads("""${testDefs.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}""")
results = []
for i, t in enumerate(tests):
    try:
        out = solve(*t["args"])
        passed = out == t["expected"]
        results.append({"index": i+1, "passed": passed, "actual": str(out), "expected": str(t["expected"]), "error": None})
    except Exception as ex:
        results.append({"index": i+1, "passed": False, "error": traceback.format_exc(limit=2), "actual": None, "expected": str(t["expected"])})

json.dumps(results)
`
  try {
    const jsonOut = py.runPython(runnerCode)
    return JSON.parse(jsonOut)
  } catch (e) {
    return [{ index: 1, passed: false, error: `Runtime Error: ${e.message}` }]
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GlowBtn({ children, onClick, variant = 'primary', disabled, style = {}, ...rest }) {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 12, fontWeight: 800, fontSize: 14,
    transition: 'all 0.2s', outline: 'none', opacity: disabled ? 0.5 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }
  const variants = {
    primary:  { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'13px 28px', boxShadow:'0 8px 24px rgba(99,102,241,0.35)' },
    danger:   { background: 'linear-gradient(135deg,#ef4444,#f43f5e)', color:'#fff', padding:'13px 28px', boxShadow:'0 8px 24px rgba(239,68,68,0.35)' },
    ghost:    { background: 'var(--card-bg)', color:'var(--text-color)', border:'1px solid var(--card-border)', padding:'12px 24px' },
    success:  { background: 'linear-gradient(135deg,#10b981,#34d399)', color:'#fff', padding:'13px 28px', boxShadow:'0 8px 24px rgba(16,185,129,0.35)' },
  }
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.03, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

function StatBadge({ label, value, color = '#818cf8' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:20, fontWeight:900, color }}>{value}</span>
      <span style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
    </div>
  )
}

function PlayerSlot({ player, isYou, isFilled, currentUser }) {
  const displayName = isFilled
    ? (isYou
        ? (currentUser?.full_name || (currentUser?.email ? currentUser.email.split('@')[0] : null) || player?.name || 'You')
        : (player?.name || 'Opponent'))
    : 'Waiting...'

  return (
    <div style={{
      flex:1, padding:'20px 24px', borderRadius:16,
      background: isFilled ? 'var(--card-bg)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isFilled ? (isYou ? '#6366f1' : '#ef4444') : 'rgba(255,255,255,0.06)'}`,
      display:'flex', flexDirection:'column', alignItems:'center', gap:10,
      boxShadow: isFilled ? (isYou ? '0 0 20px rgba(99,102,241,0.12)' : '0 0 20px rgba(239,68,68,0.12)') : 'none',
      transition:'all 0.3s'
    }}>
      <div style={{
        width:52, height:52, borderRadius:'50%',
        background: isFilled
          ? (isYou ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#ef4444,#f43f5e)')
          : 'rgba(255,255,255,0.04)',
        border: `2px solid ${isFilled ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: isFilled ? 20 : 14,
      }}>
        {isFilled ? (isYou ? '👨‍💻' : '🤖') : (
          <motion.div animate={{ opacity:[0.3,1,0.3] }} transition={{ repeat:Infinity, duration:1.5 }}>
            <Users size={18} style={{ color:'rgba(255,255,255,0.2)' }} />
          </motion.div>
        )}
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontWeight:800, fontSize:14, color: isFilled ? 'var(--text-heading)' : 'rgba(255,255,255,0.15)' }}>
          {displayName}
        </div>
        <div style={{ fontSize:11, color: isFilled ? (isYou ? '#818cf8' : '#f87171') : 'transparent', fontWeight:600 }}>
          {isYou ? 'You' : 'Opponent'}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CodeArenaPage() {
  const { user, isAuthenticated } = useAuth()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('arena')

  // Game state machine
  const [screen, setScreen]       = useState('lobby')   // lobby | creating | waiting | joining | battle | result
  const [language, setLanguage]   = useState('javascript')
  const [joinCode, setJoinCode]   = useState('')
  const [joinError, setJoinError] = useState('')
  const [roomData, setRoomData]   = useState(null)       // { room_code, challenge, language }
  const [roomPlayers, setRoomPlayers] = useState({})     // { userId: { name, progress, tests_passed } }
  
  // Aptitude & Fundamentals Battle state
  const [lobbyMode, setLobbyMode] = useState('coding')   // coding | aptitude | fundamentals
  const [roomMode, setRoomMode]   = useState('coding')   // coding | aptitude | fundamentals
  const [questions, setQuestions] = useState([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [questionTimer, setQuestionTimer] = useState(30)
  const [selectedOption, setSelectedOption] = useState(null)
  const [correctOption, setCorrectOption] = useState(null)

  // Battle proctoring / blur state
  const [battleWarnings, setBattleWarnings] = useState(0)
  const [isBattleFrozen, setIsBattleFrozen] = useState(false)
  const [isBattleDisqualified, setIsBattleDisqualified] = useState(false)
  const battleStartTimestampRef = useRef(0)
  const isBattleTabAwayRef = useRef(false)

  // Battle
  const [userCode, setUserCode]     = useState('')
  const [timeLeft, setTimeLeft]     = useState(300)
  const [testResults, setTestResults] = useState([])
  const [isCompiling, setIsCompiling] = useState(false)
  const [pyLoading, setPyLoading]   = useState(false)
  const [allPassed, setAllPassed]   = useState(false)

  // Result
  const [outcome, setOutcome]       = useState(null)     // 'victory' | 'defeat'
  const [celebrate, setCelebrate]   = useState(false)
  const [showAbandonModal, setShowAbandonModal] = useState(false)

  // UI helpers
  const [copied, setCopied]         = useState(false)
  const [stats, setStats]           = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexora_arena_stats') || '{}') } catch { return {} }
  })

  // Refs
  const wsRef   = useRef(null)
  const timerRef = useRef(null)

  // Derived
  const challenge  = roomData?.challenge
  const roomCode   = roomData?.room_code
  const myId       = Object.keys(roomPlayers).find((id) => String(id) === String(user?.id)) || Object.keys(roomPlayers).find((id) => String(id).startsWith(`${user?.id}_`)) || Object.keys(roomPlayers)[0] || null
  const myPlayer   = myId ? roomPlayers[myId] : null
  const rivalEntry = Object.entries(roomPlayers).find(([id]) => id !== myId)
  const rival      = rivalEntry ? { id: rivalEntry[0], ...rivalEntry[1] } : null

  // ── Persist stats ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('nexora_arena_stats', JSON.stringify(stats))
  }, [stats])

  // Battle proctoring violation logger
  const triggerBattleViolation = useCallback(() => {
    setBattleWarnings((prev) => {
      const next = prev + 1
      if (next >= 3) {
        setIsBattleDisqualified(true)
      }
      setIsBattleFrozen(true)
      return next
    })
  }, [])

  const triggerBattleViolationRef = useRef(triggerBattleViolation)
  useEffect(() => {
    triggerBattleViolationRef.current = triggerBattleViolation
  }, [triggerBattleViolation])

  // Battle proctoring window blur / visibility event listeners
  useEffect(() => {
    if (screen !== 'battle') return

    battleStartTimestampRef.current = Date.now()
    setIsBattleFrozen(false)
    setIsBattleDisqualified(false)
    setBattleWarnings(0)

    // Request fullscreen when entering battle
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (e) {}

    const handleBlur = () => {
      if (Date.now() - battleStartTimestampRef.current < 200) return
      triggerBattleViolationRef.current?.()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (Date.now() - battleStartTimestampRef.current < 200) return
        triggerBattleViolationRef.current?.()
      }
    }

    const handleFullscreenChange = () => {
      if (Date.now() - battleStartTimestampRef.current < 200) return
      if (!document.fullscreenElement) {
        triggerBattleViolationRef.current?.()
      }
    }

    const handleKeyDown = (e) => {
      if (Date.now() - battleStartTimestampRef.current < 200) return
      if (
        e.key === 'Escape' ||
        e.key === 'Alt' ||
        e.key === 'Meta' ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'F11' ||
        (e.ctrlKey && (e.key === 't' || e.key === 'w' || e.key === 'n' || e.key === 'Tab'))
      ) {
        triggerBattleViolationRef.current?.()
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Are you sure you want to exit the battle? Leaving mid-battle will result in an automatic forfeit.'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [screen])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const modeParam = params.get('mode')
    if (modeParam === 'fundamentals') {
      setLobbyMode('fundamentals')
    }
    const joinParam = params.get('join')
    const token = localStorage.getItem('nexora_access')
    if (joinParam && token) {
      const code = joinParam.trim().toUpperCase()
      setJoinCode(code)
      
      const autoJoin = async () => {
        setScreen('joining')
        try {
          const res = await api.get(`/arena/rooms/${code}/`)
          setRoomData(res.data)
          setLanguage(res.data.language)
          setRoomMode(res.data.mode || 'coding')
          if (res.data.mode === 'aptitude') {
            setQuestions(res.data.questions || [])
          } else {
            setUserCode(res.data.challenge.default_code[res.data.language])
          }
          setScreen('waiting')
          connectWS(code)
        } catch (err) {
          const msg = err.response?.data?.error || 'Could not join room.'
          setJoinError(msg)
          setScreen('lobby')
        }
      }
      autoJoin()
    }
  }, [isAuthenticated])

  const handleWSMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'room_state': {
        const room = msg.room
        setRoomPlayers(room.players || {})
        setRoomMode(room.mode || 'coding')
        if (room.mode === 'aptitude') {
          setQuestions(room.questions || [])
          setCurrentQuestionIdx(room.current_question_index || 0)
          setQuestionTimer(room.question_timer || 30)
        }
        if (room.status === 'battle' && screen !== 'battle') {
          setScreen('battle')
          if (room.mode !== 'aptitude') {
            startTimer()
          }
        }
        break
      }
      case 'player_joined': {
        setRoomPlayers(msg.room.players || {})
        break
      }
      case 'battle_start': {
        setRoomPlayers(msg.room.players || {})
        setRoomMode(msg.room.mode || 'coding')
        if (msg.room.mode === 'aptitude') {
          setQuestions(msg.room.questions || [])
          setCurrentQuestionIdx(msg.room.current_question_index || 0)
          setQuestionTimer(msg.room.question_timer || 30)
        }
        setScreen('battle')
        if (msg.room.mode !== 'aptitude') {
          startTimer()
        }
        break
      }
      case 'timer_tick': {
        setQuestionTimer(msg.timer)
        break
      }
      case 'round_start': {
        setCurrentQuestionIdx(msg.question_index)
        setQuestionTimer(msg.room?.question_timer || 30)
        setSelectedOption(null)
        setCorrectOption(null)
        setRoomPlayers(msg.room?.players || {})
        break
      }
      case 'round_end': {
        setCorrectOption(msg.correct_option)
        setRoomPlayers(msg.room?.players || {})
        break
      }
      case 'player_answered': {
        setRoomPlayers((prev) => {
          const copy = { ...prev }
          if (copy[msg.player_id]) {
            copy[msg.player_id] = { ...copy[msg.player_id], answered_in_round: true }
          }
          return copy
        })
        break
      }
      case 'progress_update': {
        setRoomPlayers((prev) => {
          const copy = { ...prev }
          if (copy[msg.player_id]) {
            copy[msg.player_id] = { ...copy[msg.player_id], progress: msg.progress, tests_passed: msg.tests_passed }
          }
          return copy
        })
        break
      }
      case 'battle_finish': {
        clearInterval(timerRef.current)
        const won = msg.winner_id === myId
        setOutcome(won ? 'victory' : 'defeat')
        setScreen('result')
        if (won) {
          setCelebrate(true)
          setTimeout(() => setCelebrate(false), 6000)
          setStats((p) => ({ wins: (p.wins||0)+1, losses: p.losses||0, streak: (p.streak||0)+1 }))
        } else {
          setStats((p) => ({ wins: p.wins||0, losses: (p.losses||0)+1, streak: 0 }))
        }
        break
      }
      case 'player_left': {
        if (screen === 'battle') {
          clearInterval(timerRef.current)
          setOutcome('victory')
          setScreen('result')
          setCelebrate(true)
          setTimeout(() => setCelebrate(false), 6000)
          setStats((p) => ({ wins: (p.wins||0)+1, losses: p.losses||0, streak: (p.streak||0)+1 }))
        }
        break
      }
      case 'error': {
        setJoinError(msg.message || 'An error occurred.')
        setScreen('lobby')
        alert(msg.message || 'An error occurred.')
        break
      }
      default: break
    }
  }, [myId, screen, user])

  const handleWSMessageRef = useRef(null)
  useEffect(() => {
    handleWSMessageRef.current = handleWSMessage
  }, [handleWSMessage])

  // ── WebSocket management ─────────────────────────────────────────────────
  const connectWS = useCallback((code) => {
    if (wsRef.current) wsRef.current.close()

    // Pass JWT as query param (channels AuthMiddlewareStack reads it)
    const token = localStorage.getItem('nexora_access') || ''
    const ws = new WebSocket(`${WS_BASE}/ws/arena/${code}/?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (handleWSMessageRef.current) {
        handleWSMessageRef.current(msg)
      }
    }
    ws.onerror = () => console.error('[Arena WS] connection error')
    ws.onclose = (e) => {
      if (e.code === 4004) setJoinError('Room not found.')
      if (e.code === 4002) setJoinError('Room is full.')
      if (e.code === 4001) setJoinError('Please log in to play.')
    }
  }, [])

  const sendWS = (data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }

  // ── Timer ────────────────────────────────────────────────────────────────
  const startTimer = () => {
    clearInterval(timerRef.current)
    setTimeLeft(300)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setOutcome('defeat')
          setScreen('result')
          setStats((p) => ({ wins: p.wins||0, losses: (p.losses||0)+1, streak: 0 }))
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => () => { clearInterval(timerRef.current); wsRef.current?.close() }, [])

  // Pre-load Pyodide when language is Python
  useEffect(() => {
    if (language === 'python' && !pyodideInstance) {
      setPyLoading(true)
      getPyodide().finally(() => setPyLoading(false))
    }
  }, [language])

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      alert("Authentication required. Redirecting to login so you can enter the Code Arena.")
      window.location.href = "/login"
      return
    }
    setScreen('creating')
    try {
      const res = await api.post('/arena/rooms/', { language, mode: lobbyMode })
      setRoomData(res.data)
      setRoomMode(res.data.mode || 'coding')
      if (res.data.mode === 'aptitude') {
        setQuestions(res.data.questions || [])
      } else {
        setUserCode(res.data.challenge.default_code[language])
      }
      setScreen('waiting')
      connectWS(res.data.room_code)
    } catch (err) {
      alert("Failed to initialize battle room: " + (err.response?.data?.detail || err.response?.data?.error || err.message))
      setScreen('lobby')
    }
  }

  const handleJoinRoom = async () => {
    if (!isAuthenticated) {
      alert("Authentication required. Redirecting to login so you can join the Code Arena.")
      window.location.href = "/login"
      return
    }
    setJoinError('')
    const code = joinCode.trim().toUpperCase()
    if (!code) { setJoinError('Enter a room code.'); return }
    setScreen('joining')
    try {
      const res = await api.get(`/arena/rooms/${code}/`)
      setRoomData(res.data)
      setLanguage(res.data.language)
      setRoomMode(res.data.mode || 'coding')
      if (res.data.mode === 'aptitude') {
        setQuestions(res.data.questions || [])
      } else {
        setUserCode(res.data.challenge.default_code[res.data.language])
      }
      setScreen('waiting')
      connectWS(code)
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not join room. Double check the room code.'
      setJoinError(msg)
      alert("Failed to join room: " + msg)
      setScreen('lobby')
    }
  }

  const handleRunTests = async () => {
    if (!challenge || isCompiling) return
    setIsCompiling(true)
    const lang = roomData?.language || language
    try {
      const results = await runTests(userCode, lang, challenge.tests)
      setTestResults(results)
      const passed = results.every((r) => r.passed)
      const passedCount = results.filter((r) => r.passed).length
      const pct = Math.round((passedCount / results.length) * 100)

      // Broadcast progress
      sendWS({ type: 'progress_update', progress: pct, tests_passed: passedCount })

      if (passed && !allPassed) {
        setAllPassed(true)
        sendWS({ type: 'battle_finish' })
      }
    } finally {
      setIsCompiling(false)
    }
  }

  const handleLeave = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    } catch (e) {}
    wsRef.current?.close()
    clearInterval(timerRef.current)
    setScreen('lobby')
    setRoomData(null)
    setRoomPlayers({})
    setTestResults([])
    setAllPassed(false)
    setJoinCode('')
    setJoinError('')
    setSelectedOption(null)
    setCorrectOption(null)
    setCurrentQuestionIdx(0)
    setQuestions([])
    setIsBattleFrozen(false)
    setIsBattleDisqualified(false)
    setBattleWarnings(0)
    setShowAbandonModal(false)
  }

  const confirmLeaveBattle = () => {
    setShowAbandonModal(true)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Rival progress % ─────────────────────────────────────────────────────
  const rivalPct = rival ? (rival.progress || 0) : 0

  // ── Render ────────────────────────────────────────────────────────────────

  const isBattle = screen === 'battle'

  return (
    <PageWrapper noPadding>
      <div style={{
        height: isBattle ? 'calc(100vh - 64px)' : 'auto',
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        padding: isBattle ? '12px 20px' : '28px 36px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: isBattle ? 'hidden' : 'visible',
        position: 'relative'
      }} className="arena-page-wrapper">
        <Confetti active={celebrate} />

        {/* Futuristic Grid & Ambient Mesh Backdrop */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.25, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        {/* Cybernetic Split Neon Corners for Create (Blue) and Join (Red) */}
        {!isBattle && (
          <>
            <div style={{ position: 'absolute', top: -150, left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: -150, right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
          </>
        )}

        {/* ══════════════ LOBBY ══════════════ */}
        <AnimatePresence mode="wait">
        {(screen === 'lobby' || screen === 'creating' || screen === 'joining') && (
          <motion.div key="lobby"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', gap:24, position: 'relative', zIndex: 1 }}
          >
            {/* ── Hero Header ─────────────────────────────────── */}
            <div data-tour="arena-header" style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', gap:20 }}>
              <div style={{ flex:'1 1 340px' }}>
                {/* Live badge */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:14,
                  padding:'4px 12px', borderRadius:20,
                  background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981',
                    boxShadow:'0 0 8px #10b981', animation:'pulse 1.5s infinite' }} />
                  <span style={{ fontSize:11, fontWeight:800, color:'#10b981', letterSpacing:1.5 }}>LIVE ARENA</span>
                </div>

                <h1 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:950, color:'var(--text-heading)',
                  letterSpacing:'-0.03em', margin:0, lineHeight:1.05, marginBottom:12 }}>
                  Code Arena{' '}
                  <span style={{ background:'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)',
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>1v1</span>
                </h1>
                <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6, maxWidth:460, margin:0 }}>
                  Real-time player vs player coding battles. Create or join a room and fight.
                </p>
              </div>

              {/* Stats card */}
              <div style={{
                display:'flex', gap:0,
                background:'var(--card-bg)', border:'1px solid var(--card-border)',
                borderRadius:16, overflow:'hidden', boxShadow:'var(--glass-shadow)', flexShrink:0
              }}>
                {[
                  { label:'WINS',   value: stats.wins   || 0, color:'#10b981', bg:'rgba(16,185,129,0.04)'  },
                  { label:'LOSSES', value: stats.losses || 0, color:'#ef4444', bg:'rgba(239,68,68,0.04)'   },
                  { label:'STREAK', value:`${stats.streak||0}🔥`, color:'#f59e0b', bg:'rgba(245,158,11,0.04)' },
                ].map((s,i) => (
                  <div key={s.label} style={{
                    padding:'16px 24px', textAlign:'center', background: s.bg,
                    borderLeft: i > 0 ? '1px solid var(--card-border)' : 'none'
                  }}>
                    <div style={{ fontSize:22, fontWeight:900, color: s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1.5, marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mode selector ──────────────────────────── */}
            <div data-tour="arena-mode" style={{
              display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
              padding:'12px 16px', borderRadius:12,
              background:'var(--card-bg)', border:'1px solid var(--card-border)'
            }}>
              <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:700 }}>Arena Mode:</span>
              <div style={{ display:'flex', gap:6 }}>
                {[
                  { key: 'coding', label: 'Coding Battle', icon: Code2, desc: 'Write code to pass unit tests' },
                  { key: 'aptitude', label: 'Aptitude Battle', icon: Brain, desc: 'Speed-based logical & math puzzles' },
                  { key: 'fundamentals', label: 'CS Fundamentals', icon: Cpu, desc: 'Corporate OA Mock simulation cockpit' }
                ].map((m) => {
                  const Icon = m.icon
                  return (
                    <motion.button key={m.key}
                      whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      onClick={() => setLobbyMode(m.key)}
                      style={{
                        padding:'7px 18px', borderRadius:20, fontSize:12.5, fontWeight:700,
                        border: lobbyMode === m.key ? `1.5px solid #6366f1` : '1.5px solid var(--glass-border)',
                        background: lobbyMode === m.key ? 'rgba(99,102,241,0.08)' : 'transparent',
                        color: lobbyMode === m.key ? '#818cf8' : 'var(--text-muted)',
                        cursor:'pointer', outline:'none', transition:'all 0.2s',
                        display:'flex', alignItems:'center', gap:6
                      }}
                    >
                      <Icon size={12} /> {m.label}
                    </motion.button>
                  )
                })}
              </div>
              <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto', fontStyle:'italic' }}>
                {lobbyMode === 'coding' ? 'Write solve() to pass challenges.' : lobbyMode === 'aptitude' ? 'Tackle 5 fast-paced logical rounds.' : 'Simulate corporate mock Online Assessments.'}
              </span>
            </div>

            {/* ── Language + tip strip ──────────────────────────── */}
            {lobbyMode !== 'fundamentals' && (
              <div style={{
                display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
                padding:'12px 16px', borderRadius:12,
                background:'var(--card-bg)', border:'1px solid var(--card-border)',
                opacity: lobbyMode === 'aptitude' ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}>
                {lobbyMode === 'aptitude' ? (
                  <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, fontStyle:'italic' }}>
                    Battle language is not used in Aptitude Battles (multiple choice option pads).
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:700 }}>Battle Language:</span>
                    <div style={{ display:'flex', gap:6 }}>
                      {Object.entries(LANG_CONFIG).map(([key, cfg]) => (
                        <motion.button key={key}
                          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                          onClick={() => setLanguage(key)}
                          style={{
                            padding:'7px 18px', borderRadius:20, fontSize:12.5, fontWeight:700,
                            border: language === key ? `1.5px solid ${cfg.color}` : '1.5px solid var(--glass-border)',
                            background: language === key ? cfg.bg : 'transparent',
                            color: language === key ? cfg.color : 'var(--text-muted)',
                            cursor:'pointer', outline:'none', transition:'all 0.2s',
                            display:'flex', alignItems:'center', gap:6
                          }}
                        >
                          <Code2 size={11} /> {cfg.label}
                        </motion.button>
                      ))}
                    </div>
                    {language === 'python' && !pyodideInstance && (
                      <span style={{ fontSize:11, color:'#818cf8', display:'flex', alignItems:'center', gap:4, marginLeft:'auto' }}>
                        <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }} /> Pre-loading Python runtime…
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Action Cards or Fundamentals Mode ──────────────────────────────────── */}
            {lobbyMode === 'fundamentals' ? (
              <div style={{ flex: 1, minHeight: 0 }}>
                <FundamentalsPage />
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20, flex:1, minHeight:0 }}>

                {/* CREATE ROOM */}
                <motion.div
                  whileHover={{ y:-6, boxShadow:'0 28px 64px rgba(99,102,241,0.22)' }}
                  style={{
                    background:'var(--card-bg)',
                    border:'1px solid rgba(99,102,241,0.2)',
                    borderTop:'3px solid #6366f1',
                    borderRadius:20, padding:'36px 32px', display:'flex', flexDirection:'column',
                    alignItems:'center', textAlign:'center',
                    position:'relative', overflow:'hidden', cursor:'default',
                    boxShadow:'var(--glass-shadow)', transition:'box-shadow 0.3s ease, transform 0.3s ease'
                  }}
                >
                  <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 65%)', pointerEvents:'none' }} />
                  <div style={{ position:'absolute', top:12, left:16, fontFamily:'monospace', fontSize:9, color:'rgba(99,102,241,0.5)', letterSpacing:1 }}>[SECURE_COCKPIT_A]</div>

                  <motion.div
                    animate={{ boxShadow:['0 0 20px rgba(99,102,241,0.15)','0 0 36px rgba(99,102,241,0.3)','0 0 20px rgba(99,102,241,0.15)'] }}
                    transition={{ repeat:Infinity, duration:2.5, ease:'easeInOut' }}
                    style={{
                      width:76, height:76, borderRadius:22, marginBottom:22,
                      background:'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))',
                      border:'1px solid rgba(99,102,241,0.35)', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                    <Shield size={32} style={{ color:'#818cf8' }} />
                  </motion.div>

                  <h3 style={{ fontSize:22, fontWeight:950, color:'var(--text-heading)', margin:'0 0 10px', letterSpacing:'-0.02em' }}>
                    Create Room
                  </h3>
                  <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.65, marginBottom:28, maxWidth:280 }}>
                    Initialize a private sandbox cockpit. Share the invite link to challenge any developer.
                  </p>

                  <div style={{ marginBottom:20, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                    {['Private Room','Instant Start','Invite Link'].map(f => (
                      <span key={f} style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:600,
                        background:'rgba(99,102,241,0.08)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.15)' }}>
                        {f}
                      </span>
                    ))}
                  </div>

                  <GlowBtn
                    onClick={handleCreateRoom}
                    disabled={screen === 'creating'}
                    style={{ width:'100%', justifyContent:'center', padding:'14px' }}
                  >
                    {!isAuthenticated
                      ? 'Login to Create Room'
                      : screen === 'creating'
                      ? <><Loader2 size={16} style={{ animation:'spin 0.8s linear infinite' }} /> Initializing…</>
                      : <><Sparkles size={16} /> Create Battle Room</>
                    }
                  </GlowBtn>
                </motion.div>

                {/* JOIN ROOM */}
                <motion.div
                  whileHover={{ y:-6, boxShadow:'0 28px 64px rgba(239,68,68,0.18)' }}
                  style={{
                    background:'var(--card-bg)',
                    border:'1px solid rgba(239,68,68,0.18)',
                    borderTop:'3px solid #ef4444',
                    borderRadius:20, padding:'36px 32px', display:'flex', flexDirection:'column',
                    alignItems:'center', textAlign:'center',
                    position:'relative', overflow:'hidden', cursor:'default',
                    boxShadow:'var(--glass-shadow)', transition:'box-shadow 0.3s ease, transform 0.3s ease'
                  }}
                >
                  <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 65%)', pointerEvents:'none' }} />
                  <div style={{ position:'absolute', top:12, right:16, fontFamily:'monospace', fontSize:9, color:'rgba(239,68,68,0.45)', letterSpacing:1 }}>[SECTOR_WAR_DECK]</div>

                  <motion.div
                    animate={{ boxShadow:['0 0 20px rgba(239,68,68,0.12)','0 0 36px rgba(239,68,68,0.26)','0 0 20px rgba(239,68,68,0.12)'] }}
                    transition={{ repeat:Infinity, duration:2.5, ease:'easeInOut' }}
                    style={{
                      width:76, height:76, borderRadius:22, marginBottom:22,
                      background:'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(244,63,94,0.18))',
                      border:'1px solid rgba(239,68,68,0.35)', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                    <Swords size={32} style={{ color:'#f87171' }} />
                  </motion.div>

                  <h3 style={{ fontSize:22, fontWeight:950, color:'var(--text-heading)', margin:'0 0 10px', letterSpacing:'-0.02em' }}>
                    Join Room
                  </h3>
                  <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.65, marginBottom:20, maxWidth:280 }}>
                    Enter the room code shared by your opponent and jump straight into battle.
                  </p>

                  <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
                    <input
                      value={joinCode}
                      onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                      placeholder="NEXO-XXXX"
                      style={{
                        width:'100%', boxSizing:'border-box', padding:'14px 18px',
                        borderRadius:12, fontSize:16, fontWeight:900, letterSpacing:4,
                        textAlign:'center', background:'rgba(239,68,68,0.04)',
                        border:`1.5px solid ${joinError ? '#ef4444' : 'rgba(239,68,68,0.25)'}`,
                        color:'var(--text-heading)', outline:'none',
                        fontFamily:'monospace', transition:'all 0.3s ease',
                        cursor:'text'
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#ef4444'
                        e.currentTarget.style.boxShadow = '0 0 18px rgba(239,68,68,0.18)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = joinError ? '#ef4444' : 'rgba(239,68,68,0.25)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                    {joinError && (
                      <span style={{ fontSize:12, color:'#ef4444', display:'flex', alignItems:'center', gap:4, justifyContent:'center', fontWeight:600 }}>
                        <AlertCircle size={12} /> {joinError}
                      </span>
                    )}
                    <GlowBtn
                      onClick={handleJoinRoom}
                      disabled={screen === 'joining'}
                      variant="danger"
                      style={{ width:'100%', justifyContent:'center', padding:'14px' }}
                    >
                      {!isAuthenticated
                        ? 'Login to Join Room'
                        : screen === 'joining'
                        ? <><Loader2 size={16} style={{ animation:'spin 0.8s linear infinite' }} /> Connecting…</>
                        : <><Zap size={16} /> Join & Fight</>
                      }
                    </GlowBtn>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ WAITING ROOM ══════════════ */}
        {screen === 'waiting' && (
          <motion.div key="waiting"
            initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, position: 'relative', zIndex: 1 }}
          >
            {/* Radar animation */}
            <div style={{ position:'relative', width:140, height:140, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {[1, 1.3, 1.6].map((scale, i) => (
                <motion.div key={i}
                  animate={{ scale:[1, scale, 1], opacity:[0.4, 0, 0.4] }}
                  transition={{ repeat:Infinity, duration:2+i*0.5, delay:i*0.4, ease:'easeInOut' }}
                  style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1.5px solid rgba(99,102,241,0.25)' }}
                />
              ))}
              <motion.div
                animate={{ rotate:360 }}
                transition={{ repeat:Infinity, duration:4, ease:'linear' }}
                style={{
                  position:'absolute', inset:0, borderRadius:'50%',
                  background:'conic-gradient(from 0deg, rgba(99,102,241,0.2), transparent 35%)'
                }}
              />
              <div style={{
                width:70, height:70, borderRadius:'50%', zIndex:1,
                background:'var(--card-bg)', border:'1px solid rgba(99,102,241,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 30px rgba(99,102,241,0.15)'
              }}>
                <Gamepad2 size={24} style={{ color:'#818cf8' }} />
              </div>
            </div>

            <div style={{ textAlign:'center' }}>
              <h2 style={{ fontSize:22, fontWeight:900, color:'var(--text-heading)', margin:'0 0 4px', letterSpacing:'-0.02em' }}>
                Waiting for Opponent
              </h2>
              <p style={{ fontSize:13, color:'var(--text-muted)', margin:0 }}>
                Share the room code below. Battle starts automatically when they join.
              </p>
            </div>

            {/* Room code display */}
            <div style={{
              background:'var(--card-bg)', border:'1px solid rgba(99,102,241,0.3)',
              borderRadius:20, padding:'20px 32px', textAlign:'center',
              boxShadow:'0 10px 40px rgba(99,102,241,0.12)',
            }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>
                Room Code
              </div>
              <div style={{
                fontSize:'clamp(24px,4vw,38px)', fontWeight:900, letterSpacing:8,
                fontFamily:'monospace', background:'linear-gradient(90deg,#6366f1,#a855f7)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                marginBottom:16,
              }}>
                {roomCode}
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <GlowBtn onClick={copyCode} variant="ghost" style={{ fontSize:12, padding:'8px 16px' }}>
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
                </GlowBtn>
              </div>
            </div>

            {/* Player slots */}
            <div style={{ display:'flex', gap:16, width:'100%', maxWidth:520 }}>
              {Object.entries(roomPlayers).map(([id, p]) => (
                <PlayerSlot key={id} player={p} isYou={id === myId} isFilled={true} currentUser={user} />
              ))}
              {Object.keys(roomPlayers).length < 2 && (
                <PlayerSlot player={null} isYou={false} isFilled={false} currentUser={user} />
              )}
            </div>

            <GlowBtn onClick={handleLeave} variant="ghost" style={{ fontSize:12, padding:'8px 16px' }}>
              <LogOut size={13} /> Cancel
            </GlowBtn>
          </motion.div>
        )}

        {/* ══════════════ BATTLE ROOM ══════════════ */}
        {screen === 'battle' && (
          <motion.div key="battle"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{
              flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'14px 20px', gap:12, position: 'relative', zIndex: 1,
              filter: isBattleFrozen ? 'blur(16px)' : 'none',
              pointerEvents: isBattleFrozen ? 'none' : 'auto',
              userSelect: isBattleFrozen ? 'none' : 'auto',
              transition: 'filter 0.2s ease, opacity 0.2s ease'
            }}
          >
            {roomMode === 'aptitude' ? (
              <>
                {/* Aptitude HUD */}
                <div style={{
                  display:'grid', gridTemplateColumns:'1fr auto 1fr',
                  alignItems:'center', padding:'12px 24px',
                  background:'rgba(10, 10, 15, 0.85)', border:'1px solid rgba(99, 102, 241, 0.35)',
                  borderRadius:16, boxShadow:'0 10px 40px rgba(99,102,241,0.15)', flexShrink:0,
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, #6366f1, #ef4444)' }} />
                  
                  {/* You */}
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border: '1px solid rgba(99,102,241,0.5)' }}>👨‍💻</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:900, color:'#ffffff', letterSpacing: '-0.01em' }}>{myPlayer?.name || user?.full_name || 'You'}</div>
                      <div style={{ fontSize:11, color:'#818cf8', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                        <Trophy size={11} style={{ color:'#818cf8' }} /> SCORE: {myPlayer?.score ?? myPlayer?.health ?? 0}/100
                      </div>
                    </div>
                  </div>

                  {/* Center: Timer + VS */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:8, padding:'8px 24px',
                      background: questionTimer < 10 ? 'rgba(239,68,68,0.16)' : 'rgba(99,102,241,0.12)',
                      border: `1.5px solid ${questionTimer < 10 ? '#ef4444' : 'rgba(99,102,241,0.4)'}`,
                      borderRadius:12,
                      boxShadow: questionTimer < 10 ? '0 0 15px rgba(239,68,68,0.25)' : 'none'
                    }}>
                      <Clock size={14} className={questionTimer < 10 ? 'pulsing' : ''} style={{ color: questionTimer < 10 ? '#ef4444' : '#818cf8' }} />
                      <span style={{ fontSize:18, fontWeight:950, color: questionTimer < 10 ? '#ef4444' : '#fff', fontFamily:'monospace', letterSpacing:1.5 }}>
                        {fmt(questionTimer)}
                      </span>
                    </div>
                    <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:800, letterSpacing:2, paddingLeft: 2 }}>ROUND {currentQuestionIdx + 1}/5</span>
                  </div>

                  {/* Rival */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'flex-end' }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:14, fontWeight:900, color:'#f87171', letterSpacing: '-0.01em' }}>{rival?.name || 'Opponent'}</div>
                      <div style={{ fontSize:11, color:'#f87171', fontWeight:700, display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                        <Trophy size={11} style={{ color:'#f87171' }} /> SCORE: {rival?.score ?? rival?.health ?? 0}/100
                      </div>
                    </div>
                    <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#ef4444,#f43f5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border: '1px solid rgba(239,68,68,0.5)' }}>🥷</div>
                  </div>
                </div>

                {/* Workspace split */}
                <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 340px', gap:16, minHeight:0, overflow:'hidden' }} className="arena-battle-grid">
                  
                  {/* Left: Question Box and Option Pads */}
                  <div style={{ display:'flex', flexDirection:'column', gap:16, minHeight:0, overflowY:'auto' }} className="no-scrollbar">
                    
                    {/* Question Header & Content */}
                    {questions[currentQuestionIdx] && (
                      <div style={{
                        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                        borderRadius: 16, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14,
                        boxShadow: 'var(--glass-shadow)', position: 'relative'
                      }}>
                        {/* Category & difficulty badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                              background: 'rgba(99,102,241,0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4
                            }}>
                              {questions[currentQuestionIdx].type === 'math' ? <Calculator size={11} /> : questions[currentQuestionIdx].type === 'logic' ? <Brain size={11} /> : '💬'}{' '}
                              {questions[currentQuestionIdx].type === 'math' ? 'Math' : questions[currentQuestionIdx].type === 'logic' ? 'Logic' : 'Verbal'}
                            </span>
                            <span style={{
                              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                              background: questions[currentQuestionIdx].difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : questions[currentQuestionIdx].difficulty === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)',
                              color: questions[currentQuestionIdx].difficulty === 'hard' ? '#ef4444' : questions[currentQuestionIdx].difficulty === 'medium' ? '#f59e0b' : '#10b981',
                            }}>
                              {questions[currentQuestionIdx].difficulty.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                            Round {currentQuestionIdx + 1} of 5
                          </span>
                        </div>

                        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>
                          {questions[currentQuestionIdx].question}
                        </h2>
                      </div>
                    )}

                    {/* Options Grid */}
                    {questions[currentQuestionIdx] && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        {questions[currentQuestionIdx].options.map((option, idx) => {
                          const isSelected = selectedOption === idx;
                          const isCorrect = correctOption === idx;
                          const isWrongSelected = isSelected && correctOption !== null && correctOption !== idx;
                          
                          let border = '1px solid var(--card-border)';
                          let background = 'var(--card-bg)';
                          let color = 'var(--text-color)';
                          let shadow = 'var(--glass-shadow)';

                          if (correctOption !== null) {
                            if (isCorrect) {
                              border = '2px solid #10b981';
                              background = 'rgba(16,185,129,0.1)';
                              color = '#10b981';
                              shadow = '0 0 15px rgba(16,185,129,0.2)';
                            } else if (isWrongSelected) {
                              border = '2px solid #ef4444';
                              background = 'rgba(239,68,68,0.1)';
                              color = '#ef4444';
                              shadow = '0 0 15px rgba(239,68,68,0.2)';
                            } else {
                              background = 'rgba(255,255,255,0.01)';
                              border = '1px solid rgba(255,255,255,0.03)';
                              color = 'rgba(255,255,255,0.2)';
                            }
                          } else if (isSelected) {
                            border = '2px solid #6366f1';
                            background = 'rgba(99,102,241,0.08)';
                            color = '#818cf8';
                            shadow = '0 0 15px rgba(99,102,241,0.15)';
                          }

                          return (
                            <motion.button
                              key={idx}
                              disabled={selectedOption !== null || correctOption !== null}
                              whileHover={selectedOption === null && correctOption === null ? { scale: 1.02, y: -2, border: '1px solid #6366f1' } : {}}
                              whileTap={selectedOption === null && correctOption === null ? { scale: 0.98 } : {}}
                              onClick={() => {
                                setSelectedOption(idx);
                                sendWS({ type: 'submit_answer', answer: idx });
                              }}
                              style={{
                                padding: '20px 24px', borderRadius: 14, textAlign: 'left',
                                fontSize: 14, fontWeight: 700, cursor: (selectedOption !== null || correctOption !== null) ? 'not-allowed' : 'pointer',
                                border, background, color, boxShadow: shadow,
                                transition: 'border 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s',
                                display: 'flex', alignItems: 'center', gap: 12
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: isSelected ? '#6366f1' : isCorrect ? '#10b981' : isWrongSelected ? '#ef4444' : 'rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isSelected || isCorrect || isWrongSelected ? '#fff' : 'var(--text-muted)',
                                fontSize: 12, fontWeight: 900
                              }}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span style={{ flex: 1 }}>{option}</span>
                              {correctOption !== null && isCorrect && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
                              {correctOption !== null && isWrongSelected && <XCircle size={16} style={{ color: '#ef4444' }} />}
                              {selectedOption === idx && correctOption === null && (
                                <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Locked In
                                </span>
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    )}

                    {/* 30s Speed progress bar */}
                    {correctOption === null && (
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '12px 18px', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>
                          <span>⏰ TIME REMAINING</span>
                          <span style={{ color: questionTimer < 10 ? '#ef4444' : '#fff' }}>{questionTimer} seconds</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <motion.div
                            animate={{ width: `${(questionTimer / 30) * 100}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                            style={{
                              height: '100%',
                              background: questionTimer < 10 ? 'linear-gradient(90deg, #ef4444, #f43f5e)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                              borderRadius: 3
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Feedback transition banner */}
                    {correctOption !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: selectedOption === correctOption ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                          border: `1px solid ${selectedOption === correctOption ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                          padding: '16px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
                          justifyContent: 'center', fontSize: 13, fontWeight: 800,
                          color: selectedOption === correctOption ? '#10b981' : '#ef4444'
                        }}
                      >
                        {selectedOption === correctOption ? (
                          <>🎉 Correct! You dealt 20 damage to the opponent!</>
                        ) : selectedOption === null ? (
                          <>⏰ Timeout! You took 10 damage!</>
                        ) : (
                          <>❌ Incorrect! You took 20 damage!</>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Right: Health & Game progress display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* You Health and Score */}
                    <div style={{
                      background: 'var(--card-bg)', border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
                      boxShadow: 'var(--glass-shadow)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>👨‍💻 YOUR COCKPIT</span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#818cf8' }}>{myPlayer?.score ?? 0} PTS</span>
                      </div>
                      
                      {/* HP Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>HP HEALTH</span>
                          <span style={{ fontSize: 11, fontWeight: 900, color: (myPlayer?.health ?? 100) < 40 ? '#ef4444' : '#10b981' }}>
                            {myPlayer?.health ?? 100}/100
                          </span>
                        </div>
                        <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <motion.div
                            animate={{ width: `${myPlayer?.health ?? 100}%` }}
                            transition={{ duration: 0.4 }}
                            style={{
                              height: '100%',
                              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                              borderRadius: 5
                            }}
                          />
                        </div>
                      </div>

                      {/* Answer status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: myPlayer?.answered_in_round ? '#10b981' : '#f59e0b',
                          boxShadow: myPlayer?.answered_in_round ? '0 0 6px #10b981' : 'none'
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                          {myPlayer?.answered_in_round ? 'Locked In' : 'Thinking...'}
                        </span>
                      </div>
                    </div>

                    {/* Rival Health and Score */}
                    {rival && (
                      <div style={{
                        background: 'var(--card-bg)', border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
                        boxShadow: 'var(--glass-shadow)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>🥷 RIVAL COCKPIT</span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: '#f87171' }}>{rival.score ?? 0} PTS</span>
                        </div>

                        {/* HP Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>HP HEALTH</span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: (rival.health ?? 100) < 40 ? '#ef4444' : '#10b981' }}>
                              {rival.health ?? 100}/100
                            </span>
                          </div>
                          <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <motion.div
                              animate={{ width: `${rival.health ?? 100}%` }}
                              transition={{ duration: 0.4 }}
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #ef4444, #f43f5e)',
                                borderRadius: 5
                              }}
                            />
                          </div>
                        </div>

                        {/* Answer status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: rival.answered_in_round ? '#10b981' : '#f59e0b',
                            boxShadow: rival.answered_in_round ? '0 0 6px #10b981' : 'none'
                          }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                            {rival.answered_in_round ? 'Locked In' : 'Thinking...'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Abandon button */}
                    <GlowBtn onClick={confirmLeaveBattle} variant="ghost" style={{ fontSize: 11, padding: '9px 14px', marginTop: 'auto' }}>
                      <LogOut size={13} /> Abandon Battle
                    </GlowBtn>
                  </div>
                </div>
              </>
            ) : (
              challenge && (
                <>
                  {/* Top HUD bar */}
                  <div style={{
                    display:'grid', gridTemplateColumns:'1fr auto 1fr',
                    alignItems:'center', padding:'12px 24px',
                    background:'rgba(10, 10, 15, 0.85)', border:'1px solid rgba(99, 102, 241, 0.35)',
                    borderRadius:16, boxShadow:'0 10px 40px rgba(99,102,241,0.15)', flexShrink:0,
                    position: 'relative'
                  }}>
                    {/* Glowing divider line */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, #6366f1, #ef4444)' }} />
                    
                    {/* You */}
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border: '1px solid rgba(99,102,241,0.5)' }}>👨‍💻</div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:900, color:'#ffffff', letterSpacing: '-0.01em' }}>{myPlayer?.name || user?.full_name || 'You'}</div>
                        <div style={{ fontSize:11, color:'#a5b4fc', fontWeight:700 }}>
                          {myPlayer?.tests_passed || 0}/{challenge.tests.length} tests passed
                        </div>
                      </div>
                    </div>

                    {/* Center: Timer + VS */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{
                        display:'flex', alignItems:'center', gap:8, padding:'8px 24px',
                        background: timeLeft < 60 ? 'rgba(239,68,68,0.16)' : 'rgba(99,102,241,0.12)',
                        border: `1.5px solid ${timeLeft < 60 ? '#ef4444' : 'rgba(99,102,241,0.4)'}`,
                        borderRadius:12,
                        boxShadow: timeLeft < 60 ? '0 0 15px rgba(239,68,68,0.25)' : 'none'
                      }}>
                        <Clock size={14} className={timeLeft < 60 ? 'pulsing' : ''} style={{ color: timeLeft < 60 ? '#ef4444' : '#818cf8' }} />
                        <span style={{ fontSize:18, fontWeight:950, color: timeLeft < 60 ? '#ef4444' : '#fff', fontFamily:'monospace', letterSpacing:1.5 }}>
                          {fmt(timeLeft)}
                        </span>
                      </div>
                      <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:800, letterSpacing:4, paddingLeft: 4 }}>VS</span>
                    </div>

                    {/* Rival */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'flex-end' }}>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:14, fontWeight:900, color:'#f87171', letterSpacing: '-0.01em' }}>{rival?.name || 'Opponent'}</div>
                        <div style={{ fontSize:11, color:'#f87171', fontWeight:700 }}>
                          {rival?.tests_passed || 0}/{challenge.tests.length} tests passed
                        </div>
                      </div>
                      <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#ef4444,#f43f5e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border: '1px solid rgba(239,68,68,0.5)' }}>🥷</div>
                    </div>
                  </div>

                  {/* Workspace split */}
                  <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 320px', gap:12, minHeight:0, overflow:'hidden' }}>

                    {/* Left: Problem + Editor */}
                    <div style={{ display:'flex', flexDirection:'column', gap:12, minHeight:0, overflow:'hidden' }}>
                      {/* Problem statement */}
                      <div style={{
                        background:'var(--card-bg)', border:'1px solid var(--card-border)',
                        borderRadius:14, padding:'16px 20px', flexShrink:0,
                        boxShadow:'var(--glass-shadow)'
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ padding:'2px 8px', borderRadius:6, background:'rgba(99,102,241,0.1)', color:'#818cf8', fontSize:10, fontWeight:700 }}>
                              {challenge.topic}
                            </span>
                            <span style={{ padding:'2px 8px', borderRadius:6, background:'rgba(251,191,36,0.1)', color:'#fbbf24', fontSize:10, fontWeight:700 }}>
                              +{challenge.xp} XP
                            </span>
                            <span style={{
                              padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700,
                              background: challenge.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : challenge.difficulty === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)',
                              color:       challenge.difficulty === 'hard' ? '#ef4444'             : challenge.difficulty === 'medium' ? '#f59e0b'            : '#10b981',
                            }}>
                              {challenge.difficulty}
                            </span>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
                            <Code2 size={11} style={{ color: LANG_CONFIG[roomData?.language || language]?.color }} />
                            {LANG_CONFIG[roomData?.language || language]?.label}
                          </span>
                        </div>
                        <h3 style={{ fontSize:15, fontWeight:900, color:'var(--text-heading)', margin:'0 0 8px' }}>{challenge.title}</h3>
                        <p style={{ fontSize:12, color:'var(--text-color)', margin:'0 0 10px', whiteSpace:'pre-line', lineHeight:1.5 }}>
                          {challenge.description}
                        </p>
                        {challenge.examples?.length > 0 && (
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            {challenge.examples.slice(0,2).map((ex, i) => (
                              <div key={i} style={{ fontSize:11, fontFamily:'monospace', background:'rgba(255,255,255,0.03)', borderRadius:6, padding:'5px 10px', color:'var(--text-muted)' }}>
                                <span style={{ color:'#818cf8' }}>In: </span>{ex.input}
                                <span style={{ color:'#10b981', marginLeft:12 }}>Out: </span>{ex.output}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Editor */}
                      <div style={{
                        flex:1, background:'var(--card-bg)', border:'1px solid var(--card-border)',
                        borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0
                      }}>
                        <div style={{
                          padding:'8px 16px', background:'rgba(0,0,0,0.25)', borderBottom:'1px solid var(--card-border)',
                          display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0
                        }}>
                          <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)' }}>
                            {LANG_CONFIG[roomData?.language || language]?.label} Editor
                          </span>
                          <GlowBtn
                            onClick={handleRunTests}
                            disabled={isCompiling || allPassed}
                            style={{ padding:'6px 16px', fontSize:12, borderRadius:8 }}
                          >
                            {isCompiling
                              ? <><Loader2 size={13} style={{ animation:'spin 0.8s linear infinite' }} /> Running...</>
                              : allPassed
                              ? <><CheckCircle2 size={13} /> All Passed!</>
                              : <><Play size={13} /> Run & Submit</>
                            }
                          </GlowBtn>
                        </div>
                        <div style={{ flex:1, minHeight:0 }}>
                          <Editor
                            height="100%"
                            language={LANG_CONFIG[roomData?.language || language]?.monaco}
                            theme="vs-dark"
                            value={userCode}
                            onChange={(v) => setUserCode(v || '')}
                            options={{ fontSize:13, minimap:{ enabled:false }, scrollBeyondLastLine:false, automaticLayout:true }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Rival HUD + test results */}
                    <div style={{ display:'flex', flexDirection:'column', gap:12, minHeight:0, overflow:'hidden' }}>

                      {/* Rival progress card */}
                      <div style={{
                        background:'var(--card-bg)', border:'1px solid rgba(239,68,68,0.2)',
                        borderRadius:14, padding:18, boxShadow:'var(--glass-shadow)', flexShrink:0
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>
                            🥷 Rival Progress
                          </span>
                          <span style={{ fontSize:12, fontWeight:800, color:'#f87171' }}>{rivalPct}%</span>
                        </div>
                        <div style={{ height:8, borderRadius:4, background:'rgba(239,68,68,0.1)', overflow:'hidden', marginBottom:14 }}>
                          <motion.div
                            animate={{ width:`${rivalPct}%` }}
                            transition={{ duration:0.5 }}
                            style={{ height:'100%', background:'linear-gradient(90deg,#ef4444,#f87171)', borderRadius:4 }}
                          />
                        </div>

                        {/* Your progress */}
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>
                            👨‍💻 Your Progress
                          </span>
                          <span style={{ fontSize:12, fontWeight:800, color:'#818cf8' }}>
                            {myPlayer?.progress || 0}%
                          </span>
                        </div>
                        <div style={{ height:8, borderRadius:4, background:'rgba(99,102,241,0.1)', overflow:'hidden' }}>
                          <motion.div
                            animate={{ width:`${myPlayer?.progress || 0}%` }}
                            transition={{ duration:0.5 }}
                            style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius:4 }}
                          />
                        </div>
                      </div>

                      {/* Test results */}
                      <div style={{
                        flex:1, background:'var(--card-bg)', border:'1px solid var(--card-border)',
                        borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:10, minHeight:0
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                          <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>
                            Test Results
                          </span>
                          {testResults.length > 0 && (
                            <span style={{ fontSize:11, fontWeight:700, color: testResults.every(r => r.passed) ? '#10b981' : '#f59e0b' }}>
                              {testResults.filter(r => r.passed).length}/{testResults.length} passed
                            </span>
                          )}
                        </div>

                        <div style={{ flex:1, overflowY:'auto' }} className="no-scrollbar">
                          {testResults.length === 0 ? (
                            <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--text-muted)' }}>
                              <Terminal size={24} style={{ opacity:0.3 }} />
                              <span style={{ fontSize:12 }}>Run your code to see results</span>
                            </div>
                          ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {testResults.map((r) => (
                                <motion.div key={r.index}
                                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                                  style={{
                                    padding:'10px 14px', borderRadius:10, fontSize:12,
                                    background: r.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                                    border: `1px solid ${r.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                  }}
                                >
                                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: r.error || (!r.passed && r.actual) ? 6 : 0 }}>
                                    {r.passed
                                      ? <CheckCircle2 size={13} style={{ color:'#10b981', flexShrink:0 }} />
                                      : <XCircle     size={13} style={{ color:'#ef4444', flexShrink:0 }} />
                                    }
                                    <span style={{ fontWeight:700, color: r.passed ? '#10b981' : '#ef4444' }}>
                                      Test #{r.index} — {r.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                  {r.error && (
                                    <div style={{ fontFamily:'monospace', fontSize:10, color:'#f87171', marginLeft:21, lineHeight:1.4 }}>
                                      {r.error.slice(0, 120)}
                                    </div>
                                  )}
                                  {!r.passed && !r.error && (
                                    <div style={{ fontFamily:'monospace', fontSize:10, color:'var(--text-muted)', marginLeft:21, lineHeight:1.5 }}>
                                      <span style={{ color:'#818cf8' }}>Expected: </span>{r.expected}
                                      <br />
                                      <span style={{ color:'#f87171' }}>Got: </span>{r.actual ?? 'null'}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Abandon button */}
                      <GlowBtn onClick={confirmLeaveBattle} variant="ghost" style={{ fontSize:11, padding:'9px 14px' }}>
                        <LogOut size={13} /> Abandon Battle
                      </GlowBtn>
                    </div>
                  </div>
                </>
              )
            )}
          </motion.div>
        )}

        {/* ══════════════ RESULT ══════════════ */}
        {screen === 'result' && (
          <motion.div key="result"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'28px 36px', position: 'relative', zIndex: 1 }}
          >
            {/* Full-screen backdrop */}
            <div style={{
              position:'absolute', inset:0, zIndex:0, pointerEvents:'none',
              background: outcome === 'victory'
                ? 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(239,68,68,0.07) 0%, transparent 70%)'
            }} />

            <motion.div
              initial={{ scale:0.85, y:30 }} animate={{ scale:1, y:0 }}
              transition={{ type:'spring', stiffness:200, damping:20 }}
              style={{
                background:'var(--card-bg)', border:`1px solid ${outcome === 'victory' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
                borderRadius:28, padding:'48px 52px', maxWidth:520, width:'100%',
                textAlign:'center', position:'relative', zIndex:1,
                boxShadow: outcome === 'victory' ? '0 30px 80px rgba(16,185,129,0.2)' : '0 30px 80px rgba(239,68,68,0.15)'
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position:'absolute', top:0, left:0, right:0, height:3, borderRadius:'28px 28px 0 0',
                background: outcome === 'victory' ? 'linear-gradient(90deg,#10b981,#34d399,#10b981)' : 'linear-gradient(90deg,#ef4444,#f87171,#ef4444)'
              }} />

              {/* Icon */}
              <motion.div
                animate={{ rotate: outcome === 'victory' ? [0,5,-5,5,-5,0] : [0,-3,3,-3,3,0] }}
                transition={{ duration:0.6, delay:0.3 }}
                style={{ fontSize:72, marginBottom:20, display:'block', lineHeight:1 }}
              >
                {outcome === 'victory' ? '🏆' : '⚔️'}
              </motion.div>

              <h1 style={{
                fontSize:'clamp(32px,5vw,52px)', fontWeight:900, margin:'0 0 10px', letterSpacing:'-0.03em',
                background: outcome === 'victory' ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
              }}>
                {outcome === 'victory' ? 'VICTORY!' : 'DEFEAT'}
              </h1>

              <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:32, lineHeight:1.5 }}>
                {outcome === 'victory'
                  ? 'You outcoded your rival and won the battle! 🎉'
                  : 'Your opponent solved it first. Train harder and rematch!'}
              </p>

              {/* Stats row */}
              <div style={{
                display:'flex', justifyContent:'space-around', padding:'20px 24px',
                background:'rgba(255,255,255,0.025)', border:'1px solid var(--card-border)',
                borderRadius:16, marginBottom:32
              }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color: outcome === 'victory' ? '#fbbf24' : 'var(--text-muted)' }}>
                    +{outcome === 'victory' ? (roomMode === 'aptitude' ? 200 : challenge?.xp || 0) : 0} XP
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Earned</div>
                </div>
                <div style={{ width:1, background:'var(--card-border)' }} />
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:'#f59e0b' }}>{stats.streak || 0} 🔥</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Streak</div>
                </div>
                <div style={{ width:1, background:'var(--card-border)' }} />
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:'#818cf8' }}>{stats.wins || 0}W/{stats.losses || 0}L</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Record</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <GlowBtn onClick={handleLeave} variant="ghost" style={{ flex:1, justifyContent:'center' }}>
                  <LogOut size={14} /> Lobby
                </GlowBtn>
                <GlowBtn
                  onClick={() => { handleLeave(); setTimeout(handleCreateRoom, 100) }}
                  variant={outcome === 'victory' ? 'success' : 'primary'}
                  style={{ flex:2, justifyContent:'center' }}
                >
                  <RefreshCw size={14} /> Play Again
                </GlowBtn>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* ── Proctoring Warning Overlay Modal for Battle ── */}
        {isBattleFrozen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(5, 5, 10, 0.88)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: 'var(--card-bg)', border: `1.5px solid ${isBattleDisqualified ? '#ef4444' : '#f59e0b'}`,
                borderRadius: 20, padding: '36px 40px', maxWidth: 480, width: '90%',
                textAlign: 'center', boxShadow: `0 20px 50px ${isBattleDisqualified ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}`
              }}
            >
              {isBattleDisqualified ? (
                <>
                  <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 18, margin: '0 auto 18px' }} />
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 12px' }}>
                    Battle Terminated
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-color)', lineHeight: 1.6, margin: '0 0 24px' }}>
                    You have exceeded the maximum focus change limit of 2 warnings. 
                    This arena battle is forfeited due to proctoring violations.
                  </p>
                  <button
                    onClick={() => {
                      setIsBattleFrozen(false)
                      try {
                        if (document.fullscreenElement && document.exitFullscreen) {
                          document.exitFullscreen().catch(() => {})
                        }
                      } catch (e) {}
                      handleLeave()
                    }}
                    style={{
                      padding: '12px 28px', borderRadius: 10, border: 'none', outline: 'none',
                      background: 'linear-gradient(135deg, #ef4444, #f43f5e)', color: '#fff',
                      fontSize: 13.5, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.2)'
                    }}
                  >
                    Acknowledge & Forfeit Battle
                  </button>
                </>
              ) : (
                <>
                  <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: 18, margin: '0 auto 18px' }} />
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 12px' }}>
                    Proctoring Warning
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-color)', lineHeight: 1.6, margin: '0 0 24px' }}>
                    You navigated away from the battle page or switched tabs. 
                    This violation has been logged to the proctoring server.
                    <br /><br />
                    <strong style={{ color: 'var(--text-heading)' }}>Warnings triggered: {battleWarnings} / 2</strong>
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      A third focus loss will result in automatic disqualification and battle forfeit.
                    </span>
                  </p>
                  <button
                    onClick={async () => {
                      setIsBattleFrozen(false)
                      try {
                        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                          await document.documentElement.requestFullscreen()
                        }
                      } catch (e) {}
                    }}
                    style={{
                      padding: '12px 28px', borderRadius: 10, border: 'none', outline: 'none',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
                      fontSize: 13.5, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.2)'
                    }}
                  >
                    Acknowledge & Resume
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* ── Custom Abandon Battle Confirmation Modal ── */}
        {showAbandonModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'rgba(5, 5, 10, 0.88)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: 'var(--card-bg)', border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 24, padding: '36px 40px', maxWidth: 460, width: '90%',
                textAlign: 'center', boxShadow: '0 25px 60px rgba(239, 68, 68, 0.25)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #ef4444, #f43f5e)'
              }} />

              <div style={{
                width: 68, height: 68, borderRadius: 20, margin: '0 auto 20px',
                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={32} style={{ color: '#ef4444' }} />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                Abandon Battle?
              </h2>

              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 28px' }}>
                Leaving mid-battle will result in an immediate automatic forfeit and record a loss on your profile stats.
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowAbandonModal(false)}
                  style={{
                    flex: 1, padding: '12px 18px', borderRadius: 12, border: '1px solid var(--glass-border)',
                    background: 'var(--card-bg)', color: 'var(--text-heading)',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Keep Fighting
                </button>
                <button
                  onClick={() => handleLeave()}
                  style={{
                    flex: 1, padding: '12px 18px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #ef4444, #f43f5e)', color: '#fff',
                    fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.25)'
                  }}
                >
                  Forfeit & Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Global CSS */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 860px) {
            .arena-battle-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* ── Page Tour ── */}
        <HelpButton onClick={openTour} accentColor="#ec4899" />
        <PageTour
          steps={ARENA_TOUR_STEPS}
          isOpen={tourOpen}
          onClose={closeTour}
          accentColor="#ec4899"
        />
      </div>
    </PageWrapper>
  )
}
