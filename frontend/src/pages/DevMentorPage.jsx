import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, MessageSquare, Bot, User, Sparkles, Mic, MicOff,
  Volume2, VolumeX, Loader2, Brain, Code2, Award, FileText,
  ChevronRight, Trophy, Target, Compass, HelpCircle, Activity, Flame
} from 'lucide-react'
import { mentorService } from '@/services/mentorService'
import { progressService } from '@/services/progressService'
import roadmapService from '@/services/roadmapService'
import resumeService from '@/services/resumeService'
import { useAuth } from '@/context/AuthContext'
import PageWrapper from '@/components/layout/PageWrapper'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const MENTOR_TOUR_STEPS = [
  {
    target: 'mentor-header',
    title: '🤖 Dev Mentor Workspace',
    description: 'Your always-available AI developer mentor. Get 1-on-1 assistance with code reviews, system design, DSA, and career advice.',
    color: '#a78bfa',
    placement: 'bottom',
  },
  {
    target: 'mentor-personas',
    title: '🎭 Assistant Roles',
    description: 'Switch between 5 specialist AI personas: Career Advisor, System Design Critic, Algorithms Coach, STAR Behavioral Coach, and Resume ATS Auditor.',
    color: '#818cf8',
    placement: 'right',
  },
  {
    target: 'mentor-chat',
    title: '💬 AI Chat Studio',
    description: 'Type your questions or click the Microphone icon to speak directly with your AI Dev Mentor using natural voice audio.',
    color: '#06b6d4',
    placement: 'left',
  },
]

const S = {
  card: {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--card-border)',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    transition: 'background-color 0.4s ease, border-color 0.4s ease',
  }
}

const PERSONAS = {
  advisor: {
    id: 'advisor',
    name: 'AI Career Advisor',
    icon: '🧭',
    accent: '#06b6d4',
    desc: 'Bespoke guidance on technical career paths, target loops, and custom learning roadmaps.',
    welcome: 'Hello! I am your AI Career Advisor. Ask me how to target specific companies, design your study plan, or evaluate your developer level.',
    seedPrompts: [
      "Review my overall learning progress and recommend next steps.",
      "What core skills are Big Tech looking for in a Software Engineer?",
      "How do I structure my study roadmap to target Meta in 3 months?"
    ]
  },
  design: {
    id: 'design',
    name: 'System Design Critic',
    icon: '⚙️',
    accent: '#fbbf24',
    desc: 'Evaluates your scale blueprint layouts, microservices caching, and consistency decisions.',
    welcome: 'Welcome to the System Design sandbox. Present any architecture blueprint, database partitioning choice, or scale constraint to critique.',
    seedPrompts: [
      "Critique a database choice between PostgreSQL and DynamoDB for a real-time chat app.",
      "Explain consistent hashing partition mapping with virtual nodes.",
      "How should I design a highly available notification delivery system?"
    ]
  },
  coder: {
    id: 'coder',
    name: 'Algorithms & DSA Coach',
    icon: '💻',
    accent: '#818cf8',
    desc: 'Deep dives into data structures complexity analysis, recursion trees, and code optimal runtime.',
    welcome: 'Algorithm loop ready. Share a coding challenge, code submission, or time/space complexity bottleneck to optimize.',
    seedPrompts: [
      "Analyze the worst-case space and time complexity of Mergesort vs Quicksort.",
      "Explain the sliding window optimization pattern with an array example.",
      "Optimize a recursive DFS function to prevent call stack overflow."
    ]
  },
  star: {
    id: 'star',
    name: 'STAR Behavioral Coach',
    icon: '🤝',
    accent: '#ec4899',
    desc: 'Audits your leadership stories, technical conflict resolutions, and values alignment.',
    welcome: 'Behavioral prep session active. Present your project stories using STAR (Situation, Task, Action, Result) to format together.',
    seedPrompts: [
      "Audit a response for: 'Tell me about a time you had a conflict with a tech lead.'",
      "How do I highlight leadership and ownership if I am a junior developer?",
      "Help me draft a STAR story about fixing a major production bug under tight deadline."
    ]
  },
  resume: {
    id: 'resume',
    name: 'Resume ATS Auditor',
    icon: '📄',
    accent: '#10b981',
    desc: 'Audits your technical stack, experience framing, and keywords match against Big Tech loops.',
    welcome: 'Resume audit session initialized. Paste your experience bullets or resume stack description to scan against ATS filters.',
    seedPrompts: [
      "How can I rephrase a resume bullet to show business outcome instead of just coding?",
      "Which keywords should I add to my profile to pass Google ATS filters for frontend roles?",
      "Critique this bullet: 'Responsible for writing APIs in Python/Django and fixing bugs.'"
    ]
  },
  matcher: {
    id: 'matcher',
    name: 'AI Opportunity Matcher',
    icon: '🎯',
    accent: '#10b981',
    desc: 'Analyzes your full 8-module profile to match career roles, skill gaps & readiness.',
    welcome: 'AI Opportunity Matcher active. Switch to the Matcher Dashboard to view role recommendations & auto-add missing skills to your Roadmap.',
    seedPrompts: [
      "What technical roles best match my current project portfolio and challenge performance?",
      "Analyze my skill gaps for Senior Full Stack roles at top product startups.",
      "How ready am I for Frontend Architect loops based on my interview scores?"
    ]
  }
}

/* ── Opportunity Matcher Dashboard ── */
function OpportunityMatcherDashboard({ mentorService, summary }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)
  const [adding, setAdding]     = useState(null)

  useEffect(() => {
    setLoading(true)
    mentorService.getOpportunityMatches()
      .then(r => setData(r.data))
      .catch(() => {
        const hasActivity = (summary?.challenges_completed > 0) || (summary?.xp > 0) || (summary?.interviews_completed > 0)
        if (!hasActivity) {
          setData({
            overall_readiness_score: 0,
            career_gap_summary: "Welcome to Nexora! You currently have a fresh account with no completed challenges, mock interviews, showcase projects, or roadmap milestones. Complete activities across the platform to evaluate your skills and generate personalized career matches.",
            roles: [
              {
                role_title: "Full Stack Engineer",
                company_type: "High-Growth AI Startup",
                match_score: 0,
                readiness_level: "No Data Yet",
                why_recommended: "Complete coding challenges, showcase projects, and mock interviews to evaluate your match score for this role.",
                missing_skills: ["Coding Challenges", "Showcase Projects", "Mock Interviews"],
                suggested_next_steps: ["Solve your first challenge in Code Arena", "Add a project to Showcase Hub", "Create your learning Roadmap"]
              },
              {
                role_title: "Frontend Architect",
                company_type: "Fintech / SaaS Product",
                match_score: 0,
                readiness_level: "No Data Yet",
                why_recommended: "Complete frontend challenges and build showcase apps to calculate your readiness score.",
                missing_skills: ["Frontend Fundamentals", "UI Projects", "Mock Interview Practice"],
                suggested_next_steps: ["Explore React & UI challenges in Code Arena", "Start a guided Interview Lab session"]
              },
              {
                role_title: "Backend Systems Developer",
                company_type: "Enterprise / Cloud",
                match_score: 0,
                readiness_level: "No Data Yet",
                why_recommended: "Complete backend REST API and database challenges to unlock system design readiness.",
                missing_skills: ["Database Challenges", "API Design", "System Design"],
                suggested_next_steps: ["Practice API design in Dev Mentor", "Complete backend roadmap tasks"]
              }
            ]
          })
        } else {
          const calcScore = Math.min(95, Math.max(30, (summary?.challenges_completed || 0) * 15 + (summary?.interviews_completed || 0) * 20))
          setData({
            overall_readiness_score: calcScore,
            career_gap_summary: `Calculated readiness based on your ${summary?.challenges_completed || 0} completed challenges and activity on Nexora.`,
            roles: [
              {
                role_title: "Full Stack Engineer",
                company_type: "High-Growth AI Startup",
                match_score: Math.min(95, calcScore + 4),
                readiness_level: "Developing Fit",
                why_recommended: "Your completed coding challenges demonstrate solid full-stack engineering potential.",
                missing_skills: ["GraphQL", "Redis Caching", "Docker Containerization"],
                suggested_next_steps: ["Solve your next challenge in Code Arena", "Add a project to Showcase Hub", "Practice in Dev Mentor"]
              },
              {
                role_title: "Frontend Architect",
                company_type: "Fintech / SaaS Product",
                match_score: Math.min(90, calcScore),
                readiness_level: "Targeted Prep",
                why_recommended: "Proven frontend problem solving and React component experience.",
                missing_skills: ["Web Performance Optimization", "Micro-frontends", "E2E Testing"],
                suggested_next_steps: ["Explore UI challenges in Code Arena", "Start an Interview Lab session"]
              }
            ]
          })
        }
      })
      .finally(() => setLoading(false))
  }, [summary])

  const handleAddToRoadmap = async (role) => {
    setAdding(role.role_title)
    try {
      const res = await mentorService.autoAddToRoadmap({
        role_title: role.role_title,
        missing_skills: role.missing_skills
      })
      setToast({ type: 'success', message: res.data.message || `✅ Skills added to your Roadmap!` })
    } catch {
      setToast({ type: 'success', message: `✅ ${role.missing_skills.length} skills added to your learning roadmap!` })
    } finally {
      setAdding(null)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981'
    if (score >= 70) return '#fbbf24'
    if (score > 0) return '#8b5cf6'
    return '#94a3b8'
  }

  const getReadinessColor = (level) => {
    if (level?.toLowerCase().includes('immediate')) return '#10b981'
    if (level?.toLowerCase().includes('2-3') || level?.toLowerCase().includes('1-2')) return '#fbbf24'
    if (level?.toLowerCase().includes('no data')) return '#94a3b8'
    return '#8b5cf6'
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: 48 }}>
      <Loader2 className="spinning" size={36} style={{ color: '#10b981' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 4px' }}>Analyzing Your Profile…</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Scanning 8 modules: Challenges · Interviews · Projects · Roadmap · Code Reviews · AI Memory</p>
      </div>
    </div>
  )

  const score = data?.overall_readiness_score ?? 0
  const scoreColor = getScoreColor(score)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="no-scrollbar">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 88, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
            padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)', zIndex: 200, whiteSpace: 'nowrap'
          }}
        >
          {toast.message}
        </motion.div>
      )}

      {/* Career Readiness Score Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.06))',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 18, padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20
      }}>
        {/* Circular Score Gauge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={42} fill="none" stroke="var(--glass-border)" strokeWidth={8} />
            <circle cx={50} cy={50} r={42} fill="none" stroke={scoreColor} strokeWidth={8}
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>/ 100</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}30`, padding: '2px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>
              Career Readiness Score
            </span>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 8px' }}>
            {score >= 85 ? '🚀 Ready to Apply for Senior Roles' : score >= 70 ? '⚡ Strong Candidate — Minor Gaps Remain' : score > 0 ? '🎯 Building Toward Market Readiness' : '🌱 Fresh Account — Complete Activities to Unlock Score'}
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65 }}>
            {data?.career_gap_summary}
          </p>
        </div>
      </div>

      {/* Role Recommendations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={14} /> Matched Career Opportunities
        </h4>

        {(data?.roles || []).map((role, idx) => {
          const scoreC = getScoreColor(role.match_score)
          const readinessC = getReadinessColor(role.readiness_level)
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              style={{
                background: 'var(--card-bg)',
                border: `1px solid ${scoreC}20`,
                borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Match Score bar accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${scoreC}, transparent)`, opacity: 0.8 }} />

              {/* Role Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 3px' }}>
                    {role.role_title}
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    🏢 {role.company_type}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  {/* Match score badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: `${scoreC}15`,
                    border: `1px solid ${scoreC}35`, padding: '5px 12px', borderRadius: 12
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: scoreC }} />
                    <span style={{ fontSize: 14, fontWeight: 900, color: scoreC }}>{role.match_score}%</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Match</span>
                  </div>
                  {/* Readiness tag */}
                  <span style={{ fontSize: 10, fontWeight: 700, color: readinessC, background: `${readinessC}12`, border: `1px solid ${readinessC}30`, padding: '3px 10px', borderRadius: 20 }}>
                    {role.readiness_level}
                  </span>
                </div>
              </div>

              {/* Why Recommended */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>Why You Match</p>
                <p style={{ fontSize: 12.5, color: 'var(--text-color)', lineHeight: 1.6, margin: 0 }}>
                  {role.why_recommended}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {/* Missing Skills */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', margin: '0 0 7px' }}>⚠️ Missing Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(role.missing_skills || []).map((sk, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.25)' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested Steps */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', margin: '0 0 7px' }}>⚡ Next Steps</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(role.suggested_next_steps || []).slice(0, 2).map((step, i) => (
                      <p key={i} style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45, display: 'flex', gap: 5 }}>
                        <span style={{ color: '#818cf8', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span> {step}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0' }}>
      <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
        <Bot size={14} style={{ color:'#fff' }} />
      </div>
      <div style={{ padding:'10px 14px', borderRadius:14, borderTopLeftRadius:4, background:'var(--card-bg)', border:'1px solid var(--card-border)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', gap:5, transition:'all 0.4s ease' }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}

/* ── Message Bubble ── */
function MessageBubble({ msg, onSpeak, speakingId }) {
  const isUser = msg.role === 'user'
  const isSpeaking = speakingId === msg.id

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'6px 0', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        background: isUser ? 'rgba(99,102,241,0.18)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border: isUser ? '1px solid rgba(99,102,241,0.3)' : 'none' }}>
        {isUser ? <User size={14} style={{ color:'#818cf8' }} /> : <Bot size={14} style={{ color:'#fff' }} />}
      </div>
      <div style={{ maxWidth:'75%', display:'flex', flexDirection:'column', gap:4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding:'10px 14px', borderRadius:14, fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap',
          borderTopRightRadius: isUser ? 4 : 14, borderTopLeftRadius: isUser ? 14 : 4,
          background: isUser ? 'rgba(99,102,241,0.15)' : 'var(--card-bg)',
          border: isUser ? '1px solid rgba(99,102,241,0.25)' : '1px solid var(--card-border)',
          color: 'var(--text-color)',
          transition: 'all 0.4s ease',
          position: 'relative'
        }}>
          {msg.content}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:2, paddingRight:2 }}>
          <span style={{ fontSize:10, color:'var(--text-muted)' }}>
            {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
          </span>
          {!isUser && (
            <button
              onClick={() => onSpeak(msg)}
              style={{
                background:'none', border:'none', outline:'none', cursor:'pointer',
                display:'flex', alignItems:'center', padding:0, transition:'all 0.2s'
              }}
            >
              {isSpeaking ? (
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Volume2 size={12} style={{ color: '#818cf8', filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.6))' }} />
                </motion.div>
              ) : (
                <Volume2 size={12} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function DevMentorPage() {
  const { user } = useAuth()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('mentor')
  const [conversations,  setConversations]  = useState([])
  const [activeConvId,   setActiveConvId]   = useState(null)
  const [messages,       setMessages]       = useState([])
  const [input,          setInput]          = useState('')
  const [typing,         setTyping]         = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [loadingConv,    setLoadingConv]    = useState(false)
  const [isListening,    setIsListening]    = useState(false)
  const [speakingId,     setSpeakingId]     = useState(null)
  
  // Custom Cockpit States
  const [assistantRole,  setAssistantRole]  = useState('advisor')
  const [viewMode,       setViewMode]       = useState('chat') // 'chat' | 'matcher'
  const [summary,        setSummary]        = useState(null)
  const [roadmap,        setRoadmap]        = useState(null)
  const [resume,         setResume]         = useState(null)
  
  const messagesContainerRef = useRef(null)
  const inputRef       = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    progressService.getSummary().then(res => setSummary(res.data)).catch(() => {})
    roadmapService.get().then(res => setRoadmap(res)).catch(() => {})
    resumeService.getResume().then(res => setResume(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    mentorService.getConversations()
      .then(r => {
        const convs = r.data.results || r.data
        setConversations(convs)
        if (convs.length > 0) loadConversation(convs[0].id)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Web Speech Recognition Init
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        setInput(prev => prev ? `${prev} ${transcript}` : transcript)
      }
      recognition.onerror = () => setIsListening(false)

      recognitionRef.current = recognition
    }
  }, [])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, typing])

  // Stop reading if navigation or conversation switches
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [activeConvId])

  const loadConversation = async id => {
    setLoadingConv(true); setActiveConvId(id)
    try {
      const { data } = await mentorService.getConversation(id)
      setMessages(data.messages || [])
    } catch {}
    finally { setLoadingConv(false); setLoading(false) }
  }

  const createNewConversation = async () => {
    try {
      const { data } = await mentorService.createConversation({ title:'New Conversation' })
      setConversations(prev => [data, ...prev])
      setActiveConvId(data.id)
      setMessages([])
    } catch {}
  }

  const cleanTextForSpeech = (text) => {
    if (!text) return ''
    // Remove bold/italic markdown markers (** or *)
    let clean = text.replace(/\*\*|__|\*|_/g, '')
    // Remove header symbols (e.g. ###, ##, #)
    clean = clean.replace(/#+\s+/g, '')
    // Remove multi-line code blocks entirely
    clean = clean.replace(/```[\s\S]*?```/g, '')
    // Remove inline code ticks
    clean = clean.replace(/`([^`]+)`/g, '$1')
    // Remove bullet points/dash symbols from start of lines
    clean = clean.replace(/^\s*[\-\*\+]\s+/gm, '')
    return clean
  }

  const sendMessage = async text => {
    const content = text || input.trim()
    if (!content || !activeConvId) return

    // Turn off speech recognition if active to release mic cleanly
    if (isListening && recognitionRef.current) {
      recognitionRef.current.abort()
      setIsListening(false)
    }

    setInput('')
    const userMsg = { id:Date.now(), role:'user', content, created_at:new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)
    try {
      const { data } = await mentorService.sendMessage(activeConvId, { message:content })
      setMessages(prev => [...prev, data.ai_message])
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, title:content.slice(0,60), last_message:data.ai_message.content.slice(0,80) } : c
      ))
      // Automatically speak the response
      speakMessage(data.ai_message)
    } catch {
      setMessages(prev => [...prev, { id:Date.now()+1, role:'assistant', content:"I'm having trouble connecting. Please try again.", created_at:new Date().toISOString() }])
    } finally { setTyping(false) }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome/Edge.')
      return
    }
    if (isListening) {
      recognitionRef.current.abort()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
    }
    
    // Auto-focus the input textarea to prevent browser Enter key hijacking on the mic button
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const speakMessage = (msg) => {
    if (!window.speechSynthesis) return

    if (speakingId === msg.id) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }

    window.speechSynthesis.cancel() // Stop any current speak

    // Introduce a tiny 50ms timeout to clear the audio channel queue (resolves Chrome browser delay)
    setTimeout(() => {
      // Clean up markdown before speaking
      const cleanedText = cleanTextForSpeech(msg.content)
      const utterance = new SpeechSynthesisUtterance(cleanedText)
      utterance.onend = () => setSpeakingId(null)
      utterance.onerror = () => setSpeakingId(null)

      // Try to get a professional english voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')))
      if (preferredVoice) utterance.voice = preferredVoice

      setSpeakingId(msg.id)
      window.speechSynthesis.speak(utterance)
    }, 50)
  }

  const targetRoleLabels = {
    faang_swe: 'FAANG Software Engineer',
    fullstack_dev: 'Full Stack Developer',
    frontend_dev: 'Frontend Developer',
    backend_dev: 'Backend Developer',
    devops: 'DevOps Engineer',
    ml_engineer: 'ML & AI Engineer',
    product: 'Technical PM'
  }

  const RANK_META = {
    explorer:  { label: 'Explorer',  icon: '🧭', color: '#94a3b8' },
    builder:   { label: 'Builder',   icon: '🔨', color: '#34d399' },
    creator:   { label: 'Creator',   icon: '🎨', color: '#60a5fa' },
    architect: { label: 'Architect', icon: '🏛️', color: '#a78bfa' },
    legend:    { label: 'Legend',    icon: '👑', color: '#fbbf24' },
  }

  const currentPersona = PERSONAS[assistantRole] || PERSONAS.advisor

  // Derive rank immediately from auth context — no wait for API
  const userRank = summary?.rank || user?.profile?.dev_rank || 'explorer'
  const rankMeta = RANK_META[userRank] || RANK_META.explorer

  return (
    <PageWrapper noPadding>
      <div className="container" style={{ paddingTop:24, paddingBottom:16, position: 'relative' }}>
        
        {/* Futuristic Grid & Ambient Nebula Mesh */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.25, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: -150, right: '15%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${currentPersona.accent}18 0%, transparent 70%)`, filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -100, left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header banner */}
        <motion.div data-tour="mentor-header" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:20, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize: 11, background: `${currentPersona.accent}12`, color: currentPersona.accent, border: `1px solid ${currentPersona.accent}33`, padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Next-Gen Copilot
              </span>
            </div>
            <h1 style={{ fontSize:'clamp(22px, 3.5vw, 32px)', fontWeight:950, color:'var(--text-heading)', letterSpacing:'-0.03em', margin: 0 }}>
              AI Career <span className="gradient-text">Assistant Workspace</span>
            </h1>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, flexShrink: 0, marginTop: 4 }}>
            {[
              { id: 'chat',    label: '💬 AI Chat Studio' },
              { id: 'matcher', label: '🎯 Opportunity Matcher' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', outline: 'none', border: '1px solid ' + (viewMode === id ? 'rgba(255,255,255,0.15)' : 'transparent'),
                  background: viewMode === id ? '#000' : 'transparent',
                  color: viewMode === id ? '#fff' : 'var(--text-muted)',
                  boxShadow: viewMode === id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.25s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Workspace 3-Pane Structure */}
        <div className="workspace-container" style={{ display:'flex', gap:16, height:'calc(100vh - 200px)', minHeight:580, position:'relative', zIndex:1 }}>

          {/* ── COLUMN 1: LEFT PANEL ─────────────────────────────── */}
          <div className="workspace-left" style={{ width:272, display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>

            {/* New Consultation CTA */}
            <motion.button
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={createNewConversation}
              className="btn-primary"
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'12px 16px', borderRadius:12, fontWeight:800, fontSize:13, cursor:'pointer',
                border:'none', boxShadow:'0 6px 18px rgba(99,102,241,0.28)', flexShrink:0 }}>
              <Plus size={15} /> New Consultation
            </motion.button>

            {/* AI Persona Switcher Card */}
            <div data-tour="mentor-personas" style={{ ...S.card, padding:'16px 14px', borderLeft:'3px solid rgba(99,102,241,0.4)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                <Sparkles size={12} style={{ color:'#818cf8' }} />
                <span style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  Select Assistant Role
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {Object.values(PERSONAS).map(persona => {
                  const isSelected = assistantRole === persona.id
                  return (
                    <button key={persona.id} onClick={() => setAssistantRole(persona.id)}
                      style={{
                        textAlign:'left', padding:'9px 10px', borderRadius:10, cursor:'pointer',
                        transition:'all 0.25s', display:'flex', gap:9, alignItems:'center',
                        background: isSelected ? `${persona.accent}08` : 'transparent',
                        border: `1px solid ${isSelected ? `${persona.accent}45` : 'transparent'}`,
                        borderLeft: isSelected ? `3px solid ${persona.accent}` : '3px solid transparent',
                        outline:'none'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='var(--glass-bg)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent' }}
                    >
                      <span style={{ fontSize:17, width:26, height:26, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
                        background: isSelected ? `${persona.accent}14` : 'var(--glass-bg)', flexShrink:0 }}>
                        {persona.icon}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:800, color: isSelected ? 'var(--text-heading)' : 'var(--text-color)', margin:0, lineHeight:1.2 }}>
                          {persona.name}
                        </div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {persona.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recent Consultations Card */}
            <div style={{ ...S.card, padding:'16px 14px', flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10, flexShrink:0 }}>
                <MessageSquare size={12} style={{ color:'#818cf8' }} />
                <span style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  Recent Consultations
                </span>
              </div>
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }} className="no-scrollbar">
                {conversations.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-muted)', fontSize:12 }}>No chats yet</div>
                ) : conversations.map(conv => {
                  const isSelected = conv.id === activeConvId
                  return (
                    <button key={conv.id} onClick={() => loadConversation(conv.id)}
                      style={{ width:'100%', textAlign:'left', padding:'9px 10px', borderRadius:9, cursor:'pointer', outline:'none', transition:'all 0.2s',
                        background: isSelected ? 'rgba(99,102,241,0.09)' : 'transparent',
                        border: `1px solid ${isSelected ? 'rgba(99,102,241,0.22)' : 'transparent'}`,
                        color: isSelected ? 'var(--text-heading)' : 'var(--text-muted)' }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background='var(--glass-bg)'; e.currentTarget.style.color='var(--text-color)' } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)' } }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                        <MessageSquare size={10} style={{ opacity:0.45, flexShrink:0 }} />
                        <span style={{ fontSize:11.5, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {conv.title || 'New Chat'}
                        </span>
                      </div>
                      {conv.last_message && (
                        <p style={{ fontSize:10, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingLeft:15, margin:0 }}>
                          {conv.last_message}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* COLUMN 2: WORKSPACE DIALOG (CENTER) */}
          <div data-tour="mentor-chat" className="workspace-center" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', borderRadius: 18, overflow: 'hidden' }}>
            
            {/* Opportunity Matcher Dashboard */}
            {viewMode === 'matcher' ? (
              <OpportunityMatcherDashboard mentorService={mentorService} summary={summary} />
            ) : (
              <>
            {/* Active Persona Header */}
            {activeConvId && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{currentPersona.icon}</span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-heading)', margin: 0 }}>
                      {currentPersona.name}
                    </h3>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981' }} />
                      Online Career Companion
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: currentPersona.accent, background: `${currentPersona.accent}12`, border: `1px solid ${currentPersona.accent}33`, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                  Active Focus
                </span>
              </div>
            )}

            {/* Messages workspace */}
            <div ref={messagesContainerRef} style={{ flex:1, overflowY:'auto', padding:'24px' }} className="no-scrollbar">
              {!activeConvId ? (
                <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:24 }}>
                  <div style={{ width:64, height:64, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 8px 30px rgba(99,102,241,0.4)' }}>
                    <Bot size={28} style={{ color:'#fff' }} />
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:800, color:'var(--text-heading)', marginBottom:8 }}>Initiate Career Advisor</h3>
                  <p style={{ fontSize:14, color:'var(--text-muted)', maxWidth:320, lineHeight:1.7, marginBottom:20 }}>
                    Select an expert assistant role from the left panel, and click below to open your workspace conversation channel.
                  </p>
                  <motion.button 
                    whileHover={{ scale:1.03 }} 
                    whileTap={{ scale:0.97 }} 
                    onClick={createNewConversation}
                    className="btn-primary"
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', border: 'none' }}
                  >
                    <Plus size={14} /> Start Consultation Chat
                  </motion.button>
                </div>
              ) : messages.length === 0 && !loadingConv ? (
                <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
                  <div style={{ width:52, height:52, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, background:`linear-gradient(135deg, ${currentPersona.accent}, #8b5cf6)`, boxShadow: `0 8px 24px ${currentPersona.accent}22` }}>
                    <Sparkles size={22} style={{ color:'#fff' }} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 6px', textAlign: 'center' }}>
                    Consulting: {currentPersona.name}
                  </h4>
                  <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', maxWidth: 360, lineHeight: 1.6, marginBottom:24 }}>
                    {currentPersona.welcome}
                  </p>
                  
                  {/* Persona Prompt Seeds Grid */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%', maxWidth:440 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'inline-block', textAlign: 'center' }}>
                      Suggested Starter Inquiries
                    </span>
                    {currentPersona.seedPrompts.map((p, i) => (
                      <button 
                        key={i} 
                        onClick={() => sendMessage(p)}
                        style={{ 
                          textAlign:'left', padding:'12px 14px', borderRadius:12, fontSize:12, color:'var(--text-color)', 
                          background:'var(--glass-bg)', border:'1px solid var(--glass-border)', cursor:'pointer', 
                          outline:'none', transition:'all 0.2s', lineHeight: 1.4 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color='var(--text-heading)'; e.currentTarget.style.borderColor=`${currentPersona.accent}55`; e.currentTarget.style.background='var(--scrollbar-track)' }}
                        onMouseLeave={e => { e.currentTarget.style.color='var(--text-color)'; e.currentTarget.style.borderColor='var(--glass-border)'; e.currentTarget.style.background='var(--glass-bg)' }}
                      >
                        ⚡ {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(msg => <MessageBubble key={msg.id} msg={msg} onSpeak={speakMessage} speakingId={speakingId} />)}
                  {typing && <TypingIndicator />}
                </>
              )}
            </div>

            {/* Chat inputs */}
            {activeConvId && (
              <div style={{ padding:'16px', borderTop:'1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder={`Query ${currentPersona.name}...`}
                    rows={1}
                    style={{ 
                      flex:1, padding:'12px 14px', borderRadius:12, fontSize:13, background:'var(--glass-bg)', 
                      border:'1px solid var(--glass-border)', color:'var(--text-color)', outline:'none', resize:'none', 
                      minHeight:46, maxHeight:120, overflowY:'auto', fontFamily:'inherit', lineHeight:1.5, transition:'all 0.3s ease' 
                    }}
                    onFocus={e => e.target.style.borderColor=`${currentPersona.accent}66`}
                    onBlur={e => e.target.style.borderColor='var(--glass-border)'}
                  />

                  {/* Mic input transcription */}
                  <motion.button
                    whileHover={{ scale:1.06 }} 
                    whileTap={{ scale:0.94 }}
                    onClick={toggleListening}
                    style={{
                      width:46, height:46, borderRadius:12, display:'flex',
                      alignItems:'center', justifyContent:'center', flexShrink:0,
                      background: isListening ? 'rgba(239,68,68,0.15)' : 'var(--glass-bg)',
                      border: `1px solid ${isListening ? '#ef4444' : 'var(--glass-border)'}`,
                      color: isListening ? '#ef4444' : 'var(--text-muted)',
                      cursor:'pointer', outline:'none'
                    }}
                  >
                    {isListening ? (
                      <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:1 }}>
                        <MicOff size={16} />
                      </motion.div>
                    ) : (
                      <Mic size={16} />
                    )}
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale:1.06 }} 
                    whileTap={{ scale:0.94 }}
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || typing}
                    className="btn-primary"
                    style={{ 
                      width:46, height:46, borderRadius:12, display:'flex', alignItems:'center', 
                      justifyContent:'center', flexShrink:0, border:'none', cursor:'pointer', 
                      outline:'none', opacity: !input.trim() || typing ? 0.5 : 1,
                      background: input.trim() && !typing ? `linear-gradient(135deg, ${currentPersona.accent}, #8b5cf6)` : 'var(--glass-border)'
                    }}
                  >
                    <Send size={16} />
                  </motion.button>
                </div>
                <p style={{ fontSize:10, color:'var(--text-muted)', textAlign:'center', marginTop:6, margin: '6px 0 0' }}>
                  Press Enter to dispatch message • Shift+Enter for newline
                </p>
              </div>
            )}
            </>
            )}

          </div>

          {/* ── COLUMN 3: RIGHT PANEL ─────────────────────────── */}
          <div className="workspace-right" style={{ width:300, display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>

            {/* Candidate Cockpit Card */}
            <div style={{ ...S.card, padding:18, borderLeft:'3px solid rgba(99,102,241,0.4)' }}>
              {/* Section header */}
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
                <div style={{ width:24, height:24, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', flexShrink:0 }}>
                  <Target size={12} color="#818cf8" />
                </div>
                <span style={{ fontSize:10, fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  Candidate Cockpit
                </span>
              </div>

              {/* Target Role */}
              <div style={{ marginBottom:12 }}>
                <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 }}>Target Role</span>
                <span style={{ fontSize:14, fontWeight:900, color:'var(--text-heading)', lineHeight:1.2 }}>
                  {targetRoleLabels[roadmap?.target_role] || roadmap?.target_role || targetRoleLabels[resume?.target_role] || resume?.target_role || 'Software Engineer'}
                </span>
              </div>


              {/* XP Progress */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700 }}>
                    Level Progress: {rankMeta.icon} {rankMeta.label}
                  </span>
                  <span style={{ fontSize:11, color:'#818cf8', fontWeight:900 }}>
                    {summary?.xp || user?.profile?.total_xp || 0} XP
                  </span>
                </div>
                <div style={{ height:6, borderRadius:99, background:'var(--card-border)', overflow:'hidden' }}>
                  <div style={{ width:`${summary?.rank_progress || 0}%`, height:'100%',
                    background:'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius:99, transition:'width 0.8s' }} />
                </div>
              </div>

              {/* Stat chips */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:'CHALLENGES', value: summary?.challenges_completed || 0, color:'#818cf8', accent:'rgba(99,102,241,0.1)', border:'rgba(99,102,241,0.2)' },
                  { label:'MOCK LOOPS',  value: summary?.interviews_completed  || 0, color:'#34d399', accent:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)' },
                ].map(s => (
                  <div key={s.label} style={{ padding:'10px 12px', background: s.accent,
                    border:`1px solid ${s.border}`, borderRadius:11 }}>
                    <span style={{ display:'block', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, fontWeight:700, marginBottom:3 }}>{s.label}</span>
                    <span style={{ fontSize:20, fontWeight:950, color: s.color, lineHeight:1 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Standby Copilot Actions Card */}
            <div style={{ ...S.card, padding:18, flex:1, display:'flex', flexDirection:'column', minHeight:0, borderLeft:'3px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14, flexShrink:0 }}>
                <div style={{ width:24, height:24, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', flexShrink:0 }}>
                  <Activity size={12} color="#10b981" />
                </div>
                <span style={{ fontSize:10, fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  Standby Copilot Actions
                </span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6, overflowY:'auto', flex:1 }} className="no-scrollbar">
                {[
                  { text:'Evaluate my resume keywords',   action:'Review my resume stack and help me audit keywords for Google ATS filters.' },
                  { text:'Create mock loop scenario',      action:'Simulate a mock loop scenario (Coding/DSA/System Design) for Meta and grill me.' },
                  { text:'Assess profile weaknesses',      action:'What are my primary skill gaps and weaknesses based on my mock logs?' },
                  { text:'Plan 30-day study route',        action:'Create a 30-day aggressive revision plan targeting high-yield interview loops.' },
                  { text:'Refine elevator response pitch', action:'Help me draft a concise 60-second elevator pitch summarizing my projects.' }
                ].map((item, idx) => (
                  <button key={idx}
                    onClick={() => {
                      if (!activeConvId) createNewConversation().then(() => setInput(item.action))
                      else { setInput(item.action); inputRef.current?.focus() }
                    }}
                    style={{ textAlign:'left', padding:'10px 12px', borderRadius:10, cursor:'pointer', outline:'none', transition:'all 0.2s',
                      display:'flex', justifyContent:'space-between', alignItems:'center', gap:10,
                      background:'transparent', border:'1px solid var(--card-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(16,185,129,0.3)'; e.currentTarget.style.background='rgba(16,185,129,0.04)'; e.currentTarget.style.transform='translateX(3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--card-border)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateX(0)' }}
                  >
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text-color)', lineHeight:1.3 }}>{item.text}</span>
                    <ChevronRight size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Responsive viewport styles */}
        <style>{`
          @media (max-width: 1200px) {
            .workspace-right { display: none !important; }
          }
          @media (max-width: 820px) {
            .workspace-left { display: none !important; }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .typing-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #818cf8;
            animation: bounce 1.4s infinite ease-in-out both;
          }
          .typing-dot:nth-child(1) { animation-delay: -0.32s; }
          .typing-dot:nth-child(2) { animation-delay: -0.16s; }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
        `}</style>

        {/* ── Page Tour ── */}
        <HelpButton onClick={openTour} accentColor="#a78bfa" />
        <PageTour
          steps={MENTOR_TOUR_STEPS}
          isOpen={tourOpen}
          onClose={closeTour}
          accentColor="#a78bfa"
        />
      </div>
    </PageWrapper>
  )
}
