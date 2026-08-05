import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, Search, Sparkles, Plus, Trash2,
  ChevronDown, ChevronUp, Lock, Crown, CheckCircle, XCircle,
  Download, Copy, RotateCcw, Briefcase, GraduationCap,
  Code2, FolderOpen, User, Award, Loader2, Tag, AlertTriangle,
  TrendingUp, ExternalLink, Star, Check, Zap, Globe, CheckSquare, LayoutList
} from 'lucide-react'
import resumeService from '@/services/resumeService'
import { useAuth } from '@/context/AuthContext'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const RESUME_TOUR_STEPS = [
  {
    target: 'resume-header',
    title: '📄 Resume Hub',
    description: 'Build, audit, and export ATS-friendly resumes. Your resume skills automatically drive your learning roadmap and interview lab context.',
    color: '#06b6d4',
    placement: 'bottom',
  },
  {
    target: 'resume-tabs',
    title: '🗂️ Hub Features',
    description: 'Switch between Builder (manual editing), ATS Audit (score check), JD Matcher (job description tailoring), and Upload & Parse (PDF extraction).',
    color: '#3b82f6',
    placement: 'bottom',
  },
]

// ─── Template definitions ────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic ATS',
    tier: 'free',
    atsScore: 99,
    desc: 'Single-column, serif, ultra ATS-safe',
    accent: '#1e293b',
  },
  {
    id: 'modern',
    name: 'Modern Developer',
    tier: 'free',
    atsScore: 94,
    desc: 'Clean sans-serif with colored skill tags',
    accent: '#6366f1',
  },
  {
    id: 'executive',
    name: 'Executive Lead',
    tier: 'premium',
    atsScore: 88,
    desc: 'Two-column sidebar, rich header card',
    accent: '#0f172a',
  },
  {
    id: 'nexora',
    name: 'Nexora Verified',
    tier: 'premium',
    atsScore: 91,
    desc: 'Nexora badge + verified seal, dark accent',
    accent: '#4f46e5',
  },
]

// ─── Default empty resume structure ─────────────────────────────────────────
const EMPTY_RESUME = {
  personal_info: { name: '', title: '', location: '', email: '', phone: '', linkedin: '', github: '', website: '', summary: '' },
  experience: [],
  projects: [],
  skills: [
    { category: 'Languages', items: [] },
    { category: 'Frameworks', items: [] },
    { category: 'Tools', items: [] },
    { category: 'Databases', items: [] },
  ],
  education: [],
  certifications: [],
  custom_sections: [],
  target_role: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

function scoreColor(n) {
  if (n >= 80) return '#10b981'
  if (n >= 60) return '#f59e0b'
  if (n >= 40) return '#f97316'
  return '#ef4444'
}

function importanceBadge(imp) {
  const map = {
    high:   ['#fef2f2', '#dc2626'],
    medium: ['#fffbeb', '#d97706'],
    low:    ['#eef2ff', '#4f46e5'],
  }
  return map[imp] || map.medium
}

// ─── Skill Verification Question Bank ──────────────────────────────────────────────────────
const GENERIC_QS = [
  { q: 'What does "DRY" stand for in software development?', options: ['Don\'t Repeat Yourself', 'Dynamic Runtime Yield', 'Data Relay Yield', 'Directed Request Yield'], answer: 0 },
  { q: 'Which data structure uses LIFO (Last In, First Out) order?', options: ['Queue', 'Stack', 'Linked List', 'Hash Map'], answer: 1 },
  { q: 'What is the time complexity of binary search on a sorted array?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], answer: 2 },
]

const SKILL_QUESTIONS = {
  'Python': [
    { q: 'Which keyword is used to define a function in Python?', options: ['function', 'def', 'fun', 'func'], answer: 1 },
    { q: 'What does list slicing `a[1:4]` return?', options: ['Elements at index 1, 2, 3', 'Elements at index 1, 2, 3, 4', 'Elements from index 4 to 1', 'Element at index 1 only'], answer: 0 },
    { q: 'Which of the following is a mutable data type in Python?', options: ['tuple', 'str', 'list', 'int'], answer: 2 },
  ],
  'JavaScript': [
    { q: 'What does `===` check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Reference equality'], answer: 2 },
    { q: 'Which method adds an element to the end of a JavaScript array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], answer: 0 },
    { q: 'What is a closure in JavaScript?', options: ['A CSS property', 'A function that retains access to its outer scope', 'A type of loop', 'A promise handler'], answer: 1 },
  ],
  'TypeScript': [
    { q: 'Which TypeScript keyword is used to define an object\'s shape?', options: ['type', 'class', 'interface', 'Both type and interface'], answer: 3 },
    { q: 'What does the `?` symbol after a property in a TypeScript interface mean?', options: ['Required property', 'Optional property', 'Nullable only', 'Boolean type'], answer: 1 },
    { q: 'What command compiles TypeScript to JavaScript?', options: ['node compile', 'tsc', 'ts-run', 'babel ts'], answer: 1 },
  ],
  'React': [
    { q: 'Which hook manages local state in a React function component?', options: ['useEffect', 'useState', 'useContext', 'useRef'], answer: 1 },
    { q: 'What is the correct way to pass data from a parent to a child component?', options: ['State', 'Props', 'Context only', 'Redux only'], answer: 1 },
    { q: 'Which hook runs a side effect after every render by default?', options: ['useState', 'useMemo', 'useEffect', 'useCallback'], answer: 2 },
  ],
  'Node.js': [
    { q: 'What runtime environment does Node.js use?', options: ['SpiderMonkey', 'V8', 'JavaScriptCore', 'Chakra'], answer: 1 },
    { q: 'Which module is used to create an HTTP server in Node.js?', options: ['fs', 'path', 'http', 'net'], answer: 2 },
    { q: 'What is npm primarily used for?', options: ['Running tests', 'Managing packages/dependencies', 'Bundling CSS', 'Compiling TypeScript'], answer: 1 },
  ],
  'Java': [
    { q: 'Java programs run on which virtual machine?', options: ['CLR', 'JVM', 'Dalvik', 'LLVM'], answer: 1 },
    { q: 'Which keyword makes a Java class non-inheritable?', options: ['static', 'private', 'final', 'sealed'], answer: 2 },
    { q: 'What is the entry point of a Java application?', options: ['start()', 'init()', 'run()', 'main()'], answer: 3 },
  ],
  'C++': [
    { q: 'What is a pointer in C++?', options: ['A function', 'A variable that stores a memory address', 'A data structure', 'A class method'], answer: 1 },
    { q: 'Which operator is used for memory allocation in C++?', options: ['malloc()', 'alloc', 'new', 'create'], answer: 2 },
    { q: 'What does "OOP" stand for?', options: ['Object-Oriented Programming', 'Out-Of-Process', 'Open Output Protocol', 'Optimized Operation Processing'], answer: 0 },
  ],
  'SQL': [
    { q: 'Which SQL statement retrieves data from a table?', options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'], answer: 2 },
    { q: 'What does JOIN do in SQL?', options: ['Adds rows to a table', 'Combines rows from two or more tables', 'Deletes duplicate rows', 'Creates an index'], answer: 1 },
    { q: 'Which clause filters results after aggregation?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], answer: 1 },
  ],
  'PostgreSQL': [
    { q: 'PostgreSQL is which type of database?', options: ['Document-based NoSQL', 'Key-Value store', 'Relational (ACID-compliant)', 'Graph database'], answer: 2 },
    { q: 'Which data type stores variable-length text in PostgreSQL?', options: ['CHAR', 'TEXT / VARCHAR', 'BLOB', 'NCHAR'], answer: 1 },
    { q: 'What does the EXPLAIN command do in PostgreSQL?', options: ['Lists all tables', 'Shows the query execution plan', 'Exports data', 'Drops a table'], answer: 1 },
  ],
  'MongoDB': [
    { q: 'MongoDB stores data in which format?', options: ['Tables and rows', 'XML files', 'BSON documents', 'CSV files'], answer: 2 },
    { q: 'Which MongoDB method inserts a single document?', options: ['insertMany()', 'insertOne()', 'addOne()', 'create()'], answer: 1 },
    { q: 'What is a "collection" in MongoDB equivalent to in a relational DB?', options: ['Row', 'Column', 'Table', 'Schema'], answer: 2 },
  ],
  'Docker': [
    { q: 'What does a Dockerfile define?', options: ['A database schema', 'A set of instructions to build a Docker image', 'A network configuration', 'A CI/CD pipeline'], answer: 1 },
    { q: 'Which command runs a Docker container from an image?', options: ['docker build', 'docker start', 'docker run', 'docker exec'], answer: 2 },
    { q: 'What is the difference between a Docker image and a container?', options: ['No difference', 'Image is a running process; container is a blueprint', 'Image is a blueprint; container is a running instance', 'Containers are stored on Docker Hub'], answer: 2 },
  ],
  'Kubernetes': [
    { q: 'What is a Pod in Kubernetes?', options: ['A cluster node', 'A configuration file', 'The smallest deployable unit, containing one or more containers', 'A load balancer'], answer: 2 },
    { q: 'Which Kubernetes object ensures a specified number of Pod replicas are running?', options: ['Service', 'Ingress', 'ReplicaSet / Deployment', 'ConfigMap'], answer: 2 },
    { q: 'What is kubectl used for?', options: ['Building Docker images', 'Managing Kubernetes clusters via CLI', 'Running containers locally', 'Monitoring CPU usage'], answer: 1 },
  ],
  'AWS': [
    { q: 'What does S3 stand for in AWS?', options: ['Simple Server System', 'Simple Storage Service', 'Secure Scalable Storage', 'Standard Sync Service'], answer: 1 },
    { q: 'Which AWS service runs serverless functions?', options: ['EC2', 'ECS', 'Lambda', 'RDS'], answer: 2 },
    { q: 'What is an IAM role in AWS?', options: ['A database permission level', 'An identity with permissions assigned to AWS resources', 'A billing category', 'A load balancer configuration'], answer: 1 },
  ],
  'Git': [
    { q: 'Which Git command creates a new branch?', options: ['git branch <name>', 'git checkout -b <name>', 'Both of the above', 'git fork'], answer: 2 },
    { q: 'What does `git pull` do?', options: ['Pushes local changes to remote', 'Fetches and merges remote changes into local branch', 'Creates a new branch', 'Resets the staging area'], answer: 1 },
    { q: 'Which command stages all changes for a commit?', options: ['git commit -a', 'git add .', 'git stage', 'git track'], answer: 1 },
  ],
  'Django': [
    { q: 'Django follows which architectural pattern?', options: ['MVC', 'MVT (Model-View-Template)', 'MVVM', 'Microservices'], answer: 1 },
    { q: 'Which file defines URL routing in a Django app?', options: ['views.py', 'settings.py', 'urls.py', 'models.py'], answer: 2 },
    { q: 'What is Django ORM used for?', options: ['Handling HTTP requests', 'Rendering templates', 'Interacting with the database using Python objects', 'Managing static files'], answer: 2 },
  ],
  'Express': [
    { q: 'Express.js is a framework for which runtime?', options: ['Python', 'Ruby', 'Node.js', 'Deno only'], answer: 2 },
    { q: 'Which method handles HTTP GET requests in Express?', options: ['app.get()', 'app.fetch()', 'app.request()', 'app.receive()'], answer: 0 },
    { q: 'What is middleware in Express.js?', options: ['A database driver', 'A function that has access to req, res, and next', 'A templating engine', 'A CSS preprocessor'], answer: 1 },
  ],
  'REST APIs': [
    { q: 'Which HTTP method is used to update a resource?', options: ['GET', 'POST', 'PUT/PATCH', 'DELETE'], answer: 2 },
    { q: 'What does a 404 HTTP status code mean?', options: ['Server error', 'Unauthorized', 'Resource not found', 'Request successful'], answer: 2 },
    { q: 'Which HTTP status code indicates a successful resource creation?', options: ['200', '201', '204', '301'], answer: 1 },
  ],
  'GraphQL': [
    { q: 'In GraphQL, what is a "resolver"?', options: ['A database index', 'A function that fetches data for a field in a query', 'A type definition', 'A middleware'], answer: 1 },
    { q: 'Which GraphQL operation modifies data on the server?', options: ['Query', 'Subscription', 'Fragment', 'Mutation'], answer: 3 },
    { q: 'Compared to REST, GraphQL allows clients to:', options: ['Only fetch all fields', 'Fetch exactly the fields they need', 'Only use POST requests', 'Use XML responses'], answer: 1 },
  ],
  'Machine Learning': [
    { q: 'Which type of ML uses labeled training data?', options: ['Unsupervised Learning', 'Reinforcement Learning', 'Supervised Learning', 'Self-supervised Learning'], answer: 2 },
    { q: 'What is overfitting in ML models?', options: ['Model performs poorly on training data', 'Model fits training data too closely and fails on new data', 'Model is too simple', 'Model uses too little data'], answer: 1 },
    { q: 'What does a confusion matrix evaluate?', options: ['Model training speed', 'Classification model performance', 'Regression accuracy', 'Feature importance'], answer: 1 },
  ],
  'HTML': [
    { q: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Transfer Markup Language', 'Hyperlink Text Method Language', 'Hyper Tool Multi Language'], answer: 0 },
    { q: 'Which HTML tag creates a hyperlink?', options: ['<link>', '<href>', '<a>', '<url>'], answer: 2 },
    { q: 'Which HTML5 element defines navigation links?', options: ['<header>', '<section>', '<nav>', '<aside>'], answer: 2 },
  ],
  'CSS': [
    { q: 'Which CSS property controls the space between an element\'s border and its content?', options: ['margin', 'padding', 'border-spacing', 'gap'], answer: 1 },
    { q: 'What does `position: absolute` do?', options: ['Positions element relative to viewport', 'Positions relative to the nearest positioned ancestor', 'Removes from flow, relative to document', 'Sticks to the top of the page'], answer: 1 },
    { q: 'Which CSS property is used to create a flexbox container?', options: ['display: block', 'display: grid', 'display: flex', 'display: inline'], answer: 2 },
  ],
  'Redux': [
    { q: 'What is the single source of truth in Redux?', options: ['Component state', 'The Store', 'Context API', 'Props'], answer: 1 },
    { q: 'Which function creates a new state in Redux?', options: ['Action', 'Dispatcher', 'Reducer', 'Selector'], answer: 2 },
    { q: 'What does an Action in Redux contain?', options: ['Component JSX', 'A type and optional payload', 'The full state tree', 'A reducer function'], answer: 1 },
  ],
  'System Design': [
    { q: 'What is horizontal scaling?', options: ['Increasing CPU/RAM of one server', 'Adding more servers to distribute load', 'Optimizing database queries', 'Using a CDN'], answer: 1 },
    { q: 'What does CAP theorem state?', options: ['All distributed systems can achieve Consistency, Availability, and Partition tolerance simultaneously', 'A distributed system can only guarantee 2 out of Consistency, Availability, Partition tolerance', 'Systems must be consistent or available', 'Partitioning is always optional'], answer: 1 },
    { q: 'What is a load balancer used for?', options: ['Storing static files', 'Distributing incoming traffic across multiple servers', 'Caching database queries', 'Compressing images'], answer: 1 },
  ],
}

// ─── Skill Verification Modal ─────────────────────────────────────────────────────────────────────
function SkillVerifyModal({ skill, onPass, onClose }) {
  const questions = SKILL_QUESTIONS[skill] || GENERIC_QS
  const [step, setStep]       = useState(0)   // 0,1,2 = questions; 3 = result
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [shake, setShake]     = useState(false)

  useEffect(() => {
    const origOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = origOverflow
    }
  }, [])

  const q = questions[step]
  const total = questions.length
  const PASS_THRESHOLD = Math.ceil(total * 0.67)   // need ≧2/3

  const handleNext = () => {
    if (selected === null) { setShake(true); setTimeout(() => setShake(false), 500); return }
    const next = [...answers, selected]
    setAnswers(next)
    setSelected(null)
    if (step + 1 < total) { setStep(step + 1) }
    else {
      const score = next.filter((a, i) => a === questions[i].answer).length
      setStep(total)   // result screen
      if (score >= PASS_THRESHOLD) setTimeout(() => { onPass(skill); onClose() }, 1400)
    }
  }

  const score = step === total ? answers.filter((a, i) => a === questions[i].answer).length : 0
  const passed = score >= PASS_THRESHOLD

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        {/* Accent bar */}
        <div style={{ height: 3, background: step === total ? (passed ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#fb7185)') : 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }} />

        <div style={{ padding: 28 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--card-bg)' === '#1e293b' ? '#f1f5f9' : 'var(--text-heading)' }}>Skill Verification</span>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Prove you know <strong style={{ color: '#818cf8' }}>{skill}</strong> to add it to your resume
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          </div>

          {step < total ? (
            <>
              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {questions.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? '#6366f1' : 'var(--glass-border)', transition: 'background 0.3s' }} />
                ))}
              </div>

              {/* Question */}
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 18, lineHeight: 1.5, animation: shake ? 'headShake 0.5s' : 'none' }}>
                Q{step + 1}/{total}. {q.q}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => setSelected(i)}
                    style={{ padding: '12px 16px', borderRadius: 12, textAlign: 'left', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `2px solid ${selected === i ? '#6366f1' : 'var(--glass-border)'}`, background: selected === i ? 'rgba(99,102,241,0.12)' : 'var(--glass-bg)', color: selected === i ? '#818cf8' : 'var(--text-color)', transition: 'all 0.15s' }}>
                    <span style={{ fontWeight: 700, marginRight: 8, color: '#818cf8' }}>{String.fromCharCode(65 + i)}.</span>{opt}
                  </button>
                ))}
              </div>

              {/* Next / Submit */}
              <button onClick={handleNext} className="btn-primary"
                style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                {step + 1 === total ? 'Submit Answers' : 'Next Question →'}
              </button>
            </>
          ) : (
            /* Result screen */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{passed ? '🎉' : '😔'}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: passed ? '#10b981' : '#ef4444', marginBottom: 8 }}>
                {passed ? 'Skill Verified!' : 'Not Quite!'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                You scored <strong style={{ color: 'var(--text-heading)' }}>{score}/{total}</strong>.
                {passed ? ' — Adding skill to your resume…' : ` — You need at least ${PASS_THRESHOLD}/${total} to pass.`}
              </div>
              {!passed && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => { setStep(0); setAnswers([]); setSelected(null) }} className="btn-primary"
                    style={{ padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                    Try Again
                  </button>
                  <button onClick={onClose}
                    style={{ padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes headShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
    </div>,
    document.body
  )
}

// ─── Small reusable sub-components ───────────────────────────────────────────
function SectionTitle({ icon: Icon, label, color = '#818cf8' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <Icon size={18} color={color} />
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-heading)' }}>{label}</h2>
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
      borderRadius: 16, padding: 24, ...style
    }}>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text', rows }) {
  const props = { value, onChange: e => onChange(e.target.value), placeholder, type }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>}
      {rows ? (
        <textarea {...props} rows={rows} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
      ) : (
        <input {...props} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13 }} />
      )}
    </div>
  )
}

function TagInput({ tags, onChange, placeholder }) {
  const [val, setVal] = useState('')

  const tryAdd = () => {
    const t = val.trim()
    if (!t || tags.includes(t)) { setVal(''); return }
    onChange([...tags, t])
    setVal('')
  }
  const remove = (t) => onChange(tags.filter(x => x !== t))

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
            borderRadius: 20,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 12, color: '#818cf8'
          }}>
            {t}
            <button onClick={() => remove(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), tryAdd())}
          placeholder={placeholder || 'Type and press Enter'}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13 }} />
        <button onClick={tryAdd}
          style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Add
        </button>
      </div>
    </div>
  )
}

// ─── Builder Form Sub-sections ────────────────────────────────────────────────
function PersonalSection({ data, onChange }) {
  const set = (k) => (v) => onChange({ ...data, [k]: v })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ gridColumn: '1/-1' }}><Input label="Full Name" value={data.name || ''} onChange={set('name')} placeholder="John Doe" /></div>
      <Input label="Job Title" value={data.title || ''} onChange={set('title')} placeholder="Full Stack Developer" />
      <Input label="City / Location" value={data.location || ''} onChange={set('location')} placeholder="Mumbai, India" />
      <Input label="Email" value={data.email || ''} onChange={set('email')} placeholder="john@email.com" type="email" />
      <Input label="Phone" value={data.phone || ''} onChange={set('phone')} placeholder="+91 9876543210" />
      <Input label="LinkedIn URL" value={data.linkedin || ''} onChange={set('linkedin')} placeholder="https://linkedin.com/in/..." />
      <Input label="GitHub URL" value={data.github || ''} onChange={set('github')} placeholder="https://github.com/..." />
      <div style={{ gridColumn: '1/-1' }}><Input label="Website / Portfolio" value={data.website || ''} onChange={set('website')} placeholder="https://yourportfolio.com" /></div>
      <div style={{ gridColumn: '1/-1' }}><Input label="Professional Summary" value={data.summary || ''} onChange={set('summary')} placeholder="Brief 2–3 sentence professional summary..." rows={3} /></div>
    </div>
  )
}

function ExperienceSection({ items, onChange }) {
  const add = () => onChange([...items, { _id: uid(), company: '', role: '', location: '', start: '', end: '', current: false, bullets: [''] }])
  const update = (id, data) => onChange(items.map(x => x._id === id ? { ...x, ...data } : x))
  const remove = (id) => onChange(items.filter(x => x._id !== id))
  const addBullet = (id) => update(id, { bullets: [...(items.find(x => x._id === id)?.bullets || []), ''] })
  const setBullet = (id, i, v) => {
    const item = items.find(x => x._id === id)
    const bullets = [...(item.bullets || [])]
    bullets[i] = v
    update(id, { bullets })
  }
  const removeBullet = (id, i) => {
    const item = items.find(x => x._id === id)
    update(id, { bullets: (item.bullets || []).filter((_, j) => j !== i) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((exp) => (
        <div key={exp._id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{exp.role || 'New Experience'}</span>
            <button onClick={() => remove(exp._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Company" value={exp.company} onChange={v => update(exp._id, { company: v })} placeholder="Google" />
            <Input label="Role / Title" value={exp.role} onChange={v => update(exp._id, { role: v })} placeholder="Software Engineer" />
            <Input label="Location" value={exp.location} onChange={v => update(exp._id, { location: v })} placeholder="Remote / Bangalore" />
            <Input label="Start" value={exp.start} onChange={v => update(exp._id, { start: v })} placeholder="Jan 2023" />
            {/* End Date in left cell, checkbox in right cell — using a label spacer so input baselines match */}
            <Input label="End Date" value={exp.current ? 'Present' : exp.end} onChange={v => update(exp._id, { end: v })} placeholder="Dec 2024" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'transparent', userSelect: 'none' }}>_</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', height: 43, boxSizing: 'border-box' }}>
                <input type="checkbox" id={`cur-${exp._id}`} checked={exp.current} onChange={e => update(exp._id, { current: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#111111', flexShrink: 0 }} />
                <label htmlFor={`cur-${exp._id}`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Currently working here</label>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Bullet Points</label>
            {(exp.bullets || []).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input value={b} onChange={e => setBullet(exp._id, i, e.target.value)} placeholder="Achieved X by doing Y, resulting in Z..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13 }} />
                <button onClick={() => removeBullet(exp._id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => addBullet(exp._id)} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>+ Add Bullet</button>
          </div>
        </div>
      ))}
      <button onClick={add} style={{ padding: '10px', borderRadius: 10, border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Plus size={14} /> Add Experience
      </button>
    </div>
  )
}

function ProjectsSection({ items, onChange }) {
  const add = () => onChange([...items, { _id: uid(), name: '', tech_stack: [], description: '', url: '', bullets: [''] }])
  const update = (id, data) => onChange(items.map(x => x._id === id ? { ...x, ...data } : x))
  const remove = (id) => onChange(items.filter(x => x._id !== id))
  const addBullet = (id) => update(id, { bullets: [...(items.find(x => x._id === id)?.bullets || []), ''] })
  const setBullet = (id, i, v) => {
    const item = items.find(x => x._id === id)
    const bullets = [...(item.bullets || [])]
    bullets[i] = v
    update(id, { bullets })
  }
  const removeBullet = (id, i) => {
    const item = items.find(x => x._id === id)
    update(id, { bullets: (item.bullets || []).filter((_, j) => j !== i) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((proj) => (
        <div key={proj._id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{proj.name || 'New Project'}</span>
            <button onClick={() => remove(proj._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input label="Project Name" value={proj.name} onChange={v => update(proj._id, { name: v })} placeholder="Nexora Platform" />
            <Input label="Live URL / GitHub" value={proj.url} onChange={v => update(proj._id, { url: v })} placeholder="https://github.com/..." />
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Tech Stack</label>
              <TagInput tags={proj.tech_stack || []} onChange={v => update(proj._id, { tech_stack: v })} placeholder="React, Node.js, PostgreSQL..." />
            </div>
            <Input label="Description" value={proj.description} onChange={v => update(proj._id, { description: v })} placeholder="Brief description of the project..." rows={2} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Bullet Points</label>
            {(proj.bullets || []).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input value={b} onChange={e => setBullet(proj._id, i, e.target.value)} placeholder="Built X feature using Y, achieving Z result..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13 }} />
                <button onClick={() => removeBullet(proj._id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => addBullet(proj._id)} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>+ Add Bullet</button>
          </div>
        </div>
      ))}
      <button onClick={add} style={{ padding: '10px', borderRadius: 10, border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Plus size={14} /> Add Project
      </button>
    </div>
  )
}

function SkillsSection({ groups, onChange }) {
  const updateGroup = (i, items) => {
    const next = [...groups]
    next[i] = { ...next[i], items }
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map((g, i) => (
        <div key={g.category || i}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: 8 }}>{g.category}</label>
          <TagInput
            tags={g.items || []}
            onChange={v => updateGroup(i, v)}
            placeholder={`Add ${g.category}...`}
          />
        </div>
      ))}
    </div>
  )
}

function EducationSection({ items, onChange }) {
  const add = () => onChange([...items, { _id: uid(), institution: '', degree: '', field: '', year: '', gpa: '' }])
  const update = (id, data) => onChange(items.map(x => x._id === id ? { ...x, ...data } : x))
  const remove = (id) => onChange(items.filter(x => x._id !== id))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((edu) => (
        <div key={edu._id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{edu.institution || 'New Education'}</span>
            <button onClick={() => remove(edu._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Institution" value={edu.institution} onChange={v => update(edu._id, { institution: v })} placeholder="IIT Bombay" />
            <Input label="Degree" value={edu.degree} onChange={v => update(edu._id, { degree: v })} placeholder="B.Tech" />
            <Input label="Field of Study" value={edu.field} onChange={v => update(edu._id, { field: v })} placeholder="Computer Science" />
            <Input label="Year" value={edu.year} onChange={v => update(edu._id, { year: v })} placeholder="2022" />
            <Input label="GPA / %ile" value={edu.gpa} onChange={v => update(edu._id, { gpa: v })} placeholder="8.5 / 10" />
          </div>
        </div>
      ))}
      <button onClick={add} style={{ padding: '10px', borderRadius: 10, border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Plus size={14} /> Add Education
      </button>
    </div>
  )
}

function CertificationsSection({ items, onChange }) {
  const add    = () => onChange([...items, { _id: uid(), name: '', issuer: '', year: '', url: '' }])
  const update = (id, data) => onChange(items.map(x => x._id === id ? { ...x, ...data } : x))
  const remove = (id) => onChange(items.filter(x => x._id !== id))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((cert) => (
        <div key={cert._id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{cert.name || 'New Certificate'}</span>
            <button onClick={() => remove(cert._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Certificate Name" value={cert.name || ''} onChange={v => update(cert._id, { name: v })} placeholder="AWS Certified Developer" />
            <Input label="Issuing Organization" value={cert.issuer || ''} onChange={v => update(cert._id, { issuer: v })} placeholder="Amazon Web Services" />
            <Input label="Year / Date" value={cert.year || ''} onChange={v => update(cert._id, { year: v })} placeholder="2024" />
            <Input label="Credential / LinkedIn URL" value={cert.url || ''} onChange={v => update(cert._id, { url: v })} placeholder="https://linkedin.com/learning/... or https://credential.net/..." />
          </div>
          {cert.url ? (
            <p style={{ fontSize: 11, color: '#10b981', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>✓ Credential URL saved — will appear as a clickable link in preview & PDF</p>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0' }}>💡 Add a LinkedIn or credential URL so it shows up in your resume preview and PDF as a clickable link.</p>
          )}
        </div>
      ))}
      <button onClick={add} style={{ padding: '10px', borderRadius: 10, border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Plus size={14} /> Add Certificate
      </button>
    </div>
  )
}

function CustomSectionsSection({ items, onChange }) {
  const addSection = () => onChange([...(items || []), { _id: uid(), title: '', items: [''] }])
  const updateSection = (id, data) => onChange((items || []).map(x => x._id === id ? { ...x, ...data } : x))
  const removeSection = (id) => onChange((items || []).filter(x => x._id !== id))

  const addItem = (secId) => {
    const sec = (items || []).find(x => x._id === secId)
    if (sec) updateSection(secId, { items: [...(sec.items || []), ''] })
  }
  const setItem = (secId, i, val) => {
    const sec = (items || []).find(x => x._id === secId)
    if (sec) {
      const list = [...(sec.items || [])]
      list[i] = val
      updateSection(secId, { items: list })
    }
  }
  const removeItem = (secId, i) => {
    const sec = (items || []).find(x => x._id === secId)
    if (sec) {
      updateSection(secId, { items: (sec.items || []).filter((_, j) => j !== i) })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(items || []).map((sec) => (
        <div key={sec._id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{sec.title || 'New Additional Section'}</span>
            <button onClick={() => removeSection(sec._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
          </div>
          <Input label="Section Title" value={sec.title || ''} onChange={v => updateSection(sec._id, { title: v })} placeholder="e.g. Languages Spoken, Soft Skills, Achievements, Awards..." />
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Section Items / Bullets</label>
            {(sec.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input value={item} onChange={e => setItem(sec._id, i, e.target.value)} placeholder="Item detail..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13 }} />
                <button onClick={() => removeItem(sec._id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => addItem(sec._id)} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>+ Add Item</button>
          </div>
        </div>
      ))}
      <button onClick={addSection} style={{ padding: '10px', borderRadius: 10, border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Plus size={14} /> Add Custom / Additional Section (e.g. Languages, Soft Skills, Achievements)
      </button>
    </div>
  )
}

// ─── Resume Preview Templates ────────────────────────────────────────────────
function ClassicPreview({ resume }) {
  const pi = resume.personal_info || {}
  const allSkills = (resume.skills || []).flatMap(g => g.items || [])
  return (
    <div id="resume-preview" style={{ fontFamily: 'Georgia, serif', color: '#1e293b', padding: '32px 40px', background: '#fff', fontSize: 12, lineHeight: 1.5, minHeight: 700 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{pi.name || 'Your Name'}</div>
        <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{pi.title || 'Your Title'}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
          {[pi.email, pi.phone, pi.location, pi.linkedin && 'LinkedIn', pi.github && 'GitHub', pi.website].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* Summary */}
      {pi.summary && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 6 }}>Summary</div>
          <p style={{ margin: 0, color: '#334155' }}>{pi.summary}</p>
        </div>
      )}

      {/* Experience */}
      {(resume.experience || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 8 }}>Experience</div>
          {resume.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>{e.role}</span>
                <span style={{ color: '#64748b' }}>{e.start}{(e.start || e.end) ? '–' : ''}{e.current ? 'Present' : e.end}</span>
              </div>
              <div style={{ color: '#475569', fontStyle: 'italic' }}>{e.company}{e.location ? `, ${e.location}` : ''}</div>
              {(e.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                <div key={j} style={{ paddingLeft: 12, color: '#334155' }}>• {b}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {(resume.projects || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 8 }}>Projects</div>
          {resume.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>
                {p.name}
                {p.tech_stack?.length > 0 && (
                  <span style={{ fontWeight: 400, color: '#64748b', fontStyle: 'italic' }}> ({p.tech_stack.join(', ')})</span>
                )}
                {p.url && (
                  <span style={{ fontWeight: 400, color: '#6366f1', marginLeft: 6, fontSize: 11 }}>{p.url}</span>
                )}
              </div>
              {p.description && <div style={{ color: '#334155', marginTop: 2 }}>{p.description}</div>}
              {(p.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                <div key={j} style={{ paddingLeft: 12, color: '#334155' }}>• {b}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 6 }}>Skills</div>
          {(resume.skills || []).filter(g => g.items?.length > 0).map((g, i) => (
            <div key={i} style={{ marginBottom: 4, color: '#334155' }}>
              <span style={{ fontWeight: 700 }}>{g.category}: </span>{g.items.join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {(resume.education || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 8 }}>Education</div>
          {resume.education.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div><span style={{ fontWeight: 700 }}>{e.degree}{e.field ? ` in ${e.field}` : ''}</span> — {e.institution}{e.gpa ? ` (${e.gpa})` : ''}</div>
              <div style={{ color: '#64748b', flexShrink: 0, marginLeft: 12 }}>{e.year}</div>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {(resume.certifications || []).filter(c => c.name).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 8 }}>Certifications</div>
          {resume.certifications.filter(c => c.name).map((c, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><span style={{ fontWeight: 700 }}>{c.name}</span>{c.issuer ? ` — ${c.issuer}` : ''}</div>
                <div style={{ color: '#64748b' }}>{c.year}</div>
              </div>
              {c.url && <div style={{ fontSize: 10, color: '#6366f1', marginTop: 1 }}><a href={c.url} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{c.url}</a></div>}
            </div>
          ))}
        </div>
      )}

      {/* Custom Sections */}
      {(resume.custom_sections || []).filter(s => s.title && s.items?.length > 0).map((sec, si) => (
        <div key={si} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 8 }}>{sec.title}</div>
          {sec.items.map((item, ii) => (
            <div key={ii} style={{ paddingLeft: 12, color: '#334155', marginBottom: 2 }}>• {item}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ModernPreview({ resume }) {
  const pi = resume.personal_info || {}
  return (
    <div id="resume-preview" style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', background: '#fff', minHeight: 700, fontSize: 12 }}>
      {/* Header */}
      <div style={{ background: '#6366f1', padding: '24px 32px', color: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{pi.name || 'Your Name'}</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{pi.title || 'Your Title'}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, flexWrap: 'wrap', opacity: 0.85 }}>
          {pi.email && <span>✉ {pi.email}</span>}
          {pi.phone && <span>📱 {pi.phone}</span>}
          {pi.location && <span>📍 {pi.location}</span>}
          {pi.github && <span>⌥ {pi.github.replace('https://github.com/', '@').replace('https://github.com/', '')}</span>}
          {pi.linkedin && <span>🔗 LinkedIn</span>}
        </div>
      </div>
      <div style={{ padding: '20px 32px' }}>
        {pi.summary && <p style={{ margin: '0 0 16px', color: '#475569', lineHeight: 1.6 }}>{pi.summary}</p>}

        {/* Skills */}
        {(resume.skills || []).filter(g => g.items?.length > 0).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Skills</div>
            {resume.skills.filter(g => g.items?.length > 0).map((g, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: '#475569' }}>{g.category}: </span>
                {g.items.map((t, j) => (
                  <span key={j} style={{ margin: '0 4px 4px 0', display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 11 }}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {(resume.experience || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Experience</div>
            {resume.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '3px solid #e0e7ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>{e.role}</span>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>{e.start}{(e.start || e.end) ? '–' : ''}{e.current ? 'Present' : e.end}</span>
                </div>
                <div style={{ color: '#6366f1', fontSize: 11, marginBottom: 4 }}>{e.company}{e.location ? ` · ${e.location}` : ''}</div>
                {(e.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                  <div key={j} style={{ color: '#475569' }}>• {b}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {(resume.projects || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Projects</div>
            {resume.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '3px solid #e0e7ff' }}>
                <div style={{ fontWeight: 700 }}>
                  {p.name}
                  {p.url && <span style={{ fontWeight: 400, color: '#6366f1', marginLeft: 8, fontSize: 11 }}>{p.url}</span>}
                </div>
                {p.tech_stack?.length > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    {p.tech_stack.map((t, j) => (
                      <span key={j} style={{ margin: '0 4px 4px 0', display: 'inline-block', padding: '1px 7px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontSize: 10 }}>{t}</span>
                    ))}
                  </div>
                )}
                {p.description && <div style={{ color: '#475569', marginBottom: 4 }}>{p.description}</div>}
                {(p.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                  <div key={j} style={{ color: '#475569' }}>• {b}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {(resume.education || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Education</div>
            {resume.education.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div><span style={{ fontWeight: 700 }}>{e.degree}{e.field ? ` — ${e.field}` : ''}</span> — {e.institution}{e.gpa ? ` (${e.gpa})` : ''}</div>
                <span style={{ color: '#94a3b8', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{e.year}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {(resume.certifications || []).filter(c => c.name).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Certifications</div>
            {resume.certifications.filter(c => c.name).map((c, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>★ <span style={{ fontWeight: 700 }}>{c.name}</span>{c.issuer ? ` — ${c.issuer}` : ''}</div>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>{c.year}</span>
                </div>
                {c.url && <div style={{ fontSize: 10, color: '#6366f1', marginTop: 1 }}><a href={c.url} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{c.url}</a></div>}
              </div>
            ))}
          </div>
        )}

        {/* Custom Sections */}
        {(resume.custom_sections || []).filter(s => s.title && s.items?.length > 0).map((sec, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{sec.title}</div>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{ color: '#475569', marginBottom: 3 }}>• {item}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ExecutivePreview({ resume }) {
  const pi = resume.personal_info || {}
  return (
    <div id="resume-preview" style={{ fontFamily: "'Inter', sans-serif", display: 'flex', minHeight: 700, background: '#fff', fontSize: 12 }}>
      {/* Sidebar */}
      <div style={{ width: 210, background: '#0f172a', color: '#fff', padding: '24px 16px', flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{pi.name || 'Your Name'}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{pi.title || 'Your Title'}</div>
        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>Contact</div>
        {pi.email && <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 3, wordBreak: 'break-all' }}>{pi.email}</div>}
        {pi.phone && <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 3 }}>{pi.phone}</div>}
        {pi.location && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>📍 {pi.location}</div>}
        {pi.linkedin && <div style={{ fontSize: 11, color: '#818cf8', marginBottom: 3 }}>LinkedIn</div>}
        {pi.github && <div style={{ fontSize: 11, color: '#818cf8', marginBottom: 3 }}>GitHub</div>}
        {(resume.skills || []).filter(g => g.items?.length > 0).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>Skills</div>
            {resume.skills.filter(g => g.items?.length > 0).map((g, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{g.category}</div>
                {g.items.map((t, j) => <div key={j} style={{ fontSize: 11, color: '#cbd5e1' }}>• {t}</div>)}
              </div>
            ))}
          </div>
        )}
        {(resume.certifications || []).filter(c => c.name).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>Certifications</div>
            {resume.certifications.filter(c => c.name).map((c, i) => (
              <div key={i} style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 4 }}>★ {c.name}</div>
            ))}
          </div>
        )}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: '24px 24px' }}>
        {pi.summary && <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, color: '#475569', lineHeight: 1.6, borderLeft: '4px solid #0f172a' }}>{pi.summary}</div>}

        {/* Experience */}
        {(resume.experience || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#0f172a', borderBottom: '2px solid #0f172a', paddingBottom: 4, marginBottom: 10 }}>Experience</div>
            {resume.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{e.role}</span>
                  <span style={{ color: '#94a3b8' }}>{e.start}{(e.start || e.end) ? '–' : ''}{e.current ? 'Present' : e.end}</span>
                </div>
                <div style={{ color: '#475569', fontStyle: 'italic', marginBottom: 4 }}>{e.company}{e.location ? ` · ${e.location}` : ''}</div>
                {(e.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                  <div key={j} style={{ color: '#334155', paddingLeft: 10 }}>• {b}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {(resume.projects || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#0f172a', borderBottom: '2px solid #0f172a', paddingBottom: 4, marginBottom: 10 }}>Projects</div>
            {resume.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {p.name}
                  {p.tech_stack?.length > 0 && <span style={{ fontWeight: 400, color: '#475569', fontSize: 11 }}> ({p.tech_stack.join(', ')})</span>}
                  {p.url && <span style={{ fontWeight: 400, color: '#6366f1', fontSize: 11, marginLeft: 6 }}>{p.url}</span>}
                </div>
                {p.description && <div style={{ color: '#475569', marginBottom: 4, fontStyle: 'italic' }}>{p.description}</div>}
                {(p.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                  <div key={j} style={{ color: '#334155', paddingLeft: 10 }}>• {b}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {(resume.education || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#0f172a', borderBottom: '2px solid #0f172a', paddingBottom: 4, marginBottom: 10 }}>Education</div>
            {resume.education.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div><span style={{ fontWeight: 700 }}>{e.degree}{e.field ? ` — ${e.field}` : ''}</span> — {e.institution}{e.gpa ? ` (${e.gpa})` : ''}</div>
                <span style={{ color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>{e.year}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom Sections */}
        {(resume.custom_sections || []).filter(s => s.title && s.items?.length > 0).map((sec, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#0f172a', borderBottom: '2px solid #0f172a', paddingBottom: 4, marginBottom: 10 }}>{sec.title}</div>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{ color: '#334155', paddingLeft: 10, marginBottom: 2 }}>• {item}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function NexoraPreview({ resume }) {
  const pi = resume.personal_info || {}
  return (
    <div id="resume-preview" style={{ fontFamily: "'Inter', sans-serif", background: '#fff', minHeight: 700, fontSize: 12, position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '24px 32px', color: '#fff', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{pi.name || 'Your Name'}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{pi.title || 'Your Title'}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, opacity: 0.8, flexWrap: 'wrap' }}>
              {[pi.email, pi.phone, pi.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
            </div>
          </div>
          {/* Nexora Verified Badge */}
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 18 }}>✦</div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, opacity: 0.9 }}>NEXORA</div>
            <div style={{ fontSize: 8, opacity: 0.7 }}>VERIFIED</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', minHeight: 500 }}>
        {/* Sidebar */}
        <div style={{ background: '#f1f5f9', padding: '20px 16px' }}>
          {(resume.skills || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 10, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Skills</div>
              {resume.skills.map((g, i) => g.items?.length > 0 && (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>{g.category}</div>
                  {g.items.map((t, j) => <div key={j} style={{ fontSize: 11, color: '#475569' }}>• {t}</div>)}
                </div>
              ))}
            </div>
          )}
          {(resume.certifications || []).filter(c => c.name).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 10, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Certifications</div>
              {resume.certifications.filter(c => c.name).map((c, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: '#475569' }}>★ {c.name}</div>
                  {c.url && <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#6366f1', wordBreak: 'break-all' }}>{c.url}</a>}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Main */}
        <div style={{ padding: '20px 24px' }}>
          {pi.summary && <p style={{ margin: '0 0 14px', color: '#475569', lineHeight: 1.6, borderLeft: '3px solid #4f46e5', paddingLeft: 12 }}>{pi.summary}</p>}

          {/* Experience */}
          {(resume.experience || []).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Experience</div>
              {resume.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700 }}>{e.role} — {e.company}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{e.start}{(e.start || e.end) ? '–' : ''}{e.current ? 'Present' : e.end}</span>
                  </div>
                  {e.location && <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>{e.location}</div>}
                  {(e.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                    <div key={j} style={{ color: '#475569', paddingLeft: 10 }}>• {b}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {(resume.projects || []).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Projects</div>
              {resume.projects.map((p, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700 }}>
                    {p.name}
                    {p.tech_stack?.length > 0 && <span style={{ fontWeight: 400, color: '#64748b', fontSize: 11 }}> ({p.tech_stack.join(', ')})</span>}
                    {p.url && <span style={{ fontWeight: 400, color: '#6366f1', fontSize: 11, marginLeft: 6 }}>{p.url}</span>}
                  </div>
                  {p.description && <div style={{ color: '#475569', marginBottom: 3 }}>{p.description}</div>}
                  {(p.bullets || []).filter(b => b && b.trim()).map((b, j) => (
                    <div key={j} style={{ color: '#475569', paddingLeft: 10 }}>• {b}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {(resume.education || []).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Education</div>
              {resume.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <div><b>{e.degree}{e.field ? ` — ${e.field}` : ''}</b> — {e.institution}{e.gpa ? ` (${e.gpa})` : ''}</div>
                  <span style={{ color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>{e.year}</span>
                </div>
              ))}
            </div>
          )}

          {/* Custom Sections */}
          {(resume.custom_sections || []).filter(s => s.title && s.items?.length > 0).map((sec, si) => (
            <div key={si} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{sec.title}</div>
              {sec.items.map((item, ii) => (
                <div key={ii} style={{ color: '#475569', paddingLeft: 10, marginBottom: 2 }}>• {item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PREVIEW_MAP = { classic: ClassicPreview, modern: ModernPreview, executive: ExecutivePreview, nexora: NexoraPreview }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResumePage() {
  const { user } = useAuth()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('resume')
  const [activeTab, setActiveTab] = useState('builder')
  const [resume, setResume] = useState(EMPTY_RESUME)
  const [activeTemplate, setActiveTemplate] = useState('classic')
  const [isPremium, setIsPremium] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Audit state
  const [targetRole, setTargetRole] = useState('')
  const [auditing, setAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState(null)

  // Upload state
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef()

  // Premium modal
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  // Active builder accordion step
  const [builderStep, setBuilderStep] = useState('personal')

  // JD Match state
  const [jobDescription, setJobDescription] = useState('')
  const [matching, setMatching] = useState(false)
  const [matchResult, setMatchResult] = useState(null)

  // Load resume on mount
  useEffect(() => {
    resumeService.getResume().then(res => {
      const data = res.data
      // Ensure _id keys for array items
      const hydrate = (arr) => (arr || []).map(x => ({ _id: uid(), ...x }))
      setResume({
        personal_info: { ...EMPTY_RESUME.personal_info, ...(data.personal_info || {}) },
        experience: hydrate(data.experience),
        projects: hydrate(data.projects),
        skills: data.skills?.length ? data.skills : EMPTY_RESUME.skills,
        education: hydrate(data.education),
        certifications: hydrate(data.certifications),
        custom_sections: data.custom_sections || [],
        target_role: data.target_role || '',
      })
      setIsPremium(data.is_premium_unlocked || false)
      if (data.ats_score) setAuditResult({ ats_score: data.ats_score, ...data.audit_report, target_role: data.target_role })
      if (data.target_role) setTargetRole(data.target_role)
    }).catch(() => {})
  }, [])

  // Strip _id before saving
  const stripIds = (arr) => (arr || []).map(({ _id, ...rest }) => rest)

  const handleSave = async () => {
    setSaving(true)
    try {
      await resumeService.saveResume({
        personal_info: resume.personal_info,
        experience: stripIds(resume.experience),
        projects: stripIds(resume.projects),
        skills: resume.skills,
        education: stripIds(resume.education),
        certifications: stripIds(resume.certifications),
        custom_sections: resume.custom_sections || [],
        target_role: resume.target_role,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleAudit = async () => {
    const roleToAudit = targetRole.trim() || resume.target_role || 'Software Developer'
    setAuditing(true)
    setAuditResult(null)
    // Save first so backend has latest data
    await resumeService.saveResume({
      personal_info: resume.personal_info,
      experience: stripIds(resume.experience),
      projects: stripIds(resume.projects),
      skills: resume.skills,
      education: stripIds(resume.education),
      certifications: stripIds(resume.certifications),
      custom_sections: resume.custom_sections || [],
      target_role: roleToAudit,
    }).catch(() => {})
    try {
      const res = await resumeService.runAudit(roleToAudit)
      setAuditResult(res.data)
    } finally {
      setAuditing(false)
    }
  }

  const TECH_KEYWORDS = [
    'React', 'Angular', 'Vue', 'Node.js', 'Node', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'ASP.NET',
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
    'HTML', 'CSS', 'Sass', 'TailwindCSS', 'Bootstrap', 'Redux', 'Webpack', 'Vite', 'Next.js', 'Nuxt.js',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Cassandra', 'Elasticsearch', 'DynamoDB',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Google Cloud', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible', 'Git', 'GitHub',
    'REST API', 'GraphQL', 'gRPC', 'Microservices', 'System Design', 'Algorithms', 'Data Structures', 'Machine Learning', 'Deep Learning',
    'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy', 'Agile', 'Scrum', 'DevOps', 'Jira'
  ]

  const handleJdMatch = async () => {
    const jdToMatch = jobDescription.trim() || resume.target_role || 'General Software Engineer Role'
    setMatching(true)
    setMatchResult(null)

    // Save first so backend has latest data
    await resumeService.saveResume({
      personal_info: resume.personal_info,
      experience: stripIds(resume.experience),
      projects: stripIds(resume.projects),
      skills: resume.skills,
      education: stripIds(resume.education),
      certifications: stripIds(resume.certifications),
      target_role: resume.target_role,
    }).catch(() => {})

    try {
      const res = await resumeService.tailorResume(jdToMatch)
      setMatchResult(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setMatching(false)
    }
  }

  const handleApplySuggestion = async (sug) => {
    const newResume = { ...resume }
    const { section, index, bullet_index, optimized } = sug

    if (section === 'experience' && newResume.experience[index]) {
      const bullets = [...(newResume.experience[index].bullets || [])]
      bullets[bullet_index] = optimized
      newResume.experience[index] = { ...newResume.experience[index], bullets }
    } else if (section === 'projects' && newResume.projects[index]) {
      const bullets = [...(newResume.projects[index].bullets || [])]
      bullets[bullet_index] = optimized
      newResume.projects[index] = { ...newResume.projects[index], bullets }
    }

    setResume(newResume)

    setSaving(true)
    try {
      await resumeService.saveResume({
        personal_info: newResume.personal_info,
        experience: stripIds(newResume.experience),
        projects: stripIds(newResume.projects),
        skills: newResume.skills,
        education: stripIds(newResume.education),
        certifications: stripIds(newResume.certifications),
        target_role: newResume.target_role,
      })

      if (matchResult && matchResult.suggestions) {
        const nextSuggestions = matchResult.suggestions.filter(s => 
          !(s.section === section && s.index === index && s.bullet_index === bullet_index)
        )
        const currentScore = matchResult.ats_score || 60
        const newScore = Math.min(98, currentScore + 6)
        setMatchResult(prev => ({
          ...prev,
          ats_score: newScore,
          summary: {
            ...prev.summary,
            suggested_bullet_edits_count: Math.max(0, (prev.summary?.suggested_bullet_edits_count || 1) - 1)
          },
          suggestions: nextSuggestions
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSkill = async (skill) => {
    // Determine category
    const langRegex = /^(python|javascript|typescript|java|c\+\+|c#|go|golang|rust|ruby|php|swift|kotlin|scala|html|css)$/i
    const dbRegex = /^(postgresql|mysql|mongodb|redis|sqlite|oracle|sql server|cassandra|elasticsearch|dynamodb)$/i
    const fwRegex = /^(react|angular|vue|django|flask|fastapi|spring boot|laravel|asp\.net|tailwind|tailwindcss|bootstrap|redux|webpack|vite|next\.js|nuxt\.js|express|node\.js|node)$/i
    
    let category = 'Tools'
    if (langRegex.test(skill)) {
      category = 'Languages'
    } else if (dbRegex.test(skill)) {
      category = 'Databases'
    } else if (fwRegex.test(skill)) {
      category = 'Frameworks'
    }

    const updatedSkills = (resume.skills || []).map(group => {
      if (group.category.toLowerCase() === category.toLowerCase()) {
        const items = [...(group.items || [])]
        if (!items.includes(skill)) items.push(skill)
        return { ...group, items }
      }
      return group
    })

    const newResume = { ...resume, skills: updatedSkills }
    setResume(newResume)

    // Save to backend
    setSaving(true)
    try {
      await resumeService.saveResume({
        personal_info: newResume.personal_info,
        experience: stripIds(newResume.experience),
        projects: stripIds(newResume.projects),
        skills: newResume.skills,
        education: stripIds(newResume.education),
        certifications: stripIds(newResume.certifications),
        target_role: newResume.target_role,
      })
      
      // Update local match results
      if (matchResult) {
        const currentMissing = matchResult.summary?.missing_skills || matchResult.missing || []
        const nextMissing = currentMissing.filter(s => s.toLowerCase() !== skill.toLowerCase())
        const currentScore = matchResult.ats_score || 60
        const newScore = Math.min(98, currentScore + 5)
        
        setMatchResult(prev => ({
          ...prev,
          ats_score: newScore,
          score: newScore,
          summary: {
            ...prev.summary,
            missing_skills_count: Math.max(0, (prev.summary?.missing_skills_count || currentMissing.length) - 1),
            missing_skills: nextMissing
          }
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const UPLOAD_STEPS = ['Reading file…', 'Extracting text…', 'AI parsing sections…', 'Running ATS audit…', 'Complete! ✓']

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadError('')
    setUploadStep(0)
    const stepInterval = setInterval(() => setUploadStep(s => Math.min(s + 1, 3)), 1200)

    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await resumeService.analyzeUpload(fd)
      clearInterval(stepInterval)
      setUploadStep(4)
      const data = res.data.resume
      const hydrate = (arr) => (arr || []).map(x => ({ _id: uid(), ...x }))
      setResume({
        personal_info: { ...EMPTY_RESUME.personal_info, ...(data.personal_info || {}) },
        experience: hydrate(data.experience),
        projects: hydrate(data.projects),
        skills: data.skills?.length ? data.skills : EMPTY_RESUME.skills,
        education: hydrate(data.education),
        certifications: hydrate(data.certifications),
        custom_sections: data.custom_sections || [],
        target_role: data.target_role || '',
      })
      setIsPremium(data.is_premium_unlocked || false)
      if (data.ats_score) {
        setAuditResult({ ats_score: data.ats_score, ...data.audit_report, target_role: data.target_role })
        setTargetRole(data.target_role || '')
      }
      setTimeout(() => {
        setUploading(false)
        setActiveTab('builder')
      }, 1000)
    } catch (err) {
      clearInterval(stepInterval)
      setUploadStep(0)
      setUploadError(err?.response?.data?.error || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const handleUnlockPremium = async () => {
    setUnlocking(true)
    try {
      await resumeService.unlockPremium()
      setIsPremium(true)
      setShowPremiumModal(false)
    } finally {
      setUnlocking(false)
    }
  }

  const handlePrint = async () => {
    const { jsPDF } = await import('jspdf')

    const pi     = resume.personal_info || {}
    const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW  = doc.internal.pageSize.getWidth()
    const pageH  = doc.internal.pageSize.getHeight()
    const margin = 15
    const col    = pageW - margin * 2
    let   y      = margin

    const checkPage = (needed = 6) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin }
    }

    // ── helpers ──────────────────────────────────────────────────────────────
    const text = (str, x, fontSize, style = 'normal', color = [30,30,30]) => {
      doc.setFont('helvetica', style)
      doc.setFontSize(fontSize)
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(String(str || ''), col - (x - margin))
      doc.text(lines, x, y)
      y += lines.length * fontSize * 0.38 + 1
    }

    const hRule = (thick = false) => {
      doc.setDrawColor(thick ? 30 : 180, thick ? 30 : 180, thick ? 30 : 180)
      doc.setLineWidth(thick ? 0.5 : 0.2)
      doc.line(margin, y, pageW - margin, y)
      y += 3
    }

    const section = (title) => {
      checkPage(10)
      y += 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      doc.text(title.toUpperCase(), margin, y)
      y += 3
      hRule()
    }

    // ── Header ────────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(15, 15, 15)
    doc.text(pi.name || 'Your Name', margin, y)
    y += 8

    if (pi.title) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text(pi.title, margin, y)
      y += 6
    }

    const contacts = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github, pi.website].filter(Boolean)
    if (contacts.length) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      const contactLine = doc.splitTextToSize(contacts.join('  ·  '), col)
      doc.text(contactLine, margin, y)
      y += contactLine.length * 3.8 + 2
    }

    hRule(true)

    // ── Summary ───────────────────────────────────────────────────────────────
    if (pi.summary) {
      section('Summary')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(40, 40, 40)
      const lines = doc.splitTextToSize(pi.summary, col)
      checkPage(lines.length * 4)
      doc.text(lines, margin, y)
      y += lines.length * 3.6 + 2
    }

    // ── Experience ────────────────────────────────────────────────────────────
    if (resume.experience?.length) {
      section('Experience')
      for (const exp of resume.experience) {
        checkPage(10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(20, 20, 20)
        doc.text(exp.role || '', margin, y)

        const rightText = [exp.start_date, exp.end_date].filter(Boolean).join(' – ')
        if (rightText) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(100, 100, 100)
          const tw = doc.getTextWidth(rightText)
          doc.text(rightText, pageW - margin - tw, y)
        }
        y += 4.5

        if (exp.company || exp.location) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)
          doc.text([exp.company, exp.location].filter(Boolean).join(', '), margin, y)
          y += 4
        }

        for (const bullet of exp.bullets || []) {
          checkPage(6)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(40, 40, 40)
          const lines = doc.splitTextToSize('• ' + bullet, col - 4)
          doc.text(lines, margin + 2, y)
          y += lines.length * 3.5 + 0.5
        }
        y += 2
      }
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    if (resume.projects?.length) {
      section('Projects')
      for (const proj of resume.projects) {
        checkPage(10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(20, 20, 20)
        doc.text(proj.name || '', margin, y)
        y += 4.5

        if (proj.tech_stack) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8.5)
          doc.setTextColor(80, 80, 80)
          doc.text(proj.tech_stack, margin, y)
          y += 4
        }

        for (const bullet of proj.bullets || []) {
          checkPage(6)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(40, 40, 40)
          const lines = doc.splitTextToSize('• ' + bullet, col - 4)
          doc.text(lines, margin + 2, y)
          y += lines.length * 3.5 + 0.5
        }
        y += 2
      }
    }

    // ── Skills ────────────────────────────────────────────────────────────────
    if (resume.skills?.length) {
      section('Skills')
      for (const sg of resume.skills) {
        checkPage(5)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(40, 40, 40)
        const label = sg.category ? sg.category + ': ' : ''
        const items = (sg.items || []).join(', ')
        const full  = label + items
        const lines = doc.splitTextToSize(full, col)
        doc.text(lines, margin, y)
        y += lines.length * 3.8 + 1
      }
    }

    // ── Education ─────────────────────────────────────────────────────────────
    if (resume.education?.length) {
      section('Education')
      for (const edu of resume.education) {
        checkPage(8)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(20, 20, 20)
        doc.text(edu.degree || '', margin, y)

        const rightEdu = edu.grad_year ? String(edu.grad_year) : ''
        if (rightEdu) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(100, 100, 100)
          const tw = doc.getTextWidth(rightEdu)
          doc.text(rightEdu, pageW - margin - tw, y)
        }
        y += 4.5

        if (edu.institution) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(70, 70, 70)
          const ln = [edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join('  |  ')
          doc.text(ln, margin, y)
          y += 4
        }
        y += 1
      }
    }

    // ── Certifications ────────────────────────────────────────────────────────
    if (resume.certifications?.length) {
      section('Certifications')
      for (const cert of resume.certifications) {
        if (!cert.name) continue
        checkPage(10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(20, 20, 20)
        doc.text(cert.name || '', margin, y)
        y += 4
        const meta  = [cert.issuer, cert.year].filter(Boolean).join(', ')
        if (meta) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(80, 80, 80)
          doc.text(meta, margin, y)
          y += 4
        }
        if (cert.url) {
          checkPage(5)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(79, 70, 229)  // indigo
          const urlLines = doc.splitTextToSize(cert.url, col - 4)
          doc.textWithLink(urlLines[0], margin, y, { url: cert.url })
          y += urlLines.length * 3.4 + 1
        }
        y += 1
      }
    }

    // ── Custom Sections ───────────────────────────────────────────────────────
    if ((resume.custom_sections || []).filter(s => s.title && s.items?.length > 0).length > 0) {
      for (const sec of resume.custom_sections) {
        if (!sec.title || !sec.items?.length) continue
        section(sec.title)
        for (const item of sec.items) {
          checkPage(5)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(40, 40, 40)
          const lines = doc.splitTextToSize('• ' + item, col - 4)
          doc.text(lines, margin + 2, y)
          y += lines.length * 3.5 + 0.5
        }
        y += 2
      }
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const filename = `${(pi.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`
    doc.save(filename)
  }


  const PreviewComponent = PREVIEW_MAP[activeTemplate] || ClassicPreview

  const BUILDER_STEPS = [
    { key: 'personal',         label: 'Personal Info',     icon: User         },
    { key: 'experience',       label: 'Work Experience',   icon: Briefcase    },
    { key: 'projects',         label: 'Projects',          icon: FolderOpen   },
    { key: 'skills',           label: 'Skills',            icon: Code2        },
    { key: 'education',        label: 'Education',         icon: GraduationCap},
    { key: 'certifications',   label: 'Certifications',    icon: Award        },
    { key: 'custom_sections',  label: 'Custom / Extra Sections', icon: LayoutList },
  ]

  const TABS = [
    { key: 'builder', label: '📄 Builder', icon: FileText },
    { key: 'audit', label: '🔍 ATS Audit', icon: Search },
    { key: 'jd_match', label: '💼 JD Matcher', icon: CheckSquare },
    { key: 'upload', label: '⬆️ Upload & Parse', icon: Upload },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: '0 0 60px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 0' }}>
        {/* Page Header */}
        <div data-tour="resume-header" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={28} color="#818cf8" /> Resume Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Build, optimize, and download your ATS-ready resume. Your saved resume automatically personalizes your Interview Lab sessions.
          </p>
        </div>

        {/* Tab Bar */}
        <div data-tour="resume-tabs" style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 6, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={activeTab === t.key ? 'btn-primary' : ''}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                background: activeTab === t.key ? undefined : 'transparent',
                color: activeTab === t.key ? undefined : 'var(--text-muted)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Builder ──────────────────────────────────────────────── */}
        {activeTab === 'builder' && (
          <div>
            {/* Top Toolbar / Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 4 }}>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    background: !showPreview ? 'var(--btn-primary-bg)' : 'transparent',
                    color: !showPreview ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  ✏️ Edit Details
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    background: showPreview ? 'var(--btn-primary-bg)' : 'transparent',
                    color: showPreview ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  👁️ Preview Resume
                </button>
              </div>
            </div>

            {!showPreview ? (
              /* Center Form Layout */
              <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {BUILDER_STEPS.map(({ key, label, icon: Icon }) => (
                  <Card key={key} style={{ padding: 0, overflow: 'hidden' }}>
                    <button
                      onClick={() => setBuilderStep(builderStep === key ? null : key)}
                      style={{ width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} color="#818cf8" />
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)' }}>{label}</span>
                      </div>
                      {builderStep === key ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </button>
                    <AnimatePresence>
                      {builderStep === key && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--card-border)' }}>
                            <div style={{ height: 16 }} />
                            {key === 'personal'       && <PersonalSection data={resume.personal_info} onChange={v => setResume(r => ({ ...r, personal_info: v }))} />}
                            {key === 'experience'      && <ExperienceSection items={resume.experience} onChange={v => setResume(r => ({ ...r, experience: v }))} />}
                            {key === 'projects'        && <ProjectsSection items={resume.projects} onChange={v => setResume(r => ({ ...r, projects: v }))} />}
                            {key === 'skills'          && <SkillsSection groups={resume.skills} onChange={v => setResume(r => ({ ...r, skills: v }))} />}
                            {key === 'education'       && <EducationSection items={resume.education} onChange={v => setResume(r => ({ ...r, education: v }))} />}
                            {key === 'certifications'  && <CertificationsSection items={resume.certifications || []} onChange={v => setResume(r => ({ ...r, certifications: v }))} />}
                            {key === 'custom_sections' && <CustomSectionsSection items={resume.custom_sections || []} onChange={v => setResume(r => ({ ...r, custom_sections: v }))} />}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}

                {/* Bottom Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className={saved ? '' : 'btn-primary'}
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, background: saved ? '#10b981' : undefined, color: saved ? '#fff' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : saved ? <><Check size={16} /> Saved!</> : 'Save Resume'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPreview(true)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    Preview Resume 👁️
                  </motion.button>
                </div>
              </div>
            ) : (
              /* Center Preview Layout */
              <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Template Switcher */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  {TEMPLATES.map(t => {
                    const locked = t.tier === 'premium' && !isPremium
                    return (
                      <div key={t.id} onClick={() => locked ? setShowPremiumModal(true) : setActiveTemplate(t.id)}
                        style={{ position: 'relative', padding: '12px', borderRadius: 12, border: `2px solid ${activeTemplate === t.id && !locked ? '#6366f1' : 'var(--card-border)'}`, background: 'var(--card-bg)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', overflow: 'hidden' }}>
                        {locked && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', borderRadius: 10 }}>
                            <Lock size={16} color="#fbbf24" />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginTop: 4 }}>Premium</span>
                          </div>
                        )}
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.accent, margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)' }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>ATS {t.atsScore}%</div>
                      </div>
                    )
                  })}
                </div>

                {/* Preview Canvas */}
                <Card style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Live Preview — {TEMPLATES.find(t => t.id === activeTemplate)?.name}</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setShowPreview(false)}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)' }}>
                        ✏️ Edit Form
                      </button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrint}
                        className="btn-primary"
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download size={13} /> Download PDF
                      </motion.button>
                    </div>
                  </div>
                  <div style={{ overflow: 'auto', maxHeight: '78vh' }}>
                    <div style={{ padding: 24, display: 'flex', justifyContent: 'center', background: 'var(--scrollbar-track)' }}>
                      <div style={{ width: '794px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <PreviewComponent resume={resume} />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ATS Audit ───────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <SectionTitle icon={Search} label="ATS Score Analyzer" color="#818cf8" />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 18px' }}>
                Enter your target role and we'll analyze your saved resume against real ATS standards. Make sure to save your resume from the Builder first.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAudit()}
                  placeholder="e.g. React Frontend Developer, Backend Python Engineer…"
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 14 }}
                />
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAudit} disabled={auditing}
                  className={auditing ? '' : 'btn-primary'}
                  style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: auditing ? '#475569' : undefined, color: auditing ? '#fff' : undefined, fontWeight: 800, fontSize: 14, cursor: auditing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  {auditing ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><Sparkles size={16} /> Run ATS Audit</>}
                </motion.button>
              </div>
            </Card>

            <AnimatePresence>
              {auditResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Score Gauge */}
                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--glass-border)" strokeWidth="12" />
                          <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor(auditResult.ats_score)} strokeWidth="12"
                            strokeDasharray={`${(auditResult.ats_score / 100) * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 26, fontWeight: 900, color: scoreColor(auditResult.ats_score) }}>{auditResult.ats_score}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>ATS Score</span>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 4 }}>
                          {auditResult.ats_score >= 80 ? '🟢 ATS Ready!' : auditResult.ats_score >= 60 ? '🟡 Needs Improvement' : '🔴 Major Issues Found'}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                          Analyzed for: <strong style={{ color: 'var(--text-heading)' }}>{auditResult.target_role || targetRole}</strong>
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Checklist */}
                  {auditResult.audit_report?.checklist && (
                    <Card>
                      <SectionTitle icon={CheckCircle} label="ATS Compatibility Checklist" color="#10b981" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {Object.entries(auditResult.audit_report.checklist || auditResult.checklist || {}).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: v ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${v ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                            {v ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                            <span style={{ fontSize: 12, color: 'var(--text-color)', fontWeight: 500 }}>
                              {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Keyword Gaps */}
                  {(auditResult.audit_report?.keyword_gaps || auditResult.keyword_gaps || []).length > 0 && (
                    <Card>
                      <SectionTitle icon={Tag} label="Missing Keywords" color="#f59e0b" />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {(auditResult.audit_report?.keyword_gaps || auditResult.keyword_gaps || []).map((kg, i) => {
                          const [bg, textCol] = importanceBadge(kg.importance)
                          return (
                            <div key={i} title={kg.reason} style={{ padding: '6px 14px', borderRadius: 20, background: bg, border: `1px solid ${textCol}44`, display: 'flex', alignItems: 'center', gap: 6, cursor: 'help' }}>
                              <AlertTriangle size={11} color={textCol} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: textCol }}>{kg.keyword}</span>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Strengths & Weaknesses */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Card>
                      <SectionTitle icon={TrendingUp} label="Strengths" color="#10b981" />
                      {(auditResult.audit_report?.strengths || auditResult.strengths || []).map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                          <CheckCircle size={13} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--text-color)' }}>{s}</span>
                        </div>
                      ))}
                    </Card>
                    <Card>
                      <SectionTitle icon={AlertTriangle} label="Weaknesses" color="#f59e0b" />
                      {(auditResult.audit_report?.weaknesses || auditResult.weaknesses || []).map((w, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                          <XCircle size={13} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--text-color)' }}>{w}</span>
                        </div>
                      ))}
                    </Card>
                  </div>

                  {/* AI Tips */}
                  {(auditResult.audit_report?.tips || auditResult.tips || []).length > 0 && (
                    <Card>
                      <SectionTitle icon={Sparkles} label="AI Improvement Tips" color="#818cf8" />
                      {(auditResult.audit_report?.tips || auditResult.tips || []).map((t, i) => {
                        const pri = t.priority || 'medium'
                        const [bg, col] = { high: ['rgba(239,68,68,0.08)', '#ef4444'], medium: ['rgba(245,158,11,0.08)', '#f59e0b'], low: ['rgba(99,102,241,0.08)', '#818cf8'] }[pri] || ['rgba(99,102,241,0.08)', '#818cf8']
                        return (
                          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10, background: bg, marginBottom: 8 }}>
                            <Zap size={14} color={col} style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>{pri} Priority</span>
                              <span style={{ fontSize: 13, color: 'var(--text-color)' }}>{t.tip}</span>
                            </div>
                          </div>
                        )
                      })}
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── TAB: JD Matcher ───────────────────────────────────────────── */}
        {activeTab === 'jd_match' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 24, alignItems: 'start' }}>
            
            {/* Left: Original Live Resume Preview */}
            <div style={{ position: 'sticky', top: 24 }}>
              <Card style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Original Resume Preview ({TEMPLATES.find(t => t.id === activeTemplate)?.name})</span>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrint}
                    className="btn-primary"
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={13} /> Download PDF
                  </motion.button>
                </div>
                <div style={{ overflow: 'auto', maxHeight: '75vh' }}>
                  <div style={{ zoom: 0.72, transformOrigin: 'top left' }}>
                    <PreviewComponent resume={resume} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Job Description Optimizer Desk */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <SectionTitle icon={CheckSquare} label="Job Description Skill Matcher" color="#818cf8" />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 18px' }}>
                  Paste the target job description below. Nexora AI will audit your resume, calculate the ATS score, identify missing tech skills, and suggest bullet optimizations.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    rows={5}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleJdMatch} disabled={matching}
                    className={matching ? '' : 'btn-primary'}
                    style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: matching ? '#475569' : undefined, color: matching ? '#fff' : undefined, fontWeight: 800, fontSize: 14, cursor: matching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'flex-start' }}>
                    {matching ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Matching…</> : <><Sparkles size={16} /> Audit & Tailor Resume</>}
                  </motion.button>
                </div>
              </Card>

              <AnimatePresence>
                {matchResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Summary Card (Top) */}
                    <Card>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                          <svg width="90" height="90" viewBox="0 0 90 90">
                            <circle cx="45" cy="45" r="38" fill="none" stroke="var(--glass-border)" strokeWidth="8" />
                            <circle cx="45" cy="45" r="38" fill="none" stroke={scoreColor(matchResult.ats_score)} strokeWidth="8"
                              strokeDasharray={`${(matchResult.ats_score / 100) * 238} 238`} strokeLinecap="round" transform="rotate(-90 45 45)" />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: scoreColor(matchResult.ats_score) }}>{matchResult.ats_score}%</span>
                            <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>ATS Fit</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 4 }}>
                            {matchResult.ats_score >= 80 ? '👑 High Match Rating!' : matchResult.ats_score >= 50 ? '⚡ Gaps Identified' : '⚠️ Low Resume Match'}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                            Missing Skills Count: <strong style={{ color: 'var(--text-color)' }}>{matchResult.summary?.missing_skills_count || 0}</strong> | Suggested Bullet Edits: <strong style={{ color: 'var(--text-color)' }}>{matchResult.summary?.suggested_bullet_edits_count || 0}</strong>
                          </p>
                          {matchResult.summary?.missing_skills?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                              {matchResult.summary.missing_skills.map(s => (
                                <span key={s} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.15)' }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                    <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <SectionTitle icon={Sparkles} label="Tailoring Suggestions" color="#6366f1" />
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                        Review suggested changes below. Click "Apply Rewrite" to merge improvements directly into your active resume.
                      </p>
                      {(!matchResult.suggestions || matchResult.suggestions.length === 0) ? (
                        <div style={{ padding: '24px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#10b981', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                          ✓ None! Your resume is already fully tailored to this job description.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {matchResult.suggestions.map((sug, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', position: 'relative' }}>
                              
                              {/* Suggestion Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#818cf8', letterSpacing: 0.5 }}>
                                  {sug.section === 'experience' ? 'Experience' : 'Project'} Bullet #{sug.bullet_index + 1}
                                </span>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => handleApplySuggestion(sug)}
                                  className="btn-primary"
                                  style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  Apply Rewrite
                                </motion.button>
                              </div>

                              {/* Suggestion Body */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 12.5, color: '#f87171', paddingLeft: 8, borderLeft: '2px solid #ef4444' }}>
                                  <span style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#f87171', display: 'block', marginBottom: 2 }}>Original:</span>
                                  {sug.original}
                                </div>
                                <div style={{ fontSize: 12.5, color: '#34d399', paddingLeft: 8, borderLeft: '2px solid #10b981' }}>
                                  <span style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#34d399', display: 'block', marginBottom: 2 }}>AI Optimized:</span>
                                  {sug.optimized}
                                </div>
                                {sug.reason && (
                                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                                    💡 <b>Reason:</b> {sug.reason}
                                  </div>
                                )}
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

        {/* ── TAB 3: Upload & Parse ──────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <SectionTitle icon={Upload} label="Upload Existing Resume" color="#818cf8" />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>
                Upload your PDF or TXT resume and our AI will automatically extract and populate all sections in the Builder. We'll also run an instant ATS audit.
              </p>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFileUpload(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#6366f1' : 'var(--glass-border)'}`,
                  borderRadius: 16,
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(99,102,241,0.06)' : 'var(--glass-bg)',
                  transition: 'all 0.3s',
                  animation: dragging ? 'none' : undefined,
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0])} />
                <Upload size={40} color={dragging ? '#6366f1' : 'var(--text-muted)'} style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>
                  {dragging ? 'Drop your resume here!' : 'Drag & drop your resume'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse · PDF and TXT supported</div>
              </div>

              {/* Upload Progress Steps */}
              <AnimatePresence>
                {uploading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {UPLOAD_STEPS.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < uploadStep ? '#10b981' : i === uploadStep ? 'rgba(99,102,241,0.15)' : 'var(--glass-bg)', border: `2px solid ${i < uploadStep ? '#10b981' : i === uploadStep ? '#6366f1' : 'var(--glass-border)'}`, flexShrink: 0 }}>
                            {i < uploadStep ? <Check size={13} color="#fff" /> : i === uploadStep ? <Loader2 size={13} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} /> : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i + 1}</span>}
                          </div>
                          <span style={{ fontSize: 13, color: i <= uploadStep ? 'var(--text-heading)' : 'var(--text-muted)', fontWeight: i === uploadStep ? 700 : 400 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {uploadError && (
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} /> {uploadError}
                </div>
              )}
            </Card>

            <Card style={{ background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Sparkles size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', marginBottom: 4 }}>AI Extracts Everything</div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                    Our AI reads your resume and automatically fills in Personal Info, Work Experience with bullet points, Projects with tech stack, Skills categorized by type, Education, Certifications, and Custom Sections (like Languages, Soft Skills, Achievements, etc.). You can edit any section in the Builder.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── Premium Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={() => setShowPremiumModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 36, maxWidth: 440, width: '90%', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={28} color="#fff" />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: 'var(--text-heading)' }}>Upgrade to Nexora Pro</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
                Unlock premium templates including the exclusive <strong>Nexora Verified Badge</strong> template, plus AI-powered resume tailoring.
              </p>
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
                {['Executive Lead template', 'Nexora Verified Badge template', 'AI resume tailoring (coming soon)', 'Priority ATS analysis'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                    <Star size={13} color="#f59e0b" />
                    <span style={{ fontSize: 13, color: 'var(--text-color)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-heading)', marginBottom: 4 }}>₹299 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>/month</span></div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 20px' }}>Demo mode — simulated purchase, no real payment</p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleUnlockPremium} disabled={unlocking}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: unlocking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {unlocking ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <><Crown size={16} /> Simulate Purchase &amp; Unlock</>}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#06b6d4" />
      <PageTour
        steps={RESUME_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#06b6d4"
      />
    </div>
  )
}
