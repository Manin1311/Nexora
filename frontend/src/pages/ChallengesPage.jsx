import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, Clock, ArrowRight, Code2, CheckCircle, Filter, Star, Sparkles, X, Loader2, Trophy, Target, TrendingUp, ChevronRight } from 'lucide-react'
import { challengeService } from '@/services/challengeService'
import { useAuth } from '@/context/AuthContext'
import PageWrapper from '@/components/layout/PageWrapper'
import Avatar from '@/components/ui/Avatar'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import ContributionGrid from '@/components/ui/ContributionGrid'
import DailySchedulerWidget from '@/components/dashboard/DailySchedulerWidget'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const CHALLENGES_TOUR_STEPS = [
  {
    target: 'challenges-header',
    title: '⚔️ Challenges Arena',
    description: 'Here you can see your overall progress — how many challenges you\'ve solved and your completion rate across all topics.',
    color: '#6366f1',
    placement: 'bottom',
  },
  {
    target: 'challenges-search',
    title: '🔍 Search & Filter',
    description: 'Use the search bar to find challenges by name. Filter by type (Daily, Topic, Project) or difficulty (Easy, Medium, Hard).',
    color: '#818cf8',
    placement: 'bottom',
  },
  {
    target: 'challenges-ai-btn',
    title: '✨ AI Challenge Generator',
    description: 'Click here to generate a brand-new coding problem on any topic using Gemini AI — fully graded and ready to solve.',
    color: '#8b5cf6',
    placement: 'left',
  },
  {
    target: 'challenges-grid',
    title: '📋 Challenge Cards',
    description: 'Each card shows the difficulty, XP reward, estimated time, and topic. Click any card to open the full problem and code editor.',
    color: '#34d399',
    placement: 'top',
  },
]

/* ─── Design tokens ─────────────────────────────────────────────────── */
const DIFF_CONFIG = {
  easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  label: 'Easy'   },
  medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  label: 'Medium' },
  hard:   { color: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', label: 'Hard'   },
}
const diffStyle = d => d === 'easy'
  ? { color: DIFF_CONFIG.easy.color,   background: DIFF_CONFIG.easy.bg,   border: `1px solid ${DIFF_CONFIG.easy.border}`   }
  : d === 'hard'
  ? { color: DIFF_CONFIG.hard.color,   background: DIFF_CONFIG.hard.bg,   border: `1px solid ${DIFF_CONFIG.hard.border}`   }
  : { color: DIFF_CONFIG.medium.color, background: DIFF_CONFIG.medium.bg, border: `1px solid ${DIFF_CONFIG.medium.border}` }

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item:      { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } } },
}

const TYPES = [
  { id: 'all',    label: 'All'     },
  { id: 'daily',  label: 'Daily'   },
  { id: 'topic',  label: 'Topic'   },
  { id: 'weekly', label: 'Project' },
]

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function ChallengesPage() {
  const [challenges,     setChallenges]     = useState([])
  const [topics,         setTopics]         = useState([])
  const [loading,        setLoading]        = useState(true)
  const [activeType,     setActiveType]     = useState('all')
  const [activeTopic,    setActiveTopic]    = useState(null)
  const [activeDiff,     setActiveDiff]     = useState(null)
  const [search,         setSearch]         = useState('')
  const [dailyChallenge, setDailyChallenge] = useState(null)
  const [showQuestPopup, setShowQuestPopup] = useState(false)
  const { isAuthenticated } = useAuth()

  // AI Challenge Generator states
  const [showGenModal, setShowGenModal] = useState(false)
  const [genTopicId,   setGenTopicId]   = useState('')
  const [customTopic,  setCustomTopic]  = useState('')
  const [generating,   setGenerating]   = useState(false)
  const [genError,     setGenError]     = useState('')

  const handleGenerateAIChallenge = async e => {
    e.preventDefault()
    setGenerating(true)
    setGenError('')
    const payload = {}
    if (genTopicId === 'custom') {
      if (!customTopic.trim()) { setGenError('Please enter a custom topic name.'); setGenerating(false); return }
      payload.topic_name = customTopic.trim()
    } else {
      payload.topic_id = genTopicId
    }
    try {
      const { data } = await challengeService.generateAIChallenge(payload)
      setChallenges(prev => [data, ...prev])
      if (genTopicId === 'custom') {
        const tRes = await challengeService.getTopics()
        setTopics(tRes.data.results || tRes.data)
      }
      setShowGenModal(false); setCustomTopic(''); setActiveType('all')
      setActiveTopic(null); setActiveDiff(null); setSearch('')
    } catch (err) {
      setGenError(err.response?.data?.error || 'Failed to generate challenge. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    Promise.all([
      challengeService.getAll(),
      challengeService.getTopics(),
      challengeService.getDaily().catch(() => null),
    ]).then(([cRes, tRes, dRes]) => {
      const list = Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || [])
      setChallenges(list)
      setTopics(tRes.data.results || tRes.data)
      if (dRes?.data) {
        const daily = dRes.data
        setDailyChallenge(daily)
        const inList   = list.find(c => c.id === daily.id)
        const isSolved = inList ? inList.is_completed : daily.is_completed
        if (!inList) setChallenges(prev => prev.find(c => c.id === daily.id) ? prev : [daily, ...prev])
        const hasSeenSession = sessionStorage.getItem('seen-daily-quest')
        if (!isSolved && !hasSeenSession) { setShowQuestPopup(true); sessionStorage.setItem('seen-daily-quest', 'true') }
      }
    }).catch(() => { setChallenges([]); setTopics([]) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = challenges.filter(c => {
    if (activeType !== 'all' && c.challenge_type !== activeType) return false
    if (activeTopic && c.topic?.id !== activeTopic) return false
    if (activeDiff  && c.difficulty !== activeDiff) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const completed = challenges.filter(c => c.is_completed).length
  const pct       = challenges.length ? Math.round((completed / challenges.length) * 100) : 0

  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('challenges', { preventAutoShow: showQuestPopup || showGenModal })

  return (
    <PageWrapper noPadding>
      <div style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* ── Ambient Background ───────────────────────────────────── */}
        <div style={{ position:'absolute', inset:0, zIndex:0, opacity:0.12, pointerEvents:'none',
          backgroundImage:'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize:'28px 28px' }} />
        <div style={{ position:'absolute', top:-200, left:'-10%', width:700, height:700, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
          filter:'blur(80px)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:-200, right:'-10%', width:600, height:600, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)',
          filter:'blur(80px)', pointerEvents:'none', zIndex:0 }} />

        <div className="container" style={{ paddingTop: 36, paddingBottom: 64, position:'relative', zIndex:1 }}>

          {/* ══ HERO HEADER ══════════════════════════════════════════ */}
          <div data-tour="challenges-header" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))', gap:24, marginBottom:36 }}>

            {/* Left — Title + Stats */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
              {/* Badge */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:14,
                width:'fit-content', padding:'4px 12px', borderRadius:20,
                background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.18)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#818cf8', animation:'pulse 1.4s infinite' }} />
                <span style={{ fontSize:11, fontWeight:800, color:'#818cf8', letterSpacing:0.5 }}>CHALLENGE ARENA</span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize:'clamp(26px,4.5vw,44px)', fontWeight:950, color:'var(--text-heading)',
                letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:10 }}>
                Sharpen your<br/>
                <span style={{ background:'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  coding edge.
                </span>
              </h1>
              <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6, marginBottom:22, maxWidth:420 }}>
                Practice real-world problems, earn XP on every submission, and track your growth over time.
              </p>

              {/* Progress bar */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>Completion Progress</span>
                  <span style={{ fontSize:12, fontWeight:800, color:'#818cf8' }}>{pct}%</span>
                </div>
                <div style={{ height:6, borderRadius:99, background:'var(--card-border)', overflow:'hidden' }}>
                  <motion.div
                    initial={{ width:0 }}
                    animate={{ width:`${pct}%` }}
                    transition={{ duration:1.2, ease:[0.4,0,0.2,1], delay:0.2 }}
                    style={{ height:'100%', borderRadius:99,
                      background:'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                </div>
              </div>

              {/* Stat chips */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {[
                  { icon:'⚔️', val: challenges.length, label:'Total', accent:'#6366f1' },
                  { icon:'✅', val: completed,          label:'Solved', accent:'#34d399' },
                  { icon:'📚', val: topics.length,      label:'Topics', accent:'#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{
                    display:'flex', alignItems:'center', gap:9,
                    padding:'9px 14px', borderRadius:12, flex:'1 1 110px',
                    background:'var(--card-bg)', border:'1px solid var(--card-border)',
                    transition:'background-color 0.4s, border-color 0.4s'
                  }}>
                    <span style={{ fontSize:18 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:18, fontWeight:900, color: s.accent, lineHeight:1 }}>
                        <AnimatedCounter value={s.val} />
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Contribution Grid */}
            <ContributionGrid />
          </div>

          {/* ══ DAILY SCHEDULER ══════════════════════════════════════ */}
          {isAuthenticated && (
            <div style={{ marginBottom:36 }}>
              <DailySchedulerWidget />
            </div>
          )}

          {/* ══ FILTER STRIP ═════════════════════════════════════════ */}
          <div data-tour="challenges-search" style={{
            display:'flex', flexWrap:'wrap', gap:12, alignItems:'center',
            marginBottom:28, padding:'14px 18px', borderRadius:16,
            background:'var(--card-bg)', border:'1px solid var(--card-border)',
            transition:'background-color 0.4s, border-color 0.4s'
          }}>
            {/* Search */}
            <div style={{ position:'relative', flex:'1', minWidth:200 }}>
              <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search challenges…"
                style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px 8px 32px', borderRadius:10, fontSize:13,
                  background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                  color:'var(--text-color)', outline:'none' }}
              />
            </div>

            {/* Type tabs */}
            <div style={{ display:'flex', gap:4 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setActiveType(t.id)}
                  className={activeType === t.id ? 'btn-primary' : ''}
                  style={{ padding:'7px 14px', borderRadius:9, fontSize:12.5, fontWeight:600, cursor:'pointer', outline:'none', transition:'all 0.2s',
                    background: activeType === t.id ? undefined : 'var(--glass-bg)',
                    color:      activeType === t.id ? undefined : 'var(--text-muted)',
                    border:     activeType === t.id ? 'none' : '1px solid var(--glass-border)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <div style={{ display:'flex', gap:4 }}>
              {['easy','medium','hard'].map(d => {
                const cfg = DIFF_CONFIG[d]
                return (
                  <button key={d} onClick={() => setActiveDiff(v => v === d ? null : d)}
                    style={{ padding:'7px 12px', borderRadius:9, fontSize:11.5, fontWeight:700, cursor:'pointer', outline:'none', textTransform:'capitalize', transition:'all 0.2s',
                      ...(activeDiff === d
                        ? { color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }
                        : { background: 'var(--glass-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }) }}>
                    {d}
                  </button>
                )
              })}
            </div>

            {/* AI Generate */}
            {isAuthenticated && (
              <motion.button
                data-tour="challenges-ai-btn"
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={() => { setGenTopicId(topics.length ? topics[0].id : 'custom'); setShowGenModal(true) }}
                style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:700,
                  cursor:'pointer', outline:'none', border:'none', marginLeft:'auto',
                  background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color:'#fff', boxShadow:'0 4px 14px rgba(99,102,241,0.3)'
                }}>
                <Sparkles size={13} /> Generate AI
              </motion.button>
            )}
          </div>

          {/* ── Results count ── */}
          {!loading && (
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:18 }}>
              Showing <strong style={{ color:'#818cf8' }}>{filtered.length}</strong> challenge{filtered.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </p>
          )}

          {/* ══ CHALLENGE GRID ═══════════════════════════════════════ */}
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
              {Array.from({ length:6 }).map((_, i) => (
                <div key={i} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:24, height:200 }}>
                  <div className="shimmer" style={{ width:'28%', height:16, borderRadius:6, marginBottom:12 }} />
                  <div className="shimmer" style={{ width:'78%', height:20, borderRadius:6, marginBottom:10 }} />
                  <div className="shimmer" style={{ width:'100%', height:13, borderRadius:6, marginBottom:6 }} />
                  <div className="shimmer" style={{ width:'55%', height:13, borderRadius:6 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🔍</div>
              <p style={{ color:'var(--text-muted)', fontSize:16 }}>No challenges found. Try different filters.</p>
            </div>
          ) : (
            <motion.div data-tour="challenges-grid" variants={stagger.container} initial="hidden" animate="show"
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
              {filtered.map(c => {
                const diff = DIFF_CONFIG[c.difficulty] || DIFF_CONFIG.medium
                return (
                  <motion.div key={c.id} variants={stagger.item}>
                    <Link to={`/challenges/${c.id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}>
                      <motion.div
                        whileHover={{ y:-4, boxShadow:`0 12px 32px ${diff.color}14` }}
                        transition={{ type:'spring', stiffness:300, damping:24 }}
                        style={{
                          display:'flex', flexDirection:'column', height:'100%',
                          background:'var(--card-bg)',
                          border:'1px solid var(--card-border)',
                          borderLeft:`3px solid ${diff.color}`,
                          borderRadius:14, padding:22, cursor:'pointer',
                          position:'relative', overflow:'hidden',
                          transition:'background-color 0.4s, border-color 0.4s',
                        }}>

                        {/* Subtle top shimmer */}
                        <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1,
                          background:`linear-gradient(90deg,transparent,${diff.color}25,transparent)`, pointerEvents:'none' }} />

                        {/* Tags */}
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12, position:'relative', zIndex:1 }}>
                          <span style={{ ...diffStyle(c.difficulty), padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:700, textTransform:'capitalize' }}>
                            {c.difficulty}
                          </span>
                          {c.topic && (
                            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:500,
                              background:'rgba(99,102,241,0.08)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.18)' }}>
                              {c.topic.icon} {c.topic.name}
                            </span>
                          )}
                          {c.is_completed && (
                            <span style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:700,
                              background:'rgba(52,211,153,0.08)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)' }}>
                              <CheckCircle size={9} /> Done
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize:15.5, fontWeight:800, color:'var(--text-heading)', lineHeight:1.4,
                          marginBottom:8, flex:1, position:'relative', zIndex:1 }}>
                          {c.title}
                        </h3>

                        {/* Description */}
                        {c.description && (
                          <p style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.55, marginBottom:16,
                            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                            position:'relative', zIndex:1 }}>
                            {c.description.substring(0, 120)}…
                          </p>
                        )}

                        {/* Footer */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                          borderTop:`1px dashed var(--card-border)`, paddingTop:12, position:'relative', zIndex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:800, color:'#818cf8' }}>
                              <Zap size={12} />{c.xp_reward} XP
                            </div>
                            {c.estimated_time && (
                              <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:'var(--text-muted)' }}>
                                <Clock size={11} />{c.estimated_time}
                              </div>
                            )}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5,
                            fontWeight:700, color: diff.color }}>
                            Solve <ArrowRight size={12} />
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* ══ AI GENERATOR MODAL ═══════════════════════════════════════ */}
      <AnimatePresence>
        {showGenModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(10px)',
            zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <motion.div
              initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
              style={{ width:'100%', maxWidth:460, background:'var(--card-bg)',
                border:'1px solid var(--card-border)', borderRadius:22, overflow:'hidden',
                position:'relative', boxShadow:'0 24px 60px rgba(0,0,0,0.4)' }}>

              {/* Accent bar */}
              <div style={{ height:3, background:'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />

              <div style={{ padding:28 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
                      background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)' }}>
                      <Sparkles size={18} color="#818cf8" />
                    </div>
                    <div>
                      <h2 style={{ fontSize:18, fontWeight:900, color:'var(--text-heading)', margin:0 }}>AI Challenge Builder</h2>
                      <p style={{ fontSize:11.5, color:'var(--text-muted)', margin:0 }}>Powered by Gemini</p>
                    </div>
                  </div>
                  <button onClick={() => setShowGenModal(false)} disabled={generating}
                    style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                      background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--text-muted)', cursor:'pointer', outline:'none' }}>
                    <X size={14} />
                  </button>
                </div>

                <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:22 }}>
                  Enter any coding topic, framework, or architecture pattern. Nexora's AI will compile a fully graded coding problem for you on the fly.
                </p>

                <form onSubmit={handleGenerateAIChallenge} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:'var(--text-heading)', letterSpacing:0.4 }}>SELECT TOPIC</label>
                    <select value={genTopicId} onChange={e => setGenTopicId(e.target.value)} disabled={generating}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:10, fontSize:13,
                        background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                        color:'var(--text-color)', outline:'none' }}>
                      {topics.map(t => (<option key={t.id} value={t.id}>{t.icon} {t.name}</option>))}
                      <option value="custom">✨ Custom Topic (Write Your Own)</option>
                    </select>
                  </div>

                  {genTopicId === 'custom' && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                      style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <label style={{ fontSize:12, fontWeight:700, color:'var(--text-heading)', letterSpacing:0.4 }}>CUSTOM TOPIC</label>
                      <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)}
                        disabled={generating} placeholder="e.g. Docker Compose, Rust Basics, GraphQL API" maxLength={30}
                        style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, fontSize:13,
                          background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                          color:'var(--text-color)', outline:'none' }} />
                    </motion.div>
                  )}

                  {genError && (
                    <p style={{ fontSize:12, color:'#f87171', margin:0, fontWeight:600 }}>⚠️ {genError}</p>
                  )}

                  <div style={{ display:'flex', gap:10, marginTop:6 }}>
                    <button type="button" onClick={() => setShowGenModal(false)} disabled={generating}
                      style={{ flex:1, padding:'11px', borderRadius:10, fontSize:13, fontWeight:600,
                        color:'var(--text-muted)', background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                        cursor:'pointer', outline:'none' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={generating} className="btn-primary"
                      style={{ flex:2, padding:'11px', borderRadius:10, fontSize:13, fontWeight:800,
                        border:'none', cursor:'pointer', outline:'none',
                        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
                        opacity: generating ? 0.75 : 1 }}>
                      {generating ? (
                        <>
                          <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:0.9, ease:'linear' }}
                            style={{ display:'inline-flex' }}>
                            <Loader2 size={13} />
                          </motion.div>
                          Compiling…
                        </>
                      ) : 'Generate & Solve'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ DAILY QUEST POPUP ════════════════════════════════════════ */}
      <AnimatePresence>
        {showQuestPopup && dailyChallenge && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.75)', backdropFilter:'blur(8px)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}>
            <motion.div
              initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.9, y:20 }} transition={{ type:'spring', damping:25, stiffness:200 }}
              style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
                borderRadius:24, padding:32, maxWidth:480, width:'100%',
                boxShadow:'0 20px 50px rgba(99,102,241,0.15)', position:'relative', overflow:'hidden', textAlign:'center' }}>

              {/* Glows */}
              <div style={{ position:'absolute', top:-60, left:-60, width:140, height:140,
                background:'rgba(99,102,241,0.2)', filter:'blur(40px)', borderRadius:'50%', pointerEvents:'none' }} />
              <div style={{ position:'absolute', bottom:-60, right:-60, width:140, height:140,
                background:'rgba(236,72,153,0.15)', filter:'blur(40px)', borderRadius:'50%', pointerEvents:'none' }} />

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ width:54, height:54, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'linear-gradient(135deg, #6366f1, #d946ef)', boxShadow:'0 8px 20px rgba(99,102,241,0.4)' }}>
                  <Sparkles size={26} color="#fff" />
                </div>
                <div>
                  <span style={{ background:'linear-gradient(90deg, #818cf8, #f472b6)',
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                    fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:2 }}>
                    ⚡ Daily Quest Active
                  </span>
                  <h2 style={{ fontSize:24, fontWeight:900, color:'var(--text-heading)', margin:'6px 0 0', letterSpacing:'-0.02em' }}>
                    Today's Challenge
                  </h2>
                </div>
              </div>

              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid var(--card-border)',
                borderRadius:16, padding:20, marginBottom:20, position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12 }}>
                  <span style={{ padding:'4px 10px', borderRadius:8, background:'rgba(99,102,241,0.1)',
                    border:'1px solid rgba(99,102,241,0.2)', color:'#818cf8', fontSize:11, fontWeight:700 }}>
                    {dailyChallenge.topic?.name || 'Coding'}
                  </span>
                  <span style={{ padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, textTransform:'capitalize',
                    ...diffStyle(dailyChallenge.difficulty) }}>
                    {dailyChallenge.difficulty}
                  </span>
                  <span style={{ padding:'4px 10px', borderRadius:8, background:'rgba(251,191,36,0.1)',
                    border:'1px solid rgba(251,191,36,0.2)', color:'#fbbf24', fontSize:11, fontWeight:700 }}>
                    🏆 {dailyChallenge.xp_reward} XP
                  </span>
                </div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'var(--text-heading)', margin:'0 0 8px' }}>{dailyChallenge.title}</h3>
                <p style={{ fontSize:12.5, color:'var(--text-muted)', margin:0, lineHeight:1.5 }}>
                  {dailyChallenge.description?.length > 120
                    ? `${dailyChallenge.description.substring(0, 120)}...`
                    : dailyChallenge.description}
                </p>
              </div>

              <QuestCountdown />

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <Link to={`/challenges/${dailyChallenge.id}`} onClick={() => setShowQuestPopup(false)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    padding:'14px', borderRadius:12, background:'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none',
                    boxShadow:'0 6px 20px rgba(99,102,241,0.25)', cursor:'pointer' }}>
                  Accept Quest ⚔️
                </Link>
                <button onClick={() => setShowQuestPopup(false)}
                  style={{ background:'transparent', border:'none', color:'var(--text-muted)',
                    fontSize:13, fontWeight:600, padding:'8px', cursor:'pointer', outline:'none' }}>
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#6366f1" />
      <PageTour
        steps={CHALLENGES_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#6366f1"
      />
    </PageWrapper>
  )
}

/* ─── QuestCountdown ─────────────────────────────────────────────────── */
function QuestCountdown() {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const now      = new Date()
      const endOfDay = new Date(); endOfDay.setHours(23,59,59,999)
      const diff     = endOfDay - now
      if (diff <= 0) { setTimeLeft('00h 00m 00s'); return }
      const hrs  = Math.floor(diff / 3600000).toString().padStart(2,'0')
      const mins = Math.floor((diff / 60000) % 60).toString().padStart(2,'0')
      const secs = Math.floor((diff / 1000) % 60).toString().padStart(2,'0')
      setTimeLeft(`${hrs}h ${mins}m ${secs}s`)
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ fontSize:13, fontWeight:700, color:'#f43f5e', display:'flex',
      alignItems:'center', justifyContent:'center', gap:6, marginBottom:20 }}>
      <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%',
        background:'#f43f5e', animation:'pulse 1.2s infinite' }} />
      Quest expires in: {timeLeft}
    </div>
  )
}
