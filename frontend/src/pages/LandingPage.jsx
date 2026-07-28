import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Zap, Trophy, Code2, Brain, Rocket,
  Clock, ChevronRight, Flame, TrendingUp, Play, CheckCircle,
  Lock, Swords, FlaskConical, Bot, Palette, Star, MessageSquare,
  BarChart2, CheckSquare, Send, BookOpen, Layers,
  ShieldCheck, HelpCircle, ChevronDown, Sparkles, Users
} from 'lucide-react'
import { challengeService } from '@/services/challengeService'
import { authService } from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import Avatar from '@/components/ui/Avatar'
import AnimatedCounter from '@/components/ui/AnimatedCounter'

const Github = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
)

/* ── Framer Motion Animations ── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

/* ── Data Configs ── */
const TRUSTED_LOGOS = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Adobe', 'Spotify', 'GitHub']

const FEATURES = [
  { icon: Code2,        title: 'Coding Challenges Hub',   desc: 'Category-wise coding problems (Easy, Medium, Hard) with instant AI evaluation, Big-O complexity analysis, and XP rewards.', link: '/challenges', badge: 'Interactive', accent: '#6366f1' },
  { icon: Brain,        title: 'AI Mock Interview Lab',   desc: 'Simulate Technical, HR, Rapid Fire, and Boardroom interviews with real-time speech recognition, WPM tracking, and webcam biometrics.', link: '/interview',  badge: '5 Modes',    accent: '#10b981' },
  { icon: Bot,          title: 'Dev Mentor & Matcher',    desc: 'Persistent AI mentor chatbot powered by Groq LLaMA 3.3 70B that answers technical queries and matches you with career opportunities.', link: '/mentor',     badge: 'LLaMA 3.3 70B', accent: '#f472b6' },
  { icon: ShieldCheck,  title: 'AI Code Review & Scan',   desc: 'Connect your GitHub repository to get automated AI code health analysis, security vulnerability scanning, and refactoring tips.', link: '/codereview', badge: 'Health Scan', accent: '#fb923c' },
  { icon: Layers,       title: 'AI Learning Roadmaps',    desc: 'Personalized week-by-week learning paths generated for 7 career tracks (FAANG SWE, Frontend, Backend, Full Stack, DevOps, ML, Product).', link: '/roadmap',    badge: '7 Tracks',   accent: '#d946ef' },
  { icon: Users,        title: 'Peer Review Network',     desc: 'Community marketplace to share code snippets, showcase projects, and get line-by-line feedback and upvotes from fellow devs.', link: '/peer-review', badge: 'Community',  accent: '#38bdf8' },
  { icon: Swords,       title: 'Code Arena 1v1 Battles',  desc: 'Real-time competitive 1v1 coding races powered by WebSockets. Solve challenges head-to-head live against other developers.', link: '/arena',       badge: 'Real-time WS', accent: '#f43f5e' },
  { icon: BookOpen,     title: 'Resume Hub & ATS Analyzer', desc: 'Full 6-section resume builder with AI ATS score analyzer targeting specific job roles, plus one-click PDF export.', link: '/resume',      badge: 'ATS Analyzer', accent: '#06b6d4' },
  { icon: Sparkles,     title: 'Revision Hub & Prep Map', desc: 'AI-generated study guides for any CS topic structured in a 4-round learning system (Learn → Apply → Reinforce → Master).', link: '/revision',   badge: '4-Round Prep', accent: '#a855f7' },
  { icon: Trophy,       title: 'Progress & PDF Certs',    desc: 'Gamified rank progression from Explorer to Legend, streak tracking, achievement badges, and verifiable PDF certificates.', link: '/progress',   badge: 'Verifiable PDF', accent: '#f59e0b' },
]

const STEPS = [
  { num: '01', title: 'Create Account & Profile', desc: 'Sign up in seconds and initialize your AI developer profile.' },
  { num: '02', title: 'Solve Coding Challenges', desc: 'Practice categorized problems with instant AI code evaluation & Big-O complexity analysis.' },
  { num: '03', title: 'Practice Mock Interviews', desc: 'Train in interactive Technical, HR, or Boardroom speech & vision interview labs.' },
  { num: '04', title: 'Follow AI Roadmaps', desc: 'Get personalized week-by-week learning paths generated for your career track.' },
  { num: '05', title: 'Build & Peer Review', desc: 'Showcase projects in your portfolio and get line-by-line feedback from fellow developers.' },
  { num: '06', title: 'Compete in Code Arena', desc: 'Battle 1v1 in real-time WebSocket coding challenges against other developers.' },
  { num: '07', title: 'Earn XP, Rank Up & Certify', desc: 'Level up from Explorer to Legend rank and download verifiable PDF certificates.' },
]

const ROADMAP_DATA = {
  'Frontend': [
    { week: 'W1', title: 'Modern React & Vite Layouts', status: 'completed' },
    { week: 'W2', title: 'State Architecture & Context API', status: 'completed' },
    { week: 'W3', title: 'TailwindCSS 4 Responsive Engines', status: 'active' },
    { week: 'W4', title: 'Framer Motion Micro-Animations', status: 'locked' },
  ],
  'Backend': [
    { week: 'W1', title: 'Django REST API Framework Core', status: 'completed' },
    { week: 'W2', title: 'PostgreSQL Database Integration', status: 'active' },
    { week: 'W3', title: 'Celery Parallel Queue Handlers', status: 'locked' },
    { week: 'W4', title: 'JWT Authentication Credentials', status: 'locked' },
  ],
  'System Design': [
    { week: 'W1', title: 'Load Balancing & Redundancy', status: 'completed' },
    { week: 'W2', title: 'Database Sharding & Caching Layers', status: 'completed' },
    { week: 'W3', title: 'Microservices Communication', status: 'active' },
    { week: 'W4', title: 'Event-Driven Message Brokers', status: 'locked' },
  ]
}

const FAQS = [
  { q: 'What models power the AI Mock Interview Lab?', a: 'The interview engine is powered by Groq LLaMA 3.3 70B for real-time sub-100ms conversational loops, with an automated fallback to Google Gemini (gemini-2.5-flash) for multi-modal webcam analytics.' },
  { q: 'Are the competency certificates verifiable?', a: 'Yes! Every certificate generated has a unique identifier (e.g. NXR-E3A5B876) stored in our database. Anyone can verify this certificate ID on Nexora.' },
  { q: 'Can I customize my learning roadmap?', a: 'Absolutely. You can request changes from your Dev Mentor at any time. The AI will evaluate your profile and modify your week-by-week roadmap syllabus automatically.' },
  { q: 'Is there a free plan?', a: 'Yes! You can sign up for free and access coding challenges, the AI mentor, and peer reviews without any cost. Premium features like PDF certificates and code arena battles are available to all registered users.' }
]

const TESTIMONIALS = [
  { name: 'Arjun Mehta',  role: 'Backend Engineer at Zomato',     text: 'Nexora transformed how I practice. The AI feedback is brutally honest and incredibly helpful. Went from Explorer to Creator in 3 months.',    rank: 'creator',   xp: 3420, rating: 5 },
  { name: 'Priya Sharma', role: 'Full Stack Dev at Razorpay',     text: "The daily challenges feel like real work, not textbook problems. Dev Mentor actually knows my progress and doesn't suggest what I've mastered.", rank: 'architect', xp: 8900, rating: 5 },
  { name: 'Rahul Verma',  role: 'SDE-2 at Flipkart',             text: 'After 60 days on Interview Lab, I cleared 4 rounds at Flipkart. The AI scoring with detailed feedback made all the difference.',              rank: 'builder',  xp: 1850, rating: 5 },
]

const RANK_ICON  = { legend:'👑', architect:'🏛️', creator:'🎨', builder:'🔨', explorer:'🧭' }
const RANK_COLOR = { legend:'#fbbf24', architect:'#a78bfa', creator:'#60a5fa', builder:'#34d399', explorer:'#94a3b8' }

/* ── Ambient Background Component ── */
function AmbientBackground() {
  const { theme } = useTheme()
  if (theme === 'light') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* In light mode, keep the grid subtle but omit the colored glowing blobs so it looks pure white */}
        <div className="grid-bg" style={{ position:'absolute', inset:0, opacity:0.25 }} />
      </div>
    )
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Blurred Blobs */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', filter:'blur(150px)', opacity:0.15, background:'radial-gradient(circle, #6366f1, transparent 70%)', top:-200, left:-150 }} />
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', filter:'blur(150px)', opacity:0.12, background:'radial-gradient(circle, #8b5cf6, transparent 70%)', top:'25%', right:-100 }} />
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', filter:'blur(130px)', opacity:0.1, background:'radial-gradient(circle, #06b6d4, transparent 70%)', bottom:'15%', left:'10%' }} />
      <div style={{ position:'absolute', width:450, height:450, borderRadius:'50%', filter:'blur(140px)', opacity:0.08, background:'radial-gradient(circle, #f43f5e, transparent 70%)', bottom:-100, right:'15%' }} />
      <div className="grid-bg" style={{ position:'absolute', inset:0, opacity:0.5 }} />
    </div>
  )
}

/* ── Interactive Daily Challenge (Dynamic) ── */
function DailyChallenge() {
  const [challenge, setChallenge] = useState(null)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    challengeService.getDaily()
      .then(r => setChallenge(r.data))
      .catch(() => setChallenge({
        id:1, title:'Build a JWT Authentication API', difficulty:'medium',
        xp_reward:200, topic:{ name:'Backend', icon:'⚙️' }, estimated_time:'45 min',
      }))
  }, [])

  const diffStyle = challenge?.difficulty === 'easy'
    ? { color:'#34d399', background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.3)' }
    : challenge?.difficulty === 'hard'
    ? { color:'#fb7185', background:'rgba(251,113,133,0.12)', border:'1px solid rgba(251,113,133,0.3)' }
    : { color:'#fbbf24', background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.3)' }

  return (
    <section className="section" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:12 }}>
            <Flame size={18} style={{ color:'#fbbf24' }} />
            <span style={{ color:'#fbbf24', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em' }}>Daily Focus</span>
          </div>
          <h2 style={{ fontSize:'clamp(28px,4vw,38px)', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em', fontFamily: 'var(--font-display)' }}>
            Today's Skill Arena Challenge
          </h2>
        </motion.div>

        {challenge && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
            style={{ maxWidth:620, margin:'0 auto' }}>
            <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding:32, boxShadow: 'var(--glass-shadow)', position: 'relative' }}>
              <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.2),transparent)' }} />

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:24 }}>
                <div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                    <span style={{ ...diffStyle, padding:'4px 12px', borderRadius:8, fontSize:11, fontWeight:700, textTransform:'uppercase' }}>
                      {challenge.difficulty}
                    </span>
                    {challenge.topic && (
                      <span style={{ padding:'4px 12px', borderRadius:8, fontSize:11, fontWeight:600, background:'rgba(99,102,241,0.08)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.18)' }}>
                        {challenge.topic.icon} {challenge.topic.name}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize:22, fontWeight:800, color:'var(--text-heading)', lineHeight:1.3 }}>{challenge.title}</h3>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'#818cf8', fontWeight:800, fontSize:22, marginBottom:4 }}>
                    <Zap size={16} fill="#818cf8" />{challenge.xp_reward} XP
                  </div>
                  {challenge.estimated_time && (
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-muted)' }}>
                      <Clock size={12} />{challenge.estimated_time}
                    </div>
                  )}
                </div>
              </div>

              <Link to={isAuthenticated ? `/challenges/${challenge.id}` : '/login'}>
                <motion.div whileHover={{ scale:1.02, y: -1 }} whileTap={{ scale:0.98 }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 0', borderRadius:14, background:'#111111', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                  {isAuthenticated ? 'Accept Challenge & Start Editor' : 'Sign In to Accept Challenge'} <ArrowRight size={15} />
                </motion.div>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

/* ── Hero & Floating Dashboard ── */
function Hero() {
  const { theme } = useTheme()
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setRotateX(-(y / (rect.height / 2)) * 6)
    setRotateY((x / (rect.width / 2)) * 6)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '140px 24px 80px', zIndex: 1 }}>
      <AmbientBackground />

      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:1000, width:'100%', margin:'0 auto' }}>
        {/* Floating badge */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:100, fontSize:13, fontWeight:500, marginBottom:28, background:'var(--glass-bg)', border:'1px solid var(--glass-border)', backdropFilter:'blur(12px)', color:'var(--text-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Sparkles size={14} style={{ color:'#8b5cf6' }} />
            The Developer Growth Ecosystem
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#34d399', animation:'pulse 2s infinite' }} />
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }}
          style={{ fontSize:'clamp(42px, 6.5vw, 84px)', fontWeight:600, lineHeight:1.05, letterSpacing:'-0.03em', marginBottom:28, fontFamily: 'var(--font-display)', color: 'var(--text-heading)' }}>
          Accelerate your <span className="gradient-text animate-gradient-x">developer career</span><br />
          with an AI mentor that reads your code.
        </motion.h1>

        {/* Description */}
        <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
          style={{ fontSize:18, color:'var(--text-muted)', maxWidth:720, margin:'0 auto 40px', lineHeight:1.8 }}>
          Nexora combines deep GitHub code reviews, personalized AI roadmaps, interactive learning, mock interviews, and competency certifications into one intelligent platform that helps developers continuously grow.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.3 }}
          style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:16, marginBottom:64 }}>
          <Link to="/register">
            <motion.div whileHover={{ scale:1.04, y:-2, boxShadow:'0 10px 30px rgba(0,0,0,0.25)' }} whileTap={{ scale:0.97 }}
              style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 36px', borderRadius:9999, background:'#111111', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              Start Free <ArrowRight size={16} />
            </motion.div>
          </Link>
          <a href="#how-it-works" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <motion.div whileHover={{ scale:1.04, y:-2, background: 'rgba(99,102,241,0.06)' }} whileTap={{ scale:0.97 }}
              style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 32px', borderRadius:9999, background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--text-heading)', fontWeight:600, fontSize:15, cursor:'pointer', backdropFilter:'blur(12px)' }}>
              See how it works
            </motion.div>
          </a>
        </motion.div>

        {/* Floating Premium Dashboard Mockup (Tilted along the cursor) */}
        <motion.div 
          initial={{ opacity:0, y:40, scale:0.97 }} 
          animate={{ opacity:1, y:0, scale:1 }} 
          transition={{ duration:0.8, delay:0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
            display: 'block', 
            width: '100%', 
            maxWidth: '1000px', 
            margin: '0 auto', 
            position: 'relative',
          }}>
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              width: '100%',
              background: 'var(--card-bg, rgba(18,18,28,0.85))',
              border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
              borderRadius: '24px',
              padding: 6,
              backdropFilter: 'blur(30px)',
              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.4), 0 0 40px rgba(108,99,255,0.1)',
              position: 'relative',
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
              transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
              transformStyle: 'preserve-3d',
              cursor: 'default',
            }}
          >
          
          {/* Header Bar */}
          <div style={{ height: '36px', display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: '24px', opacity: 0.9, fontFamily: 'monospace' }}>nexora-app.internal // AI Developer Growth Workspace</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', minHeight: '480px' }}>
            {/* Sidebar Mock */}
            <div style={{ borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, paddingTop: 24, background: 'rgba(0,0,0,0.15)' }}>
              {[Rocket, Code2, Brain, Bot, Layers, ShieldCheck, MessageSquare].map((Icon, idx) => (
                <div key={idx} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: idx === 0 ? 'rgba(108,99,255,0.2)' : 'transparent', border: idx === 0 ? '1px solid rgba(108,99,255,0.4)' : 'none', color: idx === 0 ? '#a78bfa' : 'var(--text-muted)' }}>
                  <Icon size={18} />
                </div>
              ))}
            </div>

            {/* Dashboard Content Mock */}
            <div style={{ padding: '24px', textAlign: 'left', display: 'grid', gridTemplateRows: 'auto 1fr', gap: '20px' }}>
              {/* Row 1: Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)' }}>Welcome back, Developer 👋</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Your AI Memory Engine is actively tracking 10 core modules across your growth journey.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(108,99,255,0.12)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(108,99,255,0.3)' }}>
                    <Zap size={14} style={{ color: '#a78bfa' }} fill="#a78bfa" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>1,850 XP</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,146,60,0.12)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(251,146,60,0.3)' }}>
                    <Flame size={14} style={{ color: '#fb923c' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>7 Days Streak</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,0.12)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <Trophy size={14} style={{ color: '#34d399' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Architect Rank</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Grid widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>

                {/* Widget 1: AI Mock Interview Lab */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>🎤 Interview Lab</p>
                      <span style={{ fontSize: '10px', background: 'rgba(52,211,153,0.15)', color: '#34d399', padding: '2px 7px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.3)' }}>● AI Active</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Technical System Design</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Webcam &amp; Speech Biometrics</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: 8 }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Eye Contact</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>98% Excellent</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: 8 }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Posture</span>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>95% Upright</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Pace: <strong>135 WPM</strong></span>
                    <span>Fillers: <strong style={{ color: '#34d399' }}>0</strong></span>
                  </div>
                </div>

                {/* Widget 2: Coding Challenges & Big-O */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>⚔️ Challenge Hub</p>
                      <span style={{ fontSize: '10px', background: 'rgba(108,99,255,0.2)', color: '#a78bfa', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>Score 95/100</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>JWT Authentication API</p>
                    <p style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 10 }}>+200 XP Awarded</p>
                    <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '8px', fontSize: 11 }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, marginBottom: 2 }}>Complexity Analysis (Big-O)</span>
                      <code style={{ color: '#a78bfa', fontFamily: 'monospace', fontWeight: 700 }}>Time: O(N log N) | Space: O(1)</code>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: 10, fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={12} /> Verified by AI Evaluator
                  </div>
                </div>

                {/* Widget 3: AI Code Review (GitHub Scanner) */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#fb923c', marginBottom: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>🔍 Code Health Scan</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '10px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'conic-gradient(#6c63ff 92%, rgba(108,99,255,0.1) 0%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f0f1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#fff' }}>92</div>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>Excellent Health</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scan time: 1.2s</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>React / Django Code</span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>88% Quality</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(108,99,255,0.15)', borderRadius: 2 }}>
                      <div style={{ width: '88%', height: '100%', background: 'linear-gradient(90deg, #6c63ff, #38bdf8)', borderRadius: 2 }} />
                    </div>
                  </div>
                </div>

                {/* Widget 4: AI Dev Mentor Chat */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#f472b6', letterSpacing: '0.05em', textTransform: 'uppercase' }}>🤖 AI Dev Mentor</p>
                      <span style={{ fontSize: '10px', background: 'rgba(244,114,182,0.15)', color: '#f472b6', padding: '2px 7px', borderRadius: '10px' }}>LLaMA 3.3 70B</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <strong style={{ color: '#a78bfa', display: 'block', marginBottom: 2 }}>Dev Mentor AI:</strong>
                      "Using <code style={{ color: '#38bdf8' }}>select_related()</code> reduced your Django query overhead from 51 DB hits down to 1."
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={12} style={{ color: '#f472b6' }} /> Multi-turn Persistent Memory
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Sparkles element */}
          <div style={{ position: 'absolute', top: -12, right: -12, width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          </div>
        </motion.div>

        {/* Below indicators */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 24, opacity: 0.8 }}>
          Trusted by thousands of developers preparing for top tech companies.
        </p>

      </div>
    </section>
  )
}

/* ── Trusted by Logos Strip ── */
function TrustedBy() {
  return (
    <section style={{ padding: '40px 24px', borderTop: '1px solid var(--nav-border)', borderBottom: '1px solid var(--nav-border)', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Trusted by developers preparing for</p>
        <div className="marquee-container">
          <div className="marquee-content">
            {/* Multiplied to ensure no blank spaces appear during marquee loop */}
            {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS, ...TRUSTED_LOGOS, ...TRUSTED_LOGOS, ...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((logo, idx) => (
              <span key={idx} style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', opacity: 0.9, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', cursor: 'default' }}>
                {logo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Interactive TiltCard Component ── */
function TiltCard({ children, accent, link, theme }) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [coords, setCoords] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    setCoords({ x: px, y: py })

    const rx = e.clientX - rect.left - rect.width / 2
    const ry = e.clientY - rect.top - rect.height / 2
    // Max tilt angles: 8 degrees X, 8 degrees Y
    setRotateX(-(ry / (rect.height / 2)) * 8)
    setRotateY((rx / (rect.width / 2)) * 8)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  // Soft light pastel background color and borders based on accent highlight
  const pastelBg = theme === 'dark' ? `${accent}0a` : `${accent}07`
  const borderCol = theme === 'dark' ? `${accent}25` : `${accent}20`

  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`,
          transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
          transformStyle: 'preserve-3d',
          height: '100%',
        }}
      >
        <div style={{
          background: pastelBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '20px',
          padding: '32px',
          height: '100%',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--glass-shadow)',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease',
        }}>
          {/* Dynamic cursor-following glow */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.18,
            background: `radial-gradient(circle 120px at ${coords.x}% ${coords.y}%, ${accent}, transparent)`,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
          }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {children}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

/* ── Six Grid Features Section ── */
function Features() {
  const { theme } = useTheme()
  return (
    <section id="features" className="section" style={{ position: 'relative', zIndex: 1, scrollMarginTop: '60px' }}>
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}>
          <span style={{ color:'#818cf8', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em', display:'block', marginBottom:12 }}>
            Platform Features
          </span>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em', marginBottom:16, fontFamily: 'var(--font-display)' }}>
            Everything you need to <span className="gradient-text">level up</span>
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:17, maxWidth:600, margin:'0 auto', lineHeight:1.75 }}>
            A comprehensive, AI-integrated developer ecosystem mapped around actual clean-coding, roadmap modules, and real interview simulation.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={fadeUp}>
              <TiltCard accent={f.accent} link={f.link} theme={theme}>
                <div>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
                    <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:`${f.accent}12`, border:`1px solid ${f.accent}25`, flexShrink:0 }}>
                      <f.icon size={22} style={{ color: f.accent }} />
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:8, background:'var(--glass-bg)', color:'var(--text-muted)', border:'1px solid var(--glass-border)' }}>
                      {f.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:10 }}>{f.title}</h3>
                  <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.75, marginBottom:20 }}>{f.desc}</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:700, color: f.accent }}>
                  Explore Component <ChevronRight size={13} />
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── How it Works Timeline ── */
function HowItWorks() {
  return (
    <section id="how-it-works" className="section" style={{ background: 'var(--section-alt-bg)', position: 'relative', zIndex: 1, scrollMarginTop: '60px' }}>
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}>
          <span style={{ color:'#818cf8', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em', display:'block', marginBottom:12 }}>
            Workflow Pipeline
          </span>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em', marginBottom:16, fontFamily: 'var(--font-display)' }}>
            The Developer Journey to Success
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:16, maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
            How Nexora transforms your raw commits into verifiable software competencies.
          </p>
        </motion.div>

        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          {/* Vertical connecting line */}
          <div style={{ position: 'absolute', left: '24px', top: '10px', bottom: '10px', width: '2px', background: 'linear-gradient(to bottom, #6366f1, #06b6d4, #f43f5e)', opacity: 0.4 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {STEPS.map((step, idx) => (
              <motion.div key={idx} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay: idx*0.06 }}
                style={{ display: 'flex', gap: 24, position: 'relative' }}>
                {/* Node icon/dot */}
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                  {step.num}
                </div>
                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px 24px', flex: 1, boxShadow: 'var(--glass-shadow)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

/* ── Dashboard Analytics Showcase ── */
function DashboardAnalytics() {
  const { theme } = useTheme()
  // Mock contributions
  const activity = Array.from({ length: 48 }).map((_, i) => ({
    val: Math.floor(Math.random() * 4),
    id: i
  }))

  return (
    <section className="section" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>
          
          {/* Left panel: contribution visualization */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ position: 'relative' }}>
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--glass-shadow)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px', marginBottom: '20px' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)' }}>Code Commits & Activity</span>
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Active Streak: 7 Days</span>
              </div>

              {/* Mock contribution grid */}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Weekly activity density:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 5, marginBottom: '20px' }}>
                {activity.map(act => {
                  const colors = theme === 'dark'
                    ? ['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.3)', 'rgba(99,102,241,0.6)', 'rgba(99,102,241,0.95)']
                    : ['rgba(99,102,241,0.06)', 'rgba(99,102,241,0.25)', 'rgba(99,102,241,0.5)', 'rgba(99,102,241,0.85)']
                  return (
                    <div key={act.id} style={{ height: 16, borderRadius: 3, background: colors[act.val] }} />
                  )
                })}
              </div>

              {/* Progress Level bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-heading)' }}>Level Progress (Builder Rank)</span>
                  <span style={{ color: '#818cf8' }}>800 / 1,000 XP</span>
                </div>
                <div style={{ height: 8, background: 'rgba(99,102,241,0.12)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '80%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                </div>
              </div>
            </div>
            
            {/* Background Glow */}
            <div style={{ position: 'absolute', inset: -30, background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1), transparent 70%)', pointerEvents: 'none', zIndex: -1 }} />
          </motion.div>

          {/* Right panel: text */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', marginBottom: 20 }}>
              <TrendingUp size={13} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stats & Insights</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.15, fontFamily: 'var(--font-display)' }}>
              Track every milestone in a <span className="gradient-text">single dashboard</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
              As you solve coding sandboxes, compile scripts, and complete mock interviews, Nexora aggregates all metrics. Track your contribution index, XP levels, and unlock rank tags from Explorer to Legend.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Verifiable level progression stats',
                'Visualizes commit frequency density ratios',
                'Automated AI insights summarizing skill deficits',
                'Direct link from accomplishments to shareable portfolio URL'
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'var(--text-color)' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

/* ── Interactive Roadmap Visualization ── */
function InteractiveRoadmap() {
  const [activeTrack, setActiveTrack] = useState('Frontend')

  return (
    <section id="roadmap" className="section" style={{ background: 'var(--section-alt-bg)', position: 'relative', zIndex: 1, scrollMarginTop: '60px' }}>
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ color:'#818cf8', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em', display:'block', marginBottom:12 }}>
            Syllabus Preview
          </span>
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em', marginBottom:16, fontFamily: 'var(--font-display)' }}>
            Interactive AI Roadmap Tracks
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:16, maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
            Preview curriculum tracks generated dynamically by Nexora's AI engines.
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {Object.keys(ROADMAP_DATA).map(trackName => (
            <button
              key={trackName}
              onClick={() => setActiveTrack(trackName)}
              style={{
                padding: '10px 22px',
                borderRadius: '9999px',
                border: activeTrack === trackName ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--glass-border)',
                background: activeTrack === trackName ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' : 'var(--glass-bg)',
                color: activeTrack === trackName ? 'var(--text-heading)' : 'var(--text-color)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeTrack === trackName ? '0 4px 12px rgba(99,102,241,0.15)' : 'none',
              }}
            >
              {trackName}
            </button>
          ))}
        </div>

        {/* Nodes map */}
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '40px 24px', boxShadow: 'var(--glass-shadow)', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', position: 'relative' }}>
            
            {ROADMAP_DATA[activeTrack].map((node, idx) => {
              const accentColor = node.status === 'completed' ? '#10b981' : node.status === 'active' ? '#6366f1' : 'var(--text-muted)'
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  
                  {/* Glow circle */}
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: node.status === 'completed' ? 'rgba(16,185,129,0.12)' : node.status === 'active' ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.06)',
                      border: `2px solid ${accentColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: node.status === 'locked' ? 'var(--text-muted)' : 'var(--text-heading)',
                      marginBottom: '16px',
                      boxShadow: node.status === 'active' ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
                      cursor: 'default',
                      position: 'relative',
                    }}
                  >
                    {node.status === 'completed' ? '✓' : node.week}
                    {node.status === 'active' && (
                      <span style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: '#6366f1', border: '2px solid #fff' }} />
                    )}
                  </motion.div>

                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '6px' }}>{node.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{node.status}</p>

                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}

/* ── Testimonials (Dynamic with Review Submission Modal) ── */
function Testimonials() {
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_user_reviews')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return TESTIMONIALS
  })

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    const newReview = {
      name: name.trim(),
      role: role.trim() || 'Software Developer',
      text: text.trim(),
      rank: 'builder',
      xp: 1500,
      rating: Number(rating) || 5
    }
    const updated = [newReview, ...reviews]
    setReviews(updated)
    try {
      localStorage.setItem('nexora_user_reviews', JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to save review to localStorage:', e)
    }
    setSubmitted(true)
    setTimeout(() => {
      setShowModal(false)
      setSubmitted(false)
      setName('')
      setRole('')
      setText('')
      setRating(5)
    }, 1200)
  }

  return (
    <section className="section" style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      <div style={{ maxWidth: '100vw', overflow: 'hidden' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ color:'#34d399', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em', display:'block', marginBottom:12 }}>
            Community Feedback
          </span>
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
            Developers Love Nexora
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: '9999px',
                background: '#000',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
              }}
            >
              ✍️ Write a Review
            </motion.button>
          </div>
        </motion.div>

        <div className="marquee-container">
          <div className="marquee-content-reverse">
            {[...reviews, ...reviews, ...reviews].map((t, idx) => (
              <div key={idx} style={{ flexShrink: 0, width: '360px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '32px', boxShadow: 'var(--glass-shadow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', whiteSpace: 'normal' }}>
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="#fbbf24" style={{ color: '#fbbf24' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 24 }}>"{t.text}"</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <Avatar name={t.name} rank={t.rank || 'builder'} size="sm" />
                  <div>
                    <p style={{ fontWeight: 800, color: 'var(--text-heading)', fontSize: 13 }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: 24
          }} onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 480, margin: '0 auto',
                background: 'var(--card-bg, #0f0f1c)',
                border: '1px solid var(--card-border, rgba(255,255,255,0.15))',
                borderRadius: 20, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)' }}>✍️ Share Your Feedback</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle size={48} style={{ color: '#34d399', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>Review Published!</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Thank you for your review. It is now live in the feedback carousel.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Chen"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Your Role / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer at TechCorp"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Rating</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                        >
                          <Star size={24} fill={star <= rating ? "#fbbf24" : "none"} style={{ color: star <= rating ? "#fbbf24" : "var(--text-muted)" }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Review *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Share your experience using Nexora's coding challenges, AI interviews, or roadmap modules..."
                      value={text}
                      onChange={e => setText(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12,
                      background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: 14, fontWeight: 800, cursor: 'pointer', marginTop: 8
                    }}
                  >
                    🚀 Submit Review
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ── Premium Pricing Cards ── */
function Pricing() {
  return (
    <section id="pricing" className="section" style={{ background: 'var(--section-alt-bg)', position: 'relative', zIndex: 1, scrollMarginTop: '60px' }}>
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}>
          <span style={{ color:'#818cf8', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em', display:'block', marginBottom:12 }}>
            Pricing Plans
          </span>
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em', marginBottom:16, fontFamily: 'var(--font-display)' }}>
            Transparent pricing for developers
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:16, maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
            Upgrade your progress speeds with a plan that fits your growth targets.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Card 1: Starter */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--glass-shadow)' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>Starter</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Perfect to test coding sandbox skills.</p>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-heading)' }}>$0</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>/ forever</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-color)', marginBottom: 32 }}>
                {['Basic coding challenges', '1 dynamic repository scan / week', '1 AI mock interview / week', 'Saves interview history'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/register">
              <button style={{ width: '100%', padding: '12px 0', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(99,102,241,0.06)', color: 'var(--text-heading)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Start Free</button>
            </Link>
          </div>

          {/* Card 2: Pro */}
          <div style={{ background: 'var(--glass-bg)', border: '2px solid #6366f1', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(99,102,241,0.15)', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -12, right: 24, padding: '4px 12px', borderRadius: '9999px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Popular</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>Pro Acceleration</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Everything needed for FAANG prep.</p>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-heading)' }}>$19</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>/ month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-color)', marginBottom: 32 }}>
                {['Unlimited coding challenges', 'Deep repository scanning', 'Custom AI syllabus modules', 'Unlimited AI Mock Interviews', 'Verifiable competency certificates'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/register">
              <button style={{ width: '100%', padding: '12px 0', borderRadius: '10px', border: 'none', background: '#111111', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>Get Pro Acceleration</button>
            </Link>
          </div>

          {/* Card 3: Enterprise */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--glass-shadow)' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>Enterprise</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>For engineering bootcamps and teams.</p>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-heading)' }}>Custom</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-color)', marginBottom: 32 }}>
                {['Boocamp grading pipelines', 'Customizable rubric modules', 'Dedicated support mentor channels', 'CSV analytics exports'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/register">
              <button style={{ width: '100%', padding: '12px 0', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(99,102,241,0.06)', color: 'var(--text-heading)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Contact Sales</button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ── FAQ Section (Accordion) ── */
function FAQ() {
  const [openIdx, setOpenIdx] = useState(null)

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx)
  }

  return (
    <section className="section" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ color:'#818cf8', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em', display:'block', marginBottom:12 }}>
            FAQ
          </span>
          <h2 style={{ fontSize:'clamp(28px,4vw,38px)', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em', fontFamily: 'var(--font-display)' }}>
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div key={idx} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s' }}>
                <button
                  onClick={() => toggle(idx)}
                  style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div style={{ padding: '0 24px 24px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Final Call to Action ── */
function CTA() {
  const [ctaRotateX, setCtaRotateX] = useState(0)
  const [ctaRotateY, setCtaRotateY] = useState(0)

  const handleCtaMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setCtaRotateX(-(y / (rect.height / 2)) * 6)
    setCtaRotateY((x / (rect.width / 2)) * 6)
  }

  const handleCtaLeave = () => {
    setCtaRotateX(0)
    setCtaRotateY(0)
  }

  return (
    <section className="section" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container">
        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once:true }}
        >
          <div 
            onMouseMove={handleCtaMove}
            onMouseLeave={handleCtaLeave}
            style={{ 
              position:'relative', 
              overflow:'hidden', 
              borderRadius:32, 
              padding:'80px 40px', 
              textAlign:'center', 
              background:'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06), rgba(6,182,212,0.04))', 
              border:'1px solid rgba(99,102,241,0.25)', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
              transform: `perspective(1000px) rotateX(${ctaRotateX}deg) rotateY(${ctaRotateY}deg) scale3d(1.01, 1.01, 1.01)`,
              transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
              transformStyle: 'preserve-3d',
              cursor: 'pointer',
            }}
          >
            
            {/* Background elements */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1), transparent 60%)', pointerEvents:'none' }} />
            <div className="grid-bg" style={{ position:'absolute', inset:0, opacity:0.3 }} />

            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:24 }}>
                <Zap size={16} style={{ color:'#818cf8' }} fill="#818cf8" />
                <span style={{ color:'#818cf8', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.15em' }}>Start Accelerating</span>
              </div>
              <h2 style={{ fontSize:'clamp(28px,5vw,50px)', fontWeight:900, color:'var(--text-heading)', lineHeight:1.15, marginBottom:20, letterSpacing:'-0.03em', fontFamily: 'var(--font-display)' }}>
                Ready to become the developer<br />companies actually want?
              </h2>
              <p style={{ color:'var(--text-muted)', fontSize:17, maxWidth:500, margin:'0 auto 40px', lineHeight:1.7 }}>
                Join thousands of developers who practice daily, diagnose code issues with AI, and construct careers they are proud of.
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:16 }}>
                <Link to="/register">
                  <motion.div whileHover={{ scale:1.04, y:-2, boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }} whileTap={{ scale:0.97 }}
                    style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 36px', borderRadius:9999, background:'#111111', color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
                    Start Free <ArrowRight size={18} />
                  </motion.div>
                </Link>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Landing Page Root ── */
export default function LandingPage() {
  const location = useLocation()

  // Scroll logic for hash anchors
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.hash])

  return (
    <div style={{ background:'var(--bg-color)', color:'var(--text-color)', transition:'background-color 0.4s ease, color 0.4s ease', position: 'relative' }}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-container {
          display: flex;
          overflow: hidden;
          width: 100%;
          mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
        }
        .marquee-content {
          display: flex;
          gap: 120px;
          padding-right: 120px;
          animation: marquee 30s linear infinite;
          white-space: nowrap;
        }
        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }
        .marquee-content-reverse {
          display: flex;
          gap: 32px;
          padding-right: 32px;
          animation: marquee-reverse 35s linear infinite;
          white-space: nowrap;
        }
        .marquee-container:hover .marquee-content-reverse {
          animation-play-state: paused;
        }
      `}</style>
      <Hero />
      <TrustedBy />
      <DailyChallenge />
      <Features />
      <HowItWorks />
      <DashboardAnalytics />
      <InteractiveRoadmap />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
    </div>
  )
}
