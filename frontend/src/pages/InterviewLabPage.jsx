import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, Clock, ChevronRight, History, X, Sparkles, Terminal, Activity } from 'lucide-react'
import { interviewService } from '@/services/interviewService'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const INTERVIEW_TOUR_STEPS = [
  {
    target: 'interview-header',
    title: '🧪 AI Interview Lab',
    description: 'Practice interactive AI mock interviews. AI evaluates your technical & behavioral responses in real time.',
    color: '#10b981',
    placement: 'bottom',
  },
  {
    target: 'interview-modes',
    title: '🎯 Specialization Modes',
    description: 'Select a simulator mode: Technical, HR/Behavioral, Mixed, Rapid Fire, or FAANG Boardroom. Customize experience level and topic focus.',
    color: '#8b5cf6',
    placement: 'bottom',
  },
  {
    target: 'interview-history',
    title: '📜 Past Simulations Log',
    description: 'View transcripts, AI scores out of 10, XP earned, and detailed feedback from all your past mock interview sessions.',
    color: '#3b82f6',
    placement: 'top',
  },
]

const MODES = [
  { id:'technical',   icon:'💻', title:'Technical',     desc:'Data structures, algorithms, system design, and coding concepts for engineering roles.',                         xp:150, duration:'20-40 min', accent:'#6366f1', code: 'TECH_SIM_01' },
  { id:'hr',          icon:'🤝', title:'HR / Behavioral',desc:'Situational questions, leadership, conflict resolution, and soft skills assessment.',                           xp:100, duration:'15-30 min', accent:'#8b5cf6', code: 'BEHAV_SIM_02' },
  { id:'mixed',       icon:'🔀', title:'Mixed Mode',     desc:'A balanced combination of technical and behavioral questions for a complete interview experience.',              xp:120, duration:'25-45 min', accent:'#06b6d4', code: 'MIXED_SIM_03' },
  { id:'rapid_fire',  icon:'⚡', title:'Rapid Fire',     desc:'Quick-answer questions under time pressure. Test your instincts and recall speed.',                            xp:80,  duration:'10-20 min', accent:'#f59e0b', code: 'RAPID_SIM_04' },
]

const DIFFICULTIES = [
  { id:'junior', label:'Junior',    desc:'0–2 yrs exp',  color:'#34d399' },
  { id:'mid',    label:'Mid-level', desc:'2–5 yrs exp',  color:'#fbbf24' },
  { id:'senior', label:'Senior',    desc:'5+ yrs exp',   color:'#fb7185' },
]

const stagger = {
  container: { hidden:{}, show:{ transition:{ staggerChildren:0.06 } } },
  item:      { hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0, transition:{ duration:0.35, ease:[0.4,0,0.2,1] } } },
}

import LimitExceededModal from '@/components/ui/LimitExceededModal'

export default function InterviewLabPage() {
  const [selectedMode, setSelectedMode] = useState(null)
  const [configOpen,   setConfigOpen]   = useState(false)
  const [sessions,     setSessions]     = useState([])
  const [config,       setConfig]       = useState({ difficulty:'mid', total_questions:5, topic:'' })
  const [starting,     setStarting]     = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const { isAuthenticated, checkInterviewLimit, recordInterviewUsage } = useAuth()
  const navigate = useNavigate()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('interview')

  useEffect(() => {
    if (isAuthenticated) {
      interviewService.getSessions()
        .then(r => setSessions(r.data.results || r.data))
        .catch(() => {})
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (configOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [configOpen])

  const handleModeSelect = mode => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!checkInterviewLimit()) {
      setShowLimitModal(true)
      return
    }
    setSelectedMode(mode); setConfigOpen(true)
  }

  const handleStart = async () => {
    if (!selectedMode) return
    if (!checkInterviewLimit()) {
      setConfigOpen(false)
      setShowLimitModal(true)
      return
    }
    setStarting(true)
    try {
      const { data } = await interviewService.startSession({
        mode: selectedMode.id, difficulty: config.difficulty,
        total_questions: config.total_questions, topic: config.topic,
      })
      recordInterviewUsage()
      navigate(`/interview/${data.id}`)
    } catch { alert('Failed to start. Please try again.') }
    finally { setStarting(false) }
  }

  const scoreColor = s => s >= 8 ? '#34d399' : s >= 6 ? '#fbbf24' : '#fb7185'

  return (
    <PageWrapper noPadding>
      <div style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        
        {/* Futuristic Background Mesh & Radial Corner Flows */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: -150, left: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -150, right: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />

        <div className="container" style={{ paddingTop:36, paddingBottom:64, position: 'relative', zIndex: 1 }}>

          {/* Glowing Simulation Header */}
          <motion.div data-tour="interview-header" initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:40 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)' }}>
                <Brain size={18} style={{ color:'#a78bfa' }} />
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#a78bfa', fontWeight: 800, background: 'rgba(139,92,246,0.06)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(139,92,246,0.12)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                SIMULATION DECK ACTIVE
              </div>
            </div>
            <h1 style={{ fontSize:'clamp(28px,5vw,48px)', fontWeight:950, color:'var(--text-heading)', marginBottom:14, letterSpacing:'-0.03em', lineHeight:1.1 }}>
              Practice until you're<br />
              <span style={{ background:'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>interview-ready.</span>
            </h1>
            <p style={{ fontSize:15, color:'var(--text-muted)', maxWidth:560, lineHeight:1.6, margin: 0 }}>
              AI-generated questions, real-time evaluation, and detailed feedback on every answer. Select your specialization simulator below.
            </p>
          </motion.div>

          {/* Mode Cards Deck */}
          <motion.div data-tour="interview-modes" variants={stagger.container} initial="hidden" animate="show"
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(310px, 1fr))', gap:20, marginBottom:48 }}>
            {MODES.map(mode => (
              <motion.div key={mode.id} variants={stagger.item}>
                <motion.div
                  whileHover={{ y:-4, boxShadow: 'var(--glass-shadow)', borderColor: mode.accent }}
                  onClick={() => handleModeSelect(mode)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderLeft: `4px solid ${mode.accent}`,
                    borderRadius: 16,
                    padding: 24,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                  }}>
                  {/* Subtle top glow line */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:1.5, background:`linear-gradient(90deg,transparent,${mode.accent}30,transparent)` }} />
                  
                  <div style={{ position:'relative', zIndex:1 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                      <div style={{ width:46, height:46, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, background:`${mode.accent}12`, border:`1px solid ${mode.accent}20` }}>
                        {mode.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent: 'space-between', marginBottom:4 }}>
                          <h4 style={{ fontSize:16, fontWeight:800, color:'var(--text-heading)', margin: 0 }}>{mode.title}</h4>
                          <ChevronRight size={14} style={{ color:'var(--text-muted)' }} />
                        </div>
                        <p style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.5, marginBottom:16, height: 38, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {mode.desc}
                        </p>
                        
                        <div style={{ display:'flex', alignItems:'center', gap:14, borderTop: '1px dashed var(--card-border)', paddingTop: 12 }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:800, color: mode.accent }}>
                            <Zap size={11} /> Up to {mode.xp} XP
                          </span>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted)' }}>
                            <Clock size={11} /> {mode.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Session History Board */}
          {isAuthenticated && sessions.length > 0 && (
            <motion.div data-tour="interview-history" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 20,
                padding: 28,
                boxShadow: 'var(--glass-shadow)'
              }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent: 'space-between', marginBottom:20, borderBottom: '1px solid var(--card-border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.15)' }}>
                    <History size={16} style={{ color:'#8b5cf6' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize:17, fontWeight:900, color:'var(--text-heading)', margin: 0 }}>Past Simulations Log</h2>
                    <p style={{ fontSize:12, color:'var(--text-muted)', margin: 0 }}>Your simulation performance history</p>
                  </div>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)' }}>[SYSTEM_TELEMETRY]</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column' }}>
                {sessions.slice(0,5).map((session, idx) => {
                  const mConfig = MODES.find(m => m.id === session.mode)
                  const isLast = idx === Math.min(sessions.length, 5) - 1
                  return (
                    <Link key={session.id} to={`/interview/${session.id}`} style={{ textDecoration:'none' }}>
                      <motion.div 
                        whileHover={{ x:4, background: 'rgba(99,102,241,0.02)' }} 
                        style={{ 
                          padding:'16px 20px', 
                          display:'flex', 
                          alignItems:'center', 
                          gap:16,
                          borderBottom: isLast ? 'none' : '1px solid var(--card-border)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, background: mConfig ? `${mConfig.accent}12` : 'rgba(255,255,255,0.04)', border: mConfig ? `1px solid ${mConfig.accent}20` : '1px solid var(--card-border)' }}>
                          {mConfig?.icon || '🧪'}
                        </div>
                        
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                            <span style={{ fontSize:14.5, fontWeight:800, color:'var(--text-heading)', textTransform:'capitalize' }}>{session.mode.replace('_',' ')}</span>
                            <span style={{ padding:'2px 6px', borderRadius:4, fontSize:9, fontWeight:800, background:'rgba(99,102,241,0.06)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.12)' }}>{session.difficulty}</span>
                            {session.status === 'completed' ? (
                              <span style={{ padding:'2px 6px', borderRadius:4, fontSize:9, fontWeight:800, background:'rgba(16,185,129,0.06)', color:'#34d399', border:'1px solid rgba(16,185,129,0.12)' }}>DONE</span>
                            ) : (
                              <span style={{ padding:'2px 6px', borderRadius:4, fontSize:9, fontWeight:800, background:'rgba(245,158,11,0.06)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.12)' }}>IN PROGRESS</span>
                            )}
                          </div>
                          <p style={{ fontSize:12, color:'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>
                            ID: <span style={{ color: 'var(--text-color)' }}>{String(session.id)}</span> · Date: {new Date(session.started_at).toLocaleDateString()} · {session.total_questions} Queries
                          </p>
                        </div>

                        <div style={{ display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
                          {session.score !== null && (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize:16, fontWeight:900, color:scoreColor(session.score), fontFamily: 'monospace' }}>{session.score}/10</div>
                              <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Score</div>
                            </div>
                          )}
                          {session.xp_earned > 0 && (
                            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:800, color:'#818cf8', background: 'rgba(99,102,241,0.06)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.12)' }}>
                              <Zap size={10} />+{session.xp_earned} XP
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Simulation Configuration Modal */}
      <AnimatePresence>
        {configOpen && selectedMode && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) setConfigOpen(false) }}>
            <motion.div initial={{ scale:0.9, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.9, opacity:0 }}
              style={{ width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:24, boxShadow:'0 30px 70px rgba(0,0,0,0.5)', transition:'all 0.4s ease' }}>

              {/* Modal top accent */}
              <div style={{ height:3, background:`linear-gradient(90deg, ${selectedMode.accent}, #a855f7)` }} />

              <div style={{ padding:32 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:48, height:48, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, background:`${selectedMode.accent}18`, border:`1px solid ${selectedMode.accent}30` }}>
                      {selectedMode.icon}
                    </div>
                    <div>
                      <h2 style={{ fontSize:18, fontWeight:900, color:'var(--text-heading)', margin:0 }}>Simulator Config</h2>
                      <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>Type: {selectedMode.title}</p>
                    </div>
                  </div>
                  <button onClick={() => setConfigOpen(false)}
                    style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--text-muted)', cursor:'pointer', outline:'none', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='rgba(239,68,68,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--glass-border)'}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Difficulty selectors */}
                <div style={{ marginBottom:24 }}>
                  <label style={{ fontSize:13, fontWeight:750, color:'var(--text-heading)', display:'block', marginBottom:12, letterSpacing:0.5 }}>EXPERIENCE DECK</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {DIFFICULTIES.map(d => (
                      <button key={d.id} onClick={() => setConfig(c => ({...c, difficulty:d.id}))}
                        style={{ padding:'14px 8px', borderRadius:14, cursor:'pointer', outline:'none', transition:'all 0.2s', textAlign:'center',
                          background: config.difficulty===d.id ? `${d.color}15` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${config.difficulty===d.id ? d.color+'45' : 'var(--glass-border)'}`,
                        }}>
                        <div style={{ fontSize:14, fontWeight:900, color: config.difficulty===d.id ? d.color : 'var(--text-heading)', marginBottom:4 }}>{d.label}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)' }}>{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions range slider */}
                <div style={{ marginBottom:24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ fontSize:13, fontWeight:750, color:'var(--text-heading)', letterSpacing:0.5 }}>QUERY CAPACITY</label>
                    <span style={{ fontSize:14, fontWeight:900, color: selectedMode.accent, fontFamily: 'monospace' }}>{config.total_questions} Questions</span>
                  </div>
                  <input type="range" min={3} max={10} step={1} value={config.total_questions}
                    onChange={e => setConfig(c => ({...c, total_questions:parseInt(e.target.value)}))}
                    style={{ width:'100%', accentColor: selectedMode.accent }} />
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginTop:4, fontFamily: 'monospace' }}>
                    <span>03 (RAPID)</span><span>10 (THOROUGH)</span>
                  </div>
                </div>

                {/* Topic input */}
                <div style={{ marginBottom:32 }}>
                  <label style={{ fontSize:13, fontWeight:750, color:'var(--text-heading)', display:'block', marginBottom:8, letterSpacing:0.5 }}>
                    TOPIC FOCUS <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(OPTIONAL)</span>
                  </label>
                  <input type="text" placeholder="e.g. React, Python OOP, System Design..."
                    value={config.topic}
                    onChange={e => setConfig(c => ({...c, topic:e.target.value}))}
                    style={{ width:'100%', boxSizing: 'border-box', padding:'12px 16px', borderRadius:12, fontSize:13, background:'rgba(255,255,255,0.02)', border:'1px solid var(--glass-border)', color:'var(--text-heading)', outline:'none', transition:'all 0.3s ease', fontFamily: 'monospace' }}
                    onFocus={e => {
                      e.target.style.borderColor = selectedMode.accent
                      e.target.style.boxShadow = `0 0 12px ${selectedMode.accent}20`
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--glass-border)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={handleStart} disabled={starting}
                  style={{
                    width:'100%',
                    padding:'15px',
                    borderRadius:14,
                    fontSize:15,
                    fontWeight:900,
                    border:'1px solid rgba(255,255,255,0.15)',
                    cursor: starting ? 'not-allowed' : 'pointer',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:8,
                    background: '#000',
                    color: '#fff',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    opacity:starting?0.7:1
                  }}>
                  {starting ? 'Booting Simulator...' : 'Initialize Simulation'} <ChevronRight size={17} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#10b981" />
      <PageTour
        steps={INTERVIEW_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#10b981"
      />
      <LimitExceededModal
        featureName="AI Mock Interviews"
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </PageWrapper>
  )
}
