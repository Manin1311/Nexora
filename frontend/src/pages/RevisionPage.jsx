import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Compass, Award, Zap, HelpCircle, CheckCircle, Loader2, ListChecks } from 'lucide-react'
import api from '@/services/api'
import PageWrapper from '@/components/layout/PageWrapper'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'
import { cacheGet, cacheSet } from '@/services/cache'

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

const COMPANY_PROFILES = {
  Google: {
    focus: "Google loops evaluate Big-O algorithmic speed, MapReduce/Spanner distributed concepts, Go/C++/Java concurrency, and Googley 5 attributes.",
    blueprint: "Focus on MapReduce data pipelines, Monorepo code standards, Protocol Buffers (gRPC), Spanner database consistency, and micro-optimization under high QPS.",
    signals: [
      { label: "Algorithmic Precision", desc: "Demonstrating fast discrete math and Big-O runtime analysis under time constraints." },
      { label: "Spanner & Distributed Scale", desc: "Understanding TrueTime atomic clocks, Multi-Region replication, and consistent hashing." },
      { label: "Googliness & Ownership", desc: "Navigating ambiguous requirements with intellectual humility and collaborative problem-solving." }
    ],
    redFlags: [
      { flag: "Big-O Ignorance", detail: "Coding without analyzing space and time complexity bounds before implementation." },
      { flag: "Scale Oversight", detail: "Failing to ask about scale boundaries (e.g. 100M daily active users)." },
      { flag: "Rigid Thinking", detail: "Defending a single solution without exploring alternative algorithmic trade-offs." }
    ]
  },
  Netflix: {
    focus: "Netflix loops evaluate microservice fault tolerance, Chaos Engineering resilience, high-concurrency Java/RxJava streaming pipelines, and Freedom & Responsibility culture.",
    blueprint: "Focus on client-side load balancing (Ribbon/Eureka), Hystrix/Resilience4j circuit breakers, Cassandra NoSQL sharding, and real-time telemetry.",
    signals: [
      { label: "Chaos Engineering", desc: "Designing systems that gracefully degrade during regional dependency outages." },
      { label: "High-Throughput Streaming", desc: "Optimizing video playback telemetry, async event loops, and Cassandra row partitioning." },
      { label: "Freedom & Responsibility", desc: "Demonstrating high individual ownership, direct feedback, and self-management." }
    ],
    redFlags: [
      { flag: "Single Point of Failure", detail: "Designing microservices without circuit breakers or fallback degraded UI states." },
      { flag: "Tight Coupling", detail: "Creating synchronous cascading dependencies across streaming microservices." },
      { flag: "Blamestorming", detail: "Attributing past failures to cross-team friction rather than systemic resilience gaps." }
    ]
  },
  Amazon: {
    focus: "Amazon loops evaluate deep Operational Excellence, AWS cloud architecture, DynamoDB single-table sharding, and strict alignment with Amazon's 16 Leadership Principles.",
    blueprint: "Focus on DynamoDB partition key design, SQS message queues, Lambda serverless concurrency limits, and Customer Obsession STAR stories.",
    signals: [
      { label: "Customer Obsession", desc: "Working backwards from customer pain points to drive technical architectural choices." },
      { label: "Operational Excellence", desc: "Understanding p99 latency metrics, CloudWatch alarms, and post-mortem root cause analysis." },
      { label: "Frugality & Scale", desc: "Optimizing cloud resource consumption and AWS infrastructure costs." }
    ],
    redFlags: [
      { flag: "Lack of Ownership", detail: "Not taking direct personal responsibility for past production incidents." },
      { flag: "Over-Engineering", detail: "Building unnecessarily complex solutions instead of simple, scalable architectures." },
      { flag: "Superficial Metrics", detail: "Discussing system scale without quoting concrete numerical benchmarks." }
    ]
  },
  Meta: {
    focus: "Meta loops evaluate rapid problem-solving speed (2 coding questions in 45 min), GraphQL/React UI performance, Hack/C++ backend services, and Move Fast culture.",
    blueprint: "Focus on fast recursive/iterative DSA execution, Relay/GraphQL query batching, RocksDB storage engines, and high-frequency real-time feed architectures.",
    signals: [
      { label: "Rapid DSA Execution", desc: "Solving 2 algorithmic problems cleanly within a single 45-minute interview block." },
      { label: "Product & UI Architecture", desc: "Understanding optimistic updates, GraphQL query caching, and normalized client state." },
      { label: "Move Fast", desc: "Unblocking team dependencies quickly and executing with pragmatic iteration." }
    ],
    redFlags: [
      { flag: "Slow Coding Velocity", detail: "Spending more than 20 minutes on a single medium DSA problem." },
      { flag: "Analysis Paralysis", detail: "Over-thinking initial code structure instead of iteratively refining the implementation." },
      { flag: "Ignoring Client Scale", detail: "Failing to consider mobile memory constraints and network payload serialization." }
    ]
  },
  Microsoft: {
    focus: "Microsoft loops evaluate enterprise system reliability, Azure cloud integrations, C#/.NET & TypeScript ecosystems, and growth mindset collaboration.",
    blueprint: "Focus on Cosmos DB multi-master replication, ASP.NET Core middleware pipelines, enterprise security/RBAC, and clean SOLID OOP design.",
    signals: [
      { label: "SOLID Architecture", desc: "Designing clean, modular interfaces with clear separation of concerns." },
      { label: "Growth Mindset", desc: "Embracing constructive feedback during the interview and iterating rapidly." },
      { label: "Enterprise Security", desc: "Incorporating OAuth2/OIDC, RBAC, and encryption standards into system blueprints." }
    ],
    redFlags: [
      { flag: "Tightly-Coupled Monoliths", detail: "Creating rigid class hierarchies that violate interface segregation." },
      { flag: "Defensiveness", detail: "Reacting negatively when the interviewer suggests an alternative design approach." },
      { flag: "Neglecting Security", detail: "Storing credentials or tokens in plain text without secret vaults." }
    ]
  },
  Apple: {
    focus: "Apple loops evaluate low-level system performance, C++/Swift memory management, hardware-software integration, and extreme attention to detail.",
    blueprint: "Focus on ARC/manual memory allocation, thread safety, Metal/Core ML optimizations, zero-downtime client sync, and privacy-first architectures.",
    signals: [
      { label: "Low-Level Efficiency", desc: "Managing CPU cache lines, thread pools, and memory layout to prevent latency spikes." },
      { label: "Privacy-First Design", desc: "Building on-device computation features that protect user data integrity." },
      { label: "Craftsmanship & Detail", desc: "Demonstrating meticulous attention to code readability, edge cases, and API design." }
    ],
    redFlags: [
      { flag: "Memory Leaks", detail: "Failing to account for retain cycles, race conditions, or unmanaged thread locks." },
      { flag: "Casual Security Stance", detail: "Sending unencrypted telemetry data over public networks." },
      { flag: "Unpolished Code", detail: "Writing messy, poorly named functions without clear parameter boundaries." }
    ]
  },
  Stripe: {
    focus: "Stripe loops evaluate financial-grade API idempotency, ACID ledger database consistency, developer experience, and zero-downtime deployments.",
    blueprint: "Focus on idempotency keys, distributed transaction locks (Saga pattern), Postgres serializable isolation levels, and developer-friendly REST/SDK design.",
    signals: [
      { label: "Financial Idempotency", desc: "Guaranteeing that duplicate API requests never result in double payment executions." },
      { label: "Developer Ergonomics", desc: "Designing intuitive, self-describing REST APIs with clear error codes and documentation." },
      { label: "ACID Consistency", desc: "Managing multi-table database transactions with strict isolation levels." }
    ],
    redFlags: [
      { flag: "Non-Idempotent Writes", detail: "Allowing mutation endpoints to execute repeatedly on network timeout retries." },
      { flag: "Ignoring Edge Cases", detail: "Failing to handle partial failures during multi-step financial workflows." },
      { flag: "Poor API Design", detail: "Exposing internal implementation details or cryptic error responses." }
    ]
  }
}

const COMPANY_TECH_MATRIX = {
  Google: {
    stack: "Go, C++, Java, MapReduce, Spanner, gRPC / Protocol Buffers, Borg",
    dsaFocus: "Big-O space/time mathematical rigor, graph algorithms (BFS/DFS, Dijkstra), Tries, and dry-running code methodically",
    systemFocus: "Spanner distributed transactions, TrueTime atomic synchronization, gRPC microservices, and Borg container scheduling",
    cultureFocus: "Googliness, intellectual humility, collaborative problem solving, and navigating ambiguous requirements"
  },
  Amazon: {
    stack: "Java, Kotlin, AWS Lambda, DynamoDB, SQS, Kinesis, CloudWatch",
    dsaFocus: "clean production-ready OOP code, sliding window algorithms, tree/graph problems, and O(1) hash map lookups",
    systemFocus: "DynamoDB single-table partition key design, SQS queue decoupling, Lambda serverless scaling, and p99 latency monitoring",
    cultureFocus: "Amazon's 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Frugality)"
  },
  Meta: {
    stack: "Hack, C++, Python, React, Relay, GraphQL, RocksDB, Memcached, Tao",
    dsaFocus: "rapid execution velocity (solving 2 LeetCode Medium/Hard in 45 min), top-k heap patterns, and instantaneous Big-O analysis",
    systemFocus: "GraphQL query federation, Relay client state normalization, RocksDB key-value engines, and Tao social graph database",
    cultureFocus: "Move Fast, Focus on Impact, Be Direct & Candid, and driving unblocked team velocity"
  },
  Netflix: {
    stack: "Java, RxJava, Spring Boot, Resilience4j, Cassandra NoSQL, Eureka, Ribbon",
    dsaFocus: "concurrency, thread-safe data structures, non-blocking I/O event loops, and stream processing",
    systemFocus: "Chaos Engineering fault injection, Resilience4j circuit breakers, Cassandra NoSQL sharding, and Eureka service discovery",
    cultureFocus: "Freedom & Responsibility, Context Not Control, High Density of Talent, and transparent peer feedback"
  },
  Microsoft: {
    stack: "C#, .NET Core, TypeScript, Azure Cosmos DB, Azure Service Bus, Fluent UI",
    dsaFocus: "SOLID OOP design principles, recursion, tree/graph traversals, and clean maintainable code structure",
    systemFocus: "Cosmos DB multi-master replication, ASP.NET Core middleware pipelines, Azure Service Bus, and Enterprise RBAC security",
    cultureFocus: "Growth Mindset, One Microsoft collaboration, customer empathy, and receptive attitude to interviewer hints"
  },
  Apple: {
    stack: "Swift, Objective-C, C++, Metal, CoreML, CloudKit, macOS/iOS internals",
    dsaFocus: "low-level algorithm efficiency, ARC memory management, CPU cache lines, and thread synchronization",
    systemFocus: "on-device computation, CloudKit device synchronization, Secure Enclave encryption, and low-latency edge delivery",
    cultureFocus: "obsessive craftsmanship, attention to micro-details, privacy as a fundamental human right, and code elegance"
  },
  Stripe: {
    stack: "Ruby, Go, Java, TypeScript, PostgreSQL, Redis, Stripe Elements",
    dsaFocus: "real-world API execution, parsing complex JSON payloads, data transformation pipelines, and edge-case handling",
    systemFocus: "financial-grade idempotency keys, ACID ledger transactions in Postgres, Saga distributed transactions, and PCI-DSS compliance",
    cultureFocus: "developer ergonomics, financial integrity, micro-details matter, and long-term technical rigor"
  }
}

const getRoleBlueprint = (roundNum, comp, rTitle) => {
  const info = COMPANY_TECH_MATRIX[comp] || COMPANY_TECH_MATRIX.Google
  const primaryLang = info.stack.split(',')[0].trim()

  if (roundNum === 1) {
    return `The Resume Fit loop at ${comp} evaluates your ${rTitle} track record against ${comp}'s specific technology ecosystem (${info.stack}). ${comp} interviewers check whether you understand why specific frameworks and design patterns were selected. Quantify your contributions using measurable metrics such as latency reduction, query optimization, or operational scale at ${comp}.`
  }
  if (roundNum === 2) {
    return `The Coding & Algorithms loop at ${comp} for ${rTitle} candidates evaluates ${info.dsaFocus}. ${comp} engineers test how methodically you break down complex problems, write modular bug-free code in ${primaryLang}, and derive Big-O space and time complexity bounds.`
  }
  if (roundNum === 3) {
    return `The System Architecture loop at ${comp} evaluates your ability to design scalable, fault-tolerant platforms for ${rTitle} roles. ${comp} grades candidates on ${info.systemFocus}, defining system boundaries, capacity planning (QPS, storage), and selecting database paradigms.`
  }
  if (roundNum === 4) {
    return `The Behavioral & Leadership loop at ${comp} measures your emotional intelligence, cross-functional collaboration, and cultural alignment for ${rTitle} positions. ${comp} looks for alignment with ${info.cultureFocus}. Frame responses using the structured STAR method (Situation, Task, Action, Result) with quantitative impact metrics.`
  }
  return `The ${comp} interview loop for ${rTitle} candidates.`
}

const PLAYBOOK_DATA = {
  1: {
    roundName: "Resume Fit & Hiring Manager Screen",
    tagline: "Unlocking the hidden signals of ownership, scope, and technical depth.",
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
  const [guide, setGuide] = useState(() => {
    const c = cacheGet('revision-Google-Software Engineer', null)
    return c ? c.data : null
  })
  const [loading, setLoading] = useState(false)
  const [activeCardIdx, setActiveCardIdx] = useState(null)
  const [viewMode, setViewMode] = useState('flashcard')
  const [activeRound, setActiveRound] = useState(2)
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('revision')
  
  const fetchGuide = (silent = false) => {
    if (!silent) setLoading(true)
    const key = `revision-${company}-${role}`
    api.get(`/interviews/revision/?company=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}`)
      .then(res => {
        cacheSet(key, null, res.data)
        setGuide(res.data)
        if (!silent) setActiveCardIdx(null)
      })
      .catch(err => {
        console.error('Error compiling guide:', err)
      })
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => {
    const key = `revision-${company}-${role}`
    const cached = cacheGet(key, null)
    if (cached && !cached.stale) {
      setGuide(cached.data)
    } else if (cached && cached.stale) {
      setGuide(cached.data)
      fetchGuide(true)
    } else {
      fetchGuide(false)
    }
  }, [company, role])

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
                style={{ padding: '10px 24px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', height: 42, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
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
                <div style={{ position: 'absolute', left: 45, right: 45, height: 4, background: 'var(--glass-border)', zIndex: 1, top: '42%' }} />
                
                <div style={{
                  position: 'absolute',
                  left: 45,
                  width: `calc((100% - 90px) * ${(activeRound - 1) / 3})`,
                  height: 4,
                  background: 'linear-gradient(90deg, #10b981, #6366f1, #f59e0b, #ec4899)',
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
                          <span>📚</span> {company} {role} — Resume Screen Blueprint
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>~150 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        {getRoleBlueprint(1, company, role)}
                      </p>
                    </div>

                    <div style={{ ...S.card, background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#10b981', margin: '0 0 10px' }}>{company} Strategy Notes ({role}):</h4>
                      <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <li>Highlight metrics-driven impact (e.g. latency reduced by X%, load handled Y%).</li>
                        <li>Prepare 1-minute elevator pitch highlighting technical skills matching {role} at {company}.</li>
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
                        <span>💻</span> {company} Algorithms &amp; Problem Solving ({role})
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, margin: 0 }}>
                        Focus loops at {company} for {role} candidates evaluate code clarity, optimal time/space complexity, and edge case coverage. Practice key algorithmic structures.
                      </p>
                    </div>

                    {/* 150-200 Word Topic Summary */}
                    <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.03))', border: '1px solid rgba(99,102,241,0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#818cf8', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📚</span> {company} {role} — Coding Blueprint
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>~152 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        {getRoleBlueprint(2, company, role)}
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
                        <span>⚙️</span> {company} Distributed Systems &amp; Scale ({role})
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, margin: 0 }}>
                        Design scalable blueprints covering load balancing, replication, network protocols, database sharding, and latency bottlenecks for {company}'s scale.
                      </p>
                    </div>

                    {/* 150-200 Word Topic Summary */}
                    <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(251,191,36,0.03))', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📚</span> {company} {role} — System Architecture Blueprint
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>~150 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        {getRoleBlueprint(3, company, role)}
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
                        <span>🤝</span> {company} Leadership &amp; Behavioral Fit ({role})
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.6, margin: 0 }}>
                        Expect questions regarding past projects, handling conflicts, adapting to design changes, and prioritizing deliverables for {company}'s culture.
                        Use the <b>STAR method</b> (Situation, Task, Action, Result) to format your response with measurable metrics.
                      </p>
                    </div>

                    {/* 150-200 Word Topic Summary */}
                    <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(244,63,94,0.03))', border: '1px solid rgba(236,72,153,0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#ec4899', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📚</span> {company} {role} — Cultural Blueprint
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(236,72,153,0.12)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>~153 Words</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.75, margin: 0 }}>
                        {getRoleBlueprint(4, company, role)}
                      </p>
                    </div>

                    <div style={{ ...S.card, background: 'rgba(236,72,153,0.02)', border: '1px solid rgba(236,72,153,0.15)' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#ec4899', margin: '0 0 10px' }}>{company} Behavioral Checklist ({role}):</h4>
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

            {/* ── COMPANY LOOP STRATEGY & ARCHITECTURAL TRADE-OFFS PLAYBOOK ── */}
            {(() => {
              const roundData = PLAYBOOK_DATA[activeRound]
              const compProf = COMPANY_PROFILES[company] || COMPANY_PROFILES.Google
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
                            {company} {roundData.roundName} Playbook
                          </h3>
                          <p style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, margin: '2px 0 0' }}>
                            {company} ({role}) Core Evaluation Blueprint
                          </p>
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(99,102,241,0.15)' }}>
                      Active Strategy
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', background: 'var(--glass-bg)', padding: '12px 16px', borderRadius: 12, borderLeft: '3px solid #818cf8' }}>
                    &ldquo;{compProf.focus}&rdquo;
                  </p>

                  {/* Playbook Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    
                    {/* Left: Key Evaluation Signals */}
                    <div style={{ background: 'rgba(16,185,129,0.01)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
                        <CheckCircle size={16} /> {company} Evaluation Signals
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {compProf.signals.map((sig, sIdx) => (
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
                        <HelpCircle size={16} style={{ color: '#ef4444' }} /> {company} Critical Red Flags
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {compProf.redFlags.map((flag, fIdx) => (
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
