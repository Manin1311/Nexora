import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Compass, Award, Zap, HelpCircle, CheckCircle, Loader2, ListChecks } from 'lucide-react'
import api from '@/services/api'
import PageWrapper from '@/components/layout/PageWrapper'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const REVISION_TOUR_STEPS = [
  {
    target: 'revision-header',
    title: '📚 Revision Hub',
    description: 'AI-generated spaced repetition flashcards and interview playbooks built from your past mistake patterns.',
    color: '#f97316',
    placement: 'bottom',
  },
  {
    target: 'revision-company',
    title: '🏢 Target Selector',
    description: 'Select your target company (Google, Amazon, Meta, Microsoft) and role to generate tailored interview questions.',
    color: '#6366f1',
    placement: 'bottom',
  },
  {
    target: 'revision-map',
    title: '🗺️ Interview Prep Map',
    description: 'Click through 4 interview loop rounds: Resume Fit, DSA Coding, System Design, and Behavioral STAR fit.',
    color: '#10b981',
    placement: 'top',
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
    padding: 24,
    transition: 'background-color 0.4s ease, border-color 0.4s ease',
  },
  flashcard: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    cursor: 'pointer',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  }
}

const PLAYBOOK_DATA = {
  1: {
    roundName: "Resume Fit & Hiring Manager Screen",
    tagline: "Unlocking the hidden signals of ownership, scope, and technical depth.",
    hiddenSignals: [
      { label: "Technical Ownership", desc: "Do you understand *why* a framework or stack was chosen, or did you just build what you were told?" },
      { label: "Scope & Scale", desc: "Whether your code was tested at 100 QPS or 100k QPS, and how you managed resource limits." },
      { label: "Business Impact", desc: "Translating latency decreases or code optimizations into concrete dollar values or team velocity." }
    ],
    redFlags: [
      { flag: "Buzzword Overload", detail: "Listing Docker, Kubernetes, Kafka, and Redis without explaining their specific utility in your architecture." },
      { flag: "Passive Framing", detail: "Saying 'we migrated' or 'the project was completed' rather than highlighting your specific architectural decisions." },
      { flag: "Rigid Trade-offs", detail: "Defending a past choice blindly without acknowledging its flaws or what you would change today." }
    ],
    tradeoffsTitle: "⚡ Key Architectural Decision Matrix (Resume Projects)",
    tradeoffs: [
      {
        decision: "Database Choice: Relational vs Document Store",
        tradeoff: "ACID transactions & strict relations (Postgres) vs high write throughput, schema flexibility, and horizontal partitioning (MongoDB/DynamoDB)."
      },
      {
        decision: "API Design: REST vs gRPC",
        tradeoff: "Ubiquitous browser compatibility & ease of caching (REST) vs low-latency binary payload serialization & strict code-gen contracts (gRPC/ProtoBuf)."
      }
    ],
    proTips: [
      "Use the STAR formula: Situation (scale context), Task (bottleneck), Action (your specific architectural trade-off), Result (measured impact).",
      "Always know the exact performance profile of your system: latency (p99), throughput, and memory consumption."
    ]
  },
  2: {
    roundName: "Algorithms, Coding & DSA Loop",
    tagline: "Demonstrating clean coding principles, pattern recognition, and complexity analysis.",
    hiddenSignals: [
      { label: "Pattern Recognition", desc: "Mapping a complex problem to standard templates (Sliding Window, DFS, Two-Pointer, Union-Find)." },
      { label: "Systematic Optimization", desc: "Moving from a naive brute force O(N^2) solution to O(N log N) or O(N) by introducing optimal auxiliary structures." },
      { label: "Edge Case Coverage", desc: "Proactively handling null values, empty structures, integer overflow, and extreme index bounds." }
    ],
    redFlags: [
      { flag: "Coding Too Early", detail: "Writing code before stating your approach, clarifying constraints, and getting the interviewer's alignment." },
      { flag: "Silent Coding", detail: "Failing to explain your thoughts out loud, leaving the interviewer blind to your problem-solving process." },
      { flag: "Dry Run Failure", detail: "Submitting code without manually tracing it with a test input vector to catch syntax/off-by-one errors." }
    ],
    tradeoffsTitle: "⚡ Algorithm Patterns & Complexity Trade-offs",
    tradeoffs: [
      {
        decision: "Space vs Time Optimization",
        tradeoff: "Using a Hash Map/Set to trade O(N) auxiliary space for O(1) average lookup speed vs O(1) space with O(N log N) sorting."
      },
      {
        decision: "Recursion (DFS) vs Iteration (BFS)",
        tradeoff: "Elegant code representation & call stack usage (DFS) vs explicit Queue/Stack management to avoid StackOverflow errors (BFS)."
      }
    ],
    proTips: [
      "Clarify constraints first: What is the input range? Are negative values allowed? Can the structure contain duplicates?",
      "State the space and time complexity explicitly before the interviewer asks."
    ]
  },
  3: {
    roundName: "Architecture & System Design Loop",
    tagline: "Evaluating high-level scaling blueprints, failure recovery, and distributed data modeling.",
    hiddenSignals: [
      { label: "Distributed Trade-offs", desc: "Understanding how CAP Theorem dictates consistency vs availability in partitioned networks." },
      { label: "Failure Domain Analysis", desc: "Designing backups, database replicas, circuit breakers, and load balancer fallbacks to avoid single points of failure." },
      { label: "Bottleneck Identification", desc: "Knowing exactly where the system will fail first (e.g. database disk I/O, network bandwidth, CPU bounds)." }
    ],
    redFlags: [
      { flag: "Buzzword Design", detail: "Throwing Redis, Kafka, and ElasticSearch at a problem without performing capacity calculations." },
      { flag: "Abstract Sketching", detail: "Drawing generic load balancers and databases without defining schemas, API endpoints, and caching lifecycles." },
      { flag: "Lack of Scale Nuance", detail: "Designing the same system for 10 users and 100 million users without changing storage or sharding strategies." }
    ],
    tradeoffsTitle: "⚡ Architectural Blueprint Decision Matrix",
    tradeoffs: [
      {
        decision: "Consistency: Strong vs Eventual Consistency",
        tradeoff: "Guaranteed real-time correctness but higher write latency & lower availability vs high write throughput but temporary stale reads."
      },
      {
        decision: "Caching: Cache-Aside vs Write-Through",
        tradeoff: "Lower cache memory footprint but potential cache miss latency vs immediate read speed with higher memory utilization and write overhead."
      },
      {
        decision: "Communication: Synchronous HTTP vs Async Message Queues",
        tradeoff: "Immediate transactional feedback but tight coupling vs decoupled services, backpressure management, and eventual processing."
      }
    ],
    proTips: [
      "Always start with scale estimation: Estimate QPS, bandwidth, daily storage requirements, and write-to-read ratio.",
      "Drive the design. Don't wait for the interviewer to prompt every single system component."
    ]
  },
  4: {
    roundName: "Behavioral, STAR & Leadership Fit",
    tagline: "Validating your values alignment, collaboration standards, and conflict management.",
    hiddenSignals: [
      { label: "Disagree and Commit", desc: "Supporting a different decision once finalized, regardless of your personal stance, for the speed of the team." },
      { label: "Empathy & Mentorship", desc: "Examples of how you uplift junior engineers, delegate responsibilities, and handle team performance issues constructively." },
      { label: "Pragmatic Prioritization", desc: "Balancing strict deadlines, technical debt, and business priorities without burning out." }
    ],
    redFlags: [
      { flag: "Blame Distribution", detail: "Stating that a past project failed because 'product managers were bad' or 'developers were incompetent'." },
      { flag: "Credit Hoarding", detail: "Saying 'I did everything' instead of explaining how you collaborated, guided, and delegated tasks." },
      { flag: "Defensiveness", detail: "Reacting negatively when asked what you could have done better or what you learned from a major failure." }
    ],
    tradeoffsTitle: "⚡ Leadership & Team Decision Matrix",
    tradeoffs: [
      {
        decision: "Handling Technical Debt: Refactor vs Ship Feature",
        tradeoff: "Investing in long-term developer velocity and codebase stability vs launching customer value early to gather critical market signals."
      },
      {
        decision: "Conflict Resolution: Consensus vs Speed of Decision",
        tradeoff: "Getting everyone fully aligned through extensive debates vs making a rapid, reversible execution choice to prevent analysis paralysis."
      }
    ],
    proTips: [
      "Prepare 4-5 core stories that can be adapted to different questions: a time you failed, a conflict, a complex project, and a leadership example.",
      "Focus on the 'L' (What you learned / What you did differently next time) in your STAR response."
    ]
  }
}

export default function RevisionPage() {
  const [company, setCompany] = useState('Google')
  const [role, setRole] = useState('Software Engineer')
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeCardIdx, setActiveCardIdx] = useState(null)
  const [viewMode, setViewMode] = useState('flashcard')
  const [activeRound, setActiveRound] = useState(2)
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('revision')
  
  const fetchGuide = () => {
    setLoading(true)
    api.get(`/interviews/revision/?company=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}`)
      .then(res => {
        setGuide(res.data)
        setLoading(false)
        setActiveCardIdx(null)
      })
      .catch(err => {
        console.error('Error compiling guide:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchGuide()
  }, [])

  const getFilteredFlashcards = (roundNum) => {
    if (!guide || !guide.flashcards) return []
    return guide.flashcards.filter(card => {
      if (card.round !== undefined) return Number(card.round) === roundNum
      
      const cat = (card.category || '').toLowerCase()
      const front = (card.front || '').toLowerCase()
      
      if (roundNum === 1) {
        return cat.includes('resume') || cat.includes('profile') || cat.includes('background') || cat.includes('hm') || cat.includes('screen') || cat.includes('fit') || front.includes('resume') || front.includes('pitch')
      }
      if (roundNum === 2) {
        return cat.includes('dsa') || cat.includes('structure') || cat.includes('algo') || cat.includes('code') || cat.includes('complexity') || cat.includes('tree') || cat.includes('graph')
      }
      if (roundNum === 3) {
        return cat.includes('system') || cat.includes('design') || cat.includes('architecture') || cat.includes('database') || cat.includes('cache') || cat.includes('scale') || cat.includes('distributed')
      }
      if (roundNum === 4) {
        return cat.includes('behavioral') || cat.includes('culture') || cat.includes('leader') || cat.includes('soft') || cat.includes('star') || cat.includes('conflict') || cat.includes('colleague')
      }
      return false
    })
  }

  const renderFlashcardsAndCheatsheets = (roundNum) => {
    const cards = getFilteredFlashcards(roundNum)
    if (!cards || cards.length === 0) return null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '6px 12px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ListChecks size={14} color="#818cf8" /> Interactive Revision Cards ({cards.length})
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setViewMode('flashcard')}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 11, transition: 'all 0.2s',
                background: viewMode === 'flashcard' ? 'var(--btn-primary-bg)' : 'transparent',
                color: viewMode === 'flashcard' ? 'var(--btn-primary-text)' : 'var(--text-muted)'
              }}
            >
              🗂️ Flashcards
            </button>
            <button
              onClick={() => setViewMode('cheatsheet')}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 11, transition: 'all 0.2s',
                background: viewMode === 'cheatsheet' ? 'var(--btn-primary-bg)' : 'transparent',
                color: viewMode === 'cheatsheet' ? 'var(--btn-primary-text)' : 'var(--text-muted)'
              }}
            >
              📋 Cheat Sheet
            </button>
          </div>
        </div>

        {viewMode === 'flashcard' ? (
          <div style={{ display: 'grid', gridTemplateColumns: cards.length === 1 ? '1fr' : '1fr 1fr', gap: 16 }}>
            {cards.map((card, idx) => {
              const isFlipped = activeCardIdx === `${roundNum}-${idx}`
              return (
                <div key={idx} onClick={() => setActiveCardIdx(isFlipped ? null : `${roundNum}-${idx}`)} style={{ perspective: 1000 }}>
                  <motion.div style={{ ...S.flashcard, transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
                      <span style={{ alignSelf: 'flex-start', fontSize: 10, background: 'rgba(99,102,241,0.08)', color: '#818cf8', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>{card.category || 'Focus'}</span>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)', margin: 'auto 0' }}>{card.front}</p>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>CLICK TO FLIP</span>
                    </div>
                    <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
                      <span style={{ alignSelf: 'flex-start', fontSize: 10, background: 'rgba(16,185,129,0.08)', color: '#10b981', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>ANSWER</span>
                      <p style={{ fontSize: 11, color: 'var(--text-color)', lineHeight: 1.5, margin: 'auto 0', fontWeight: 600 }}>{card.back}</p>
                      <span style={{ fontSize: 9, color: '#818cf8', fontWeight: 800 }}>CLICK TO HIDE</span>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cards.map((card, idx) => (
              <div key={idx} style={{ ...S.card, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>{card.front}</h4>
                  <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.08)', color: '#818cf8', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{card.category || 'General'}</span>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: 12, color: 'var(--text-color)', lineHeight: 1.5 }}>
                  {card.back}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const companiesList = ['Google', 'Meta', 'Amazon', 'Netflix', 'Microsoft', 'Apple', 'Stripe']
  const rolesList = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'System Architect', 'ML Engineer']

  return (
    <PageWrapper>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        
        {/* Title Section */}
        <div data-tour="revision-header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <BookOpen size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em', lineHeight: 1 }}>Interview Revision Mode</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 3 }}>Compile target notes, active recall flashcards, and diagnostic guides tailored for you</p>
          </div>
        </div>

        {/* Input Selectors Row */}
        <div data-tour="revision-company" style={{ ...S.card, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>Target Company</label>
              <select 
                value={company} 
                onChange={e => setCompany(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none', fontSize: 13 }}
              >
                {companiesList.map(c => <option key={c} value={c} style={{ background: 'var(--card-bg)' }}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>Target Role</label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none', fontSize: 13 }}
              >
                {rolesList.map(r => <option key={r} value={r} style={{ background: 'var(--card-bg)' }}>{r}</option>)}
              </select>
            </div>
            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchGuide}
                disabled={loading}
                style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', height: 42, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                Generate Guide
              </motion.button>
            </div>
          </div>
        </div>

        {/* Loading Desk */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12 }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#818cf8' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Analyzing resume stack, interview failures, and compiling high-yield guidelines...</p>
          </div>
        ) : guide ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* ── INTERVIEW LOOP ROADMAP TRACK (View Map Rasta) ── */}
            <div data-tour="revision-map" style={{ ...S.card, padding: '24px 32px', background: 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(139,92,246,0.01))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  🗺️ Loop-by-Loop Interview Prep Map
                </h3>
                <span style={{ fontSize: 12, background: 'rgba(99,102,241,0.08)', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
                  Target: {company} • {role}
                </span>
              </div>

              {/* Connected Roadmap Timeline */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 20px' }}>
                <div style={{ position: 'absolute', left: 40, right: 40, height: 4, background: 'var(--glass-border)', zIndex: 1, top: '42%' }} />
                
                <div style={{
                  position: 'absolute',
                  left: 40,
                  width: `${((activeRound - 1) / 3) * 88}%`,
                  height: 4,
                  background: 'linear-gradient(90deg, #10b981, #818cf8, #f59e0b)',
                  zIndex: 2,
                  top: '42%',
                  transition: 'width 0.4s ease-in-out'
                }} />

                {[
                  { id: 1, title: 'Resume Fit', loop: 'Round 1', icon: '📄', color: '#10b981', desc: 'Screening' },
                  { id: 2, title: 'DSA & Coding', loop: 'Round 2', icon: '💻', color: '#6366f1', desc: 'Algorithm' },
                  { id: 3, title: 'Architecture', loop: 'Round 3', icon: '⚙️', color: '#f59e0b', desc: 'Scaling' },
                  { id: 4, title: 'Behavioral', loop: 'Round 4', icon: '🤝', color: '#ec4899', desc: 'Culture' }
                ].map(node => {
                  const isActive = activeRound === node.id
                  const isCompleted = activeRound > node.id
                  return (
                    <div 
                      key={node.id} 
                      onClick={() => setActiveRound(node.id)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, cursor: 'pointer', position: 'relative', width: 90 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isActive ? node.color : (isCompleted ? 'var(--card-bg)' : 'var(--glass-bg)'),
                          border: `2px solid ${isActive || isCompleted ? node.color : 'var(--glass-border)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          color: isActive ? '#fff' : 'var(--text-color)',
                          boxShadow: isActive ? `0 0 20px ${node.color}55` : 'none',
                          transition: 'all 0.3s'
                        }}
                      >
                        {isCompleted ? '✓' : node.icon}
                      </motion.div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? 'var(--text-heading)' : 'var(--text-muted)', marginTop: 8, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {node.loop}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, whiteSpace: 'nowrap' }}>
                        {node.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── ACTIVE LOOP DETAILS PANEL ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 28, alignItems: 'start' }}>
              
              {/* LEFT Column: Interactive Loop study content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Round 1: Resume Screen Contents */}
                {activeRound === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ ...S.card }}>
                      <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#10b981,transparent)' }} />
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>📄</span> Resume Pitch Alignment
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, margin: 0 }}>
                        {guide.resume_bridge}
                      </p>
                    </div>

                    {/* 150-200 Word Topic Summary */}
                    <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(6,182,212,0.03))', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📚</span> Topic Summary &amp; Core Blueprint (150–200 Words)
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>~150 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        The Resume Fit and Hiring Manager loop evaluates your real-world software engineering depth, project ownership, and technical decision-making logic. Interviewers look beyond bullet points to inspect whether you truly understand why specific frameworks, databases, or cloud infrastructure choices were made, or if you simply implemented pre-defined instructions. To stand out, articulate your individual contribution using quantifiable metrics—such as reducing server latency by 45%, cutting cloud infrastructure costs, or scaling database throughput to handle tens of thousands of concurrent requests. Be prepared to discuss architectural trade-offs, edge cases encountered during production deployment, and lessons learned from technical failures. Avoid buzzword overload without substance; instead, frame every project around business impact, team velocity, and technical ownership. Demonstrating clear communication, self-awareness of system limitations, and an ability to justify stack selections will prove your maturity as a candidate engineer.
                      </p>
                    </div>

                    <div style={{ ...S.card, background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#10b981', margin: '0 0 10px' }}>Key Strategy Notes:</h4>
                      <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <li>Highlight metrics-driven impact (e.g. latency reduced by X%, load handled Y%).</li>
                        <li>Prepare 1-minute elevator pitch highlighting technical skills matching {role}.</li>
                        <li>Expect basic screening questions regarding framework choices listed in your profile.</li>
                      </ul>
                    </div>

                    {renderFlashcardsAndCheatsheets(1)}
                  </motion.div>
                )}

                {/* Round 2: Coding & DSA Contents */}
                {activeRound === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ ...S.card }}>
                      <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#6366f1,transparent)' }} />
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>💻</span> Algorithms &amp; Problem Solving
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, margin: 0 }}>
                        Focus loops at {company} evaluate code clarity, optimal time/space complexity, and edge case coverage. Practice key algorithmic structures.
                      </p>
                    </div>

                    {/* 150-200 Word Topic Summary */}
                    <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.03))', border: '1px solid rgba(99,102,241,0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#818cf8', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📚</span> Topic Summary &amp; Core Blueprint (150–200 Words)
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>~152 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        The Technical Coding and Data Structures loop assesses your problem-solving process, algorithmic efficiency, and ability to translate abstract requirements into clean, production-grade code under time pressure. Top tech companies evaluate how methodically you break down complex problems, identify pattern primitives—such as dynamic programming, graph traversals, sliding window, or two-pointer techniques—and analyze time and space complexity using Big-O notation. Avoid jumping straight into coding; begin by clarifying constraints, verifying input boundaries, and talking through your thought process out loud. Present a brute-force approach first before proposing an optimized solution. Write modular, readable code with descriptive variable names, handling edge cases such as empty inputs, null references, integer overflows, and single-element collections. Thoroughly walk through test cases step by step to catch logic bugs before declaring completion, demonstrating strong technical rigour and engineering confidence.
                      </p>
                    </div>

                    {renderFlashcardsAndCheatsheets(2)}
                  </motion.div>
                )}

                {/* Round 3: Architecture & Scaling Contents */}
                {activeRound === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ ...S.card }}>
                      <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#f59e0b,transparent)' }} />
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>⚙️</span> Distributed Systems &amp; Scale
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, margin: 0 }}>
                        Design scalable blueprints covering load balancing, replication, network protocols, database sharding, and latency bottlenecks.
                      </p>
                    </div>

                    {/* 150-200 Word Topic Summary */}
                    <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(251,191,36,0.03))', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📚</span> Topic Summary &amp; Core Blueprint (150–200 Words)
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>~150 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        The System Design and Architecture loop tests your capacity to architect distributed, fault-tolerant, high-throughput systems that scale seamlessly across millions of active users. Interviewers grade candidates on defining clear system requirements, estimating capacity scale (QPS, storage, bandwidth), and structuring modular component blueprints. Key topics include selecting between SQL and NoSQL database paradigms, implementing multi-tier caching strategies with Redis or Memcached, setting up load balancers, and utilizing asynchronous message queues like Kafka or RabbitMQ to decouple worker processing. Candidates must demonstrate deep understanding of fundamental distributed systems principles, including the CAP theorem, database sharding, replication topologies, consistent hashing, and API gateway routing. Address real-world challenges such as single points of failure, rate limiting, data consistency trade-offs, and monitoring observability to prove your ability to design robust, enterprise-scale engineering infrastructure.
                      </p>
                    </div>

                    {renderFlashcardsAndCheatsheets(3)}
                  </motion.div>
                )}

                {/* Round 4: Behavioral & Fit Contents */}
                {activeRound === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ ...S.card }}>
                      <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#ec4899,transparent)' }} />
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>🤝</span> Leadership &amp; Soft Skills Focus
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.6, margin: 0 }}>
                        Expect questions regarding past projects, handling conflicts, adapting to design changes, and prioritizing deliverables.
                        Use the <b>STAR method</b> (Situation, Task, Action, Result) to format your response with measurable metrics.
                      </p>
                    </div>

                    {/* 150-200 Word Topic Summary */}
                    <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(244,63,94,0.03))', border: '1px solid rgba(236,72,153,0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#ec4899', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📚</span> Topic Summary &amp; Core Blueprint (150–200 Words)
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(236,72,153,0.12)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>~153 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        The Behavioral and Leadership loop measures your emotional intelligence, cross-functional collaboration, technical communication, and alignment with organizational culture and engineering principles. Senior interviewers look for concrete examples of ownership, adaptability, and conflict resolution during high-stakes projects. Frame all responses using the structured STAR method: clearly describe the Situation, specify your designated Task, detail the concrete Action you personally took, and highlight the measurable Result achieved. Focus on highlighting personal initiative, trade-offs negotiated with product managers or engineering leads, and how you navigated technical disagreements respectfully. When asked about past failures, demonstrate growth by explaining root cause post-mortems and preventive measures implemented afterwards. Showing resilience under pressure, a growth mindset, mentoring junior teammates, and prioritizing team execution over individual ego signals top-tier software engineering leadership readiness.
                      </p>
                    </div>

                    <div style={{ ...S.card, background: 'rgba(236,72,153,0.02)', border: '1px solid rgba(236,72,153,0.15)' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#ec4899', margin: '0 0 10px' }}>FAANG Behavioral Checklist:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {["Tell me about a time you had a technical disagreement with a colleague. How did you resolve it?",
                          "Describe a challenging bug you fixed. What was the action taken and what did you learn?",
                          "How do you handle deadlines that seem unrealistic?"].map((qStr, qIdx) => (
                          <div key={qIdx} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                            <span style={{ color: '#ec4899' }}>❓</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{qStr}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {renderFlashcardsAndCheatsheets(4)}
                  </motion.div>
                )}

              </div>

              {/* RIGHT Column: Focus context cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 88 }}>
                
                {/* Round-specific matching Focus card */}
                {activeRound <= 2 ? (
                  <div style={S.card}>
                    <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#818cf8,transparent)' }} />
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={14} color="#818cf8" /> {company} General Focus
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                      {guide.company_focus}
                    </p>
                  </div>
                ) : (
                  <div style={{ ...S.card, background: 'rgba(251,191,36,0.02)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#fbbf24,transparent)' }} />
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={14} color="#f59e0b" /> Architecture Priority
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                      Focus loop targets system reliability, databases caching, load distribution policies, and partition strategies.
                    </p>
                  </div>
                )}

                {/* Resume bridge matching loop */}
                <div style={{ ...S.card, background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#10b981,transparent)' }} />
                  <h3 style={{ fontSize: 12, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} color="#10b981" /> Profile Connection
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                    {guide.resume_bridge}
                  </p>
                </div>

              </div>

            </div>

            {/* ── FAANG LOOP STRATEGY & ARCHITECTURAL TRADE-OFFS PLAYBOOK ── */}
            {(() => {
              const roundData = PLAYBOOK_DATA[activeRound]
              if (!roundData) return null

              return (
                <div style={{ ...S.card, padding: 32, background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))' }}>
                  <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: 'linear-gradient(90deg,transparent,#818cf8,transparent)' }} />
                  
                  {/* Playbook Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, borderBottom: '1px solid var(--glass-border)', paddingBottom: 20 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                          <Compass size={20} className="animate-spin-slow" />
                        </span>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.02em' }}>
                            {roundData.roundName} Playbook
                          </h3>
                          <p style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, margin: '2px 0 0' }}>
                            {company} Core Evaluation Blueprint
                          </p>
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(99,102,241,0.15)' }}>
                      Active Strategy
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', background: 'var(--glass-bg)', padding: '12px 16px', borderRadius: 12, borderLeft: '3px solid #818cf8' }}>
                    &ldquo;{roundData.tagline}&rdquo;
                  </p>

                  {/* Playbook Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    
                    {/* Left: Key Evaluation Signals */}
                    <div style={{ background: 'rgba(16,185,129,0.01)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
                        <CheckCircle size={16} /> Key Evaluation Signals
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {roundData.hiddenSignals.map((sig, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-heading)' }}>{sig.label}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{sig.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Red Flags to Avoid */}
                    <div style={{ background: 'rgba(239,68,68,0.01)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
                        <HelpCircle size={16} style={{ color: '#ef4444' }} /> Critical Red Flags
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {roundData.redFlags.map((flag, fIdx) => (
                          <div key={fIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              ⚠️ {flag.flag}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{flag.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Trade-offs Decision Matrix Section */}
                  <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
                      <Award size={16} style={{ color: '#f59e0b' }} /> {roundData.tradeoffsTitle}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {roundData.tradeoffs.map((item, tIdx) => (
                        <div key={tIdx} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-heading)', borderRight: '1px solid var(--glass-border)', paddingRight: 12 }}>
                            {item.decision}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {item.tradeoff}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Strategy Pro-Tips */}
                  <div style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 16 }}>
                    <h5 style={{ fontSize: 12, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} /> Masterclass Delivery Tips
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {roundData.proTips.map((tip, tipIdx) => (
                        <li key={tipIdx} style={{ fontSize: 12, color: 'var(--text-color)', lineHeight: 1.5 }}>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )
            })()}

          </div>
        ) : null}

      </div>
      
      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#f97316" />
      <PageTour
        steps={REVISION_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#f97316"
      />
    </PageWrapper>
  )
}
