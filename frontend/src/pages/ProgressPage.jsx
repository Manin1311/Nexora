import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Flame, Brain, Clock, TrendingUp, Download, ShieldCheck, Activity, Loader2
} from 'lucide-react'
import api from '@/services/api'
import { progressService } from '@/services/progressService'
import { useAuth } from '@/context/AuthContext'
import { downloadCertificatePDF } from '@/utils/certificatePDF'
import PageWrapper from '@/components/layout/PageWrapper'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'
import { useCachedFetch } from '@/hooks/useCachedFetch'
import SkeletonBlock from '@/components/ui/SkeletonBlock'

const PROGRESS_TOUR_STEPS = [
  {
    target: 'progress-header',
    title: '📈 Progress & Analytics',
    description: 'Track your total developer XP, rank progression, streak counters, and GitHub activity overview.',
    color: '#34d399',
    placement: 'bottom',
  },
  {
    target: 'progress-rank',
    title: '👑 Dev Rank Badge',
    description: 'Earn XP by solving challenges and completing mock interviews to level up from Explorer to Legend rank.',
    color: '#fbbf24',
    placement: 'bottom',
  },
]

const S = {
  card: {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid var(--card-border)',
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

const RANK_META = {
  explorer:  { label:'Explorer',  icon:'🧭', color:'#38bdf8', accent:'#0284c7', next:'Builder',   nextXp:500   },
  builder:   { label:'Builder',   icon:'🔨', color:'#34d399', accent:'#059669', next:'Creator',   nextXp:2000  },
  creator:   { label:'Creator',   icon:'🎨', color:'#60a5fa', accent:'#2563eb', next:'Architect', nextXp:5000  },
  architect: { label:'Architect', icon:'🏛️', color:'#c084fc', accent:'#7c3aed', next:'Legend',    nextXp:15000 },
  legend:    { label:'Legend',    icon:'👑', color:'#fbbf24', accent:'#d97706', next:null,         nextXp:null  },
}

const ACTIVITY_ICONS = {
  challenge_completed: '⚔️',
  interview_completed: '🧪',
  project_added:       '🚀',
  rank_up:             '🏆',
  achievement_earned:  '⭐',
  streak_milestone:    '🔥',
}

const TABS = ['overview','activity','achievements','certificates']
const TAB_ICONS = { overview:'📊', activity:'⏱️', achievements:'⭐', certificates:'🏅' }

const stagger = {
  container: { hidden:{}, show:{ transition:{ staggerChildren:0.06 } } },
  item: { hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0, transition:{ duration:0.35 } } },
}

export default function ProgressPage() {
  const { user } = useAuth()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('progress')
  const [activeTab, setActiveTab] = useState('overview')

  const { data: summary,      loading: l1 } = useCachedFetch('progress-summary',       () => progressService.getSummary(),      null)
  const { data: activitiesRaw,loading: l2 } = useCachedFetch('progress-activity',      () => progressService.getActivity(),     [])
  const { data: achievementsRaw,loading:l3} = useCachedFetch('progress-achievements',  () => progressService.getAchievements(), [])
  const { data: certificatesRaw,loading:l4} = useCachedFetch('progress-certificates',  () => progressService.getCertificates(), [])

  const loading       = l1 || l2 || l3 || l4
  const activities    = activitiesRaw?.results   || activitiesRaw   || []
  const achievements  = achievementsRaw?.results || achievementsRaw || []
  const certificates  = certificatesRaw?.results || certificatesRaw || []

  // Derive rank/xp from user profile immediately (no wait needed) — API refines these once loaded
  const rank     = summary?.rank || user?.profile?.dev_rank || 'explorer'
  const xp       = summary?.xp  || user?.profile?.total_xp  || 0
  const rankMeta = RANK_META[rank] || RANK_META.explorer
  const rankPct  = summary?.rank_progress || 0
  const streak   = summary?.streak_days || user?.profile?.streak_days || 0

  const tabCounts = {
    overview: '', activity: activities.length, achievements: achievements.length, certificates: certificates.length,
  }

  return (
    <PageWrapper noPadding>
      <div className="container" style={{ paddingTop:24, paddingBottom:64, position: 'relative' }}>

        {/* Futuristic Grid & Ambient Nebula Mesh */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.25, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: -150, right: '15%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${rankMeta.accent}16 0%, transparent 70%)`, filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 100, left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header */}
        <div data-tour="progress-header" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <TrendingUp size={16} style={{ color: rankMeta.color }} />
              <span style={{ color: rankMeta.color, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em' }}>
                Progress Workspace
              </span>
            </div>
            <h1 style={{ fontSize:'clamp(26px, 3.8vw, 36px)', fontWeight:950, color:'var(--text-heading)', letterSpacing:'-0.03em', margin: 0 }}>
              Your career <span className="gradient-text">growth story.</span>
            </h1>
          </motion.div>

        {/* ── DIGITAL ID & RANK HERO BLOCK (Digital VIP Card) ── */}
        <motion.div 
          data-tour="progress-rank"
          initial={{ opacity:0, y:20 }} 
          animate={{ opacity:1, y:0 }} 
          transition={{ delay:0.05 }} 
          style={{ marginBottom:24 }}
        >
          <div style={{ 
            ...S.card, 
            padding: 32, 
            background: `linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), radial-gradient(circle at 80% 20%, ${rankMeta.accent}15, transparent 60%)`,
            border: `1px solid ${rankMeta.color}35`,
            boxShadow: `0 10px 40px ${rankMeta.accent}12`
          }}>
            {/* Holographic Glowing Line */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${rankMeta.color},transparent)` }} />
            {/* Giant watermark icon in background */}
            <div style={{ position:'absolute', right:-15, top:-15, fontSize:150, opacity:0.04, userSelect:'none', pointerEvents:'none' }}>
              {rankMeta.icon}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent: 'space-between', gap:28, flexWrap:'wrap', position:'relative', zIndex:2 }}>
              
              {/* Badge Icon and Name info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ 
                  width:80, height:80, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:44,
                  background:`linear-gradient(135deg, ${rankMeta.accent}22, ${rankMeta.color}11)`, 
                  border:`2px solid ${rankMeta.color}45`,
                  boxShadow: `0 8px 24px ${rankMeta.accent}25`
                }}>
                  {rankMeta.icon}
                </div>
                
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, background: `${rankMeta.color}12`, color: rankMeta.color, border: `1px solid ${rankMeta.color}33`, padding: '2px 8px', borderRadius: 20, fontWeight: 800, textTransform: 'uppercase' }}>
                      Active Rank
                    </span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#818cf8', background:'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                      ⚡ <AnimatedCounter value={xp} /> Cumulative XP
                    </span>
                  </div>
                  <h2 style={{ fontSize: 32, fontWeight: 950, color: 'var(--text-heading)', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
                    {rankMeta.label}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    {rankMeta.next ? `${(rankMeta.nextXp - xp).toLocaleString()} XP to rank up to ${rankMeta.next}` : "You have achieved ultimate rank legend status! 👑"}
                  </p>
                </div>
              </div>

              {/* Progress tracker bar */}
              {rankMeta.next && (
                <div style={{ flex: 1, minWidth: 260, maxWidth: 360 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>
                    <span style={{ fontWeight: 600 }}>Path to {rankMeta.next}</span>
                    <span style={{ color: rankMeta.color, fontWeight: 800 }}>{rankPct}%</span>
                  </div>
                  <div style={{ height:8, borderRadius:20, background:'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', overflow:'hidden' }}>
                    <motion.div 
                      initial={{ width:0 }} 
                      animate={{ width:`${rankPct}%` }} 
                      transition={{ duration:1.2, ease:'easeOut' }}
                      style={{ height:'100%', borderRadius:20, background:`linear-gradient(90deg, ${rankMeta.accent}, ${rankMeta.color})` }} 
                    />
                  </div>
                </div>
              )}

              {/* Streak box */}
              <div style={{ 
                textAlign:'center', padding:'16px 24px', borderRadius:16, 
                background:'rgba(255,255,255,0.01)', border:'1px solid var(--glass-border)', 
                flexShrink:0, display: 'flex', flexDirection: 'column', alignItems: 'center' 
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <Flame size={20} style={{ color:'#fbbf24', fill:'#fbbf24' }} />
                  <span style={{ fontSize:32, fontWeight:950, color:'var(--text-heading)', letterSpacing: '-0.02em' }}>
                    <AnimatedCounter value={streak} />
                  </span>
                </div>
                <p style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight: 800, margin: 0 }}>
                  Day Streak
                </p>
              </div>

            </div>
          </div>
        </motion.div>

        {/* ── INTERACTIVE GLASS METRIC NODES (Stats Grid) ── */}
        <motion.div 
          variants={stagger.container} initial="hidden" animate="show"
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:28 }}
        >
          {[
            { icon:'⚔️', label:'Challenges Completed', value:summary?.challenges_completed||0, trend:'Problems Solved', color:'#818cf8', accent:'#6366f1' },
            { icon:'🧪', label:'Mock Loop Sessions',  value:summary?.interviews_completed||0, trend:'Evaluations Run', color:'#c084fc', accent:'#7c3aed' },
            { icon:'🚀', label:'Showcase Projects',    value:summary?.projects_count||0,       trend:'Deployed Stacks',  color:'#34d399', accent:'#059669' },
            { icon:'⭐', label:'Achievements Earned', value:summary?.achievements_count||0,   trend:'Trophies Unlocked', color:'#fbbf24', accent:'#fbbf24' },
          ].map((stat, i) => (
            <motion.div key={i} variants={stagger.item}>
              <div style={{ 
                ...S.card, 
                padding:20, 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                border: '1px solid var(--glass-border)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = `${stat.color}45`
                e.currentTarget.style.boxShadow = `0 8px 24px ${stat.accent}10`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--glass-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                <div style={{ position:'absolute', top:0, left:'25%', right:'25%', height:1, background:`linear-gradient(90deg,transparent,${stat.color},transparent)` }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{stat.icon}</span>
                  <span style={{ fontSize: 10, background: `${stat.color}10`, color: stat.color, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    {stat.trend}
                  </span>
                </div>

                <div style={{ fontSize:32, fontWeight:900, color:'var(--text-heading)', marginBottom:4, letterSpacing: '-0.03em' }}>
                  <AnimatedCounter value={stat.value} />
                </div>
                
                <p style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dynamic floating Tab Pill bar */}
        <div style={{ 
          display:'inline-flex', gap:6, marginBottom:28, padding:'6px', borderRadius:16, 
          background:'var(--glass-bg)', border:'1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ 
                  display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:12, 
                  fontSize:13, fontWeight:750, cursor:'pointer', outline:'none', border:'none', 
                  transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', textTransform:'capitalize',
                  background: isActive ? `linear-gradient(135deg, ${rankMeta.accent}, ${rankMeta.color})` : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-color)',
                  boxShadow: isActive ? `0 4px 12px ${rankMeta.accent}28` : 'none',
                }}
              >
                <span>{TAB_ICONS[tab]}</span>
                <span>{tab}</span>
                {tabCounts[tab] > 0 && (
                  <span style={{ 
                    fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:20, 
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--glass-border)', 
                    color: isActive ? '#fff' : 'var(--text-muted)' 
                  }}>
                    {tabCounts[tab]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content Display workspace */}
        <AnimatePresence mode="wait">
          {/* OVERVIEW (INTERACTIVE TIMELINE STREAM) */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div style={{ ...S.card, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-heading)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} style={{ color: rankMeta.color }} /> Recent Activity Timeline
                </h3>
                
                <div style={{ display:'flex', flexDirection:'column', gap:0, position: 'relative' }}>
                  {/* Vertical thread line */}
                  {activities.length > 1 && (
                    <div style={{ position: 'absolute', left: 20, top: 12, bottom: 12, width: 2, background: 'var(--glass-border)' }} />
                  )}

                  {activities.slice(0, 8).length === 0 ? (
                    <div style={{ padding:'40px 0', textAlign:'center' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
                      <p style={{ color:'var(--text-muted)', fontSize:14, fontWeight: 600 }}>No activities logged. Work on roadmap challenges to populate this feed!</p>
                    </div>
                  ) : activities.slice(0, 8).map((act, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity:0, x:-12 }} 
                      animate={{ opacity:1, x:0 }} 
                      transition={{ delay:i*0.04 }}
                      style={{ display: 'flex', gap: 16, padding: '12px 0', position: 'relative', zIndex: 2 }}
                    >
                      {/* Timeline node */}
                      <div style={{ 
                        width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, 
                        background:'var(--card-bg)', border:'1px solid var(--card-border)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                      }}>
                        {ACTIVITY_ICONS[act.activity_type] || '📌'}
                      </div>
                      
                      {/* Timeline event block */}
                      <div style={{ 
                        flex:1, minWidth:0, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                      }}>
                        <div>
                          <p style={{ fontSize:13, fontWeight:750, color:'var(--text-heading)', margin: '0 0 2px' }}>
                            {act.description}
                          </p>
                          <span style={{ fontSize:10, color:'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} /> {new Date(act.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        
                        {act.xp_earned > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, color: rankMeta.color, fontWeight:800, fontSize:13 }}>
                            <Zap size={12} /> +{act.xp_earned} XP
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}



          {/* ACTIVITY (TIMELINE STREAM - FULL HISTORICAL VIEW) */}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div style={{ ...S.card, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-heading)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} style={{ color: rankMeta.color }} /> Full Activity Feed
                </h3>
                
                <div style={{ display:'flex', flexDirection:'column', gap:0, position: 'relative' }}>
                  {activities.length > 1 && (
                    <div style={{ position: 'absolute', left: 20, top: 12, bottom: 12, width: 2, background: 'var(--glass-border)' }} />
                  )}

                  {activities.length === 0 ? (
                    <div style={{ padding:'40px 0', textAlign:'center' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>⏱️</div>
                      <p style={{ color:'var(--text-muted)', fontSize:14, fontWeight:600 }}>No full activity logs recorded yet.</p>
                    </div>
                  ) : activities.map((act, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', position: 'relative', zIndex: 2 }}>
                      <div style={{ 
                        width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, 
                        background:'var(--card-bg)', border:'1px solid var(--card-border)' 
                      }}>
                        {ACTIVITY_ICONS[act.activity_type] || '📌'}
                      </div>
                      
                      <div style={{ 
                        flex:1, minWidth:0, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                      }}>
                        <div>
                          <p style={{ fontSize:13, fontWeight:750, color:'var(--text-heading)', margin: '0 0 2px' }}>
                            {act.description}
                          </p>
                          <span style={{ fontSize:10, color:'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} /> {new Date(act.created_at).toLocaleString()}
                          </span>
                        </div>
                        {act.xp_earned > 0 && (
                          <span style={{ display:'flex', alignItems:'center', gap:4, color: rankMeta.color, fontWeight:800, fontSize:13 }}>
                            <Zap size={11} /> +{act.xp_earned} XP
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ACHIEVEMENTS (HOLOGRAPHIC TROPHY MEDAL ROOM) */}
          {activeTab === 'achievements' && (
            <motion.div 
              key="achievements" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:16 }}
            >
              {achievements.length === 0 ? (
                <div style={{ gridColumn:'1/-1', ...S.card, padding:48, textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:14 }}>🏆</div>
                  <p style={{ color:'var(--text-muted)', fontSize:14, fontWeight: 600 }}>Solve challenging problems to unlock unique trophies and certifications!</p>
                </div>
              ) : achievements.map((ua, i) => (
                <div 
                  key={i} 
                  style={{ 
                    ...S.card, 
                    padding:22,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                    border: '1px solid var(--glass-border)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(251,191,36,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ position:'absolute', top:0, left:'25%', right:'25%', height:1, background:'linear-gradient(90deg,transparent,#fbbf24,transparent)' }} />
                  
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <div style={{ 
                      width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, 
                      background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)' 
                    }}>
                      ⭐
                    </div>
                    
                    <div>
                      <h4 style={{ fontSize:14, fontWeight:800, color:'var(--text-heading)', margin: '0 0 4px' }}>
                        {ua.achievement.name}
                      </h4>
                      <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5, marginBottom:10 }}>
                        {ua.achievement.description}
                      </p>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:850, color:'#fbbf24', background: 'rgba(251,191,36,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                        <Zap size={10} /> +{ua.achievement.xp_reward} XP
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* CERTIFICATES (AUTHENTICATED GOLD FOIL DIPLOMAS) */}
          {activeTab === 'certificates' && (
            <motion.div 
              key="certificates" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:16 }}
            >
              {certificates.length === 0 ? (
                <div style={{ gridColumn:'1/-1', ...S.card, padding:48, textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:14 }}>🏅</div>
                  <p style={{ color:'var(--text-muted)', fontSize:14, fontWeight: 600 }}>Solve hard difficulty loops to earn verified Nexora certificates!</p>
                </div>
              ) : certificates.map((cert, i) => {
                const scoreMatch = (cert.description || '').match(/with a score of (\d+)\/100/)
                const score = scoreMatch ? scoreMatch[1] : '100'

                return (
                  <div 
                    key={i} 
                    style={{ 
                      ...S.card, 
                      padding: 24, 
                      border: '1px solid rgba(251,191,36,0.22)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      minHeight: 200,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(251,191,36,0.08)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#fbbf24,transparent)' }} />
                    
                    <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                      <div style={{ 
                        width:54, height:54, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, flexShrink:0, 
                        background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.25)', boxShadow: '0 4px 12px rgba(251,191,36,0.1)' 
                      }}>
                        🏅
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 9, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '1px 6px', borderRadius: 20, fontWeight: 800 }}>
                            Nexora Certified
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#10b981', fontWeight: 800 }}>
                            <ShieldCheck size={10} /> Verified
                          </span>
                        </div>
                        <h4 style={{ fontSize:15, fontWeight:900, color:'var(--text-heading)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                          {cert.title}
                        </h4>
                        <p style={{ fontSize:12, color:'var(--text-color)', marginBottom:0, lineHeight:1.6, fontWeight: 500 }}>
                          {cert.description}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display:'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>ID: {cert.certificate_id}</span>
                        <span style={{ fontSize:10, color:'var(--text-muted)' }}>Issued: {new Date(cert.issued_at).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' })}</span>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => downloadCertificatePDF({
                          name: user?.full_name || user?.name || user?.username,
                          title: cert.challenge_title || cert.title,
                          score: score,
                          id: cert.certificate_id,
                          date: cert.issued_at
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#0f172a',
                          background: '#fbbf24',
                          border: 'none',
                          cursor: 'pointer',
                          outline: 'none',
                          boxShadow: '0 4px 14px rgba(251,191,38,0.25)'
                        }}
                      >
                        <Download size={13} /> PDF
                      </motion.button>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        </div>

        {/* Responsive viewports */}
        <style>{`
          @media (max-width: 640px) {
            .workspace-container { flex-direction: column !important; }
          }
        `}</style>
      </div>

      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#34d399" />
      <PageTour
        steps={PROGRESS_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#34d399"
      />
    </PageWrapper>
  )
}
