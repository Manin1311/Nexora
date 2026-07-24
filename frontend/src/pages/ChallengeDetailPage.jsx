import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Zap, Clock, CheckCircle, Send, Loader2, ChevronDown, ChevronUp, Code2, Award, Download } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { challengeService } from '@/services/challengeService'
import { useAuth } from '@/context/AuthContext'
import { downloadCertificatePDF } from '@/utils/certificatePDF'
import PageWrapper from '@/components/layout/PageWrapper'
import Avatar from '@/components/ui/Avatar'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import Confetti from '@/components/ui/Confetti'

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
  },
}

const diffStyle = d =>
  d === 'easy'   ? { color:'#34d399', background:'rgba(52,211,153,0.12)',  border:'1px solid rgba(52,211,153,0.3)'  } :
  d === 'hard'   ? { color:'#fb7185', background:'rgba(251,113,133,0.12)', border:'1px solid rgba(251,113,133,0.3)' } :
                   { color:'#fbbf24', background:'rgba(251,191,36,0.12)',  border:'1px solid rgba(251,191,36,0.3)'  }

const getBoilerplateByLanguage = (lang, challengeTopic = 'javascript') => {
  if (lang === 'python') {
    return `# Write your Python solution here\n\ndef solve():\n    # Your code goes here\n    pass\n`
  }
  if (lang === 'sql') {
    return `-- Write your SQL query here\n\nSELECT * FROM ...;\n`
  }
  if (lang === 'rust') {
    return `// Write your Rust solution here\n\nfn solve() {\n    // Your code goes here\n}\n`
  }
  if (lang === 'go') {
    return `// Write your Go solution here\npackage main\n\nfunc solve() {\n    // Your code goes here\n}\n`
  }
  if (lang === 'java') {
    return `// Write your Java solution here\n\nclass Solution {\n    public void solve() {\n        // Your code goes here\n    }\n}\n`
  }
  if (lang === 'cpp') {
    return `// Write your C++ solution here\n#include <iostream>\n\nvoid solve() {\n    // Your code goes here\n}\n`
  }
  if (lang === 'html') {
    return `<!-- Write your HTML / CSS markup here -->\n<div class="solution">\n    \n</div>\n`
  }
  if (lang === 'markdown') {
    const t = (challengeTopic || '').toLowerCase()
    let blockLang = 'javascript'
    let placeholder = '// Write your code snippet here'
    if (t.includes('python') || t.includes('django') || t.includes('fastapi')) {
      blockLang = 'python'
      placeholder = '# Write your Python code here'
    } else if (t.includes('sql') || t.includes('postgres') || t.includes('mysql') || t.includes('db')) {
      blockLang = 'sql'
      placeholder = '-- Write your SQL query here'
    } else if (t.includes('docker') || t.includes('kubernetes') || t.includes('k8s') || t.includes('aws') || t.includes('devops') || t.includes('git')) {
      blockLang = 'yaml'
      placeholder = '# Write your YAML config or Dockerfile instructions here'
    } else if (t.includes('rust')) {
      blockLang = 'rust'
      placeholder = '// Write your Rust code here'
    } else if (t.includes('go')) {
      blockLang = 'go'
      placeholder = '// Write your Go code here'
    } else if (t.includes('java')) {
      blockLang = 'java'
      placeholder = '// Write your Java code here'
    } else if (t.includes('cpp') || t.includes('c++')) {
      blockLang = 'cpp'
      placeholder = '// Write your C++ code here'
    } else if (t.includes('html') || t.includes('css')) {
      blockLang = 'html'
      placeholder = '<!-- Write your HTML/CSS code here -->'
    }

    return `# 1. Theory & Explanation\nWrite your conceptual explanation here...\n\n# 2. Code Implementation\n\`\`\`${blockLang}\n${placeholder}\n\n\`\`\`\n\n# 3. Gotchas & Trade-offs\n- Gotcha 1: ...\n`
  }
  return `// Write your solution here\n\nfunction solve() {\n    // Your code goes here\n}\n`
}

export default function ChallengeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, refreshUser } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submission, setSubmission] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [certificate, setCertificate] = useState(null)
  const [editorLanguage, setEditorLanguage] = useState('javascript')
  const [celebrate, setCelebrate] = useState(false)

  const handleLanguageChange = (newLang) => {
    const prevLang = editorLanguage
    setEditorLanguage(newLang)

    const prevBoilerplate = getBoilerplateByLanguage(prevLang, challenge?.topic?.name)
    if (!answer || answer.trim() === '' || answer.trim() === prevBoilerplate.trim()) {
      setAnswer(getBoilerplateByLanguage(newLang, challenge?.topic?.name))
    }
  }

  useEffect(() => {
    challengeService.getById(id)
      .then(r => {
        setChallenge(r.data)
        
        // Detect default language based on topic name and tags
        const tName = (r.data.topic?.name || '').toLowerCase()
        const tags = (r.data.tags || []).map(t => t.toLowerCase())
        
        const isConceptual = tags.some(t => t.includes('concept') || t.includes('theory') || t.includes('design') || t.includes('explain')) ||
                             tName.includes('docker') || tName.includes('kubernetes') || tName.includes('k8s') || tName.includes('aws') || tName.includes('devops') || tName.includes('git') ||
                             (r.data.title || '').toLowerCase().includes('concept') ||
                             (r.data.description || '').toLowerCase().includes('in your answer')
        
        let defaultLang = 'javascript'
        if (isConceptual) {
          defaultLang = 'markdown'
        } else if (tName.includes('python') || tName.includes('django') || tName.includes('fastapi')) {
          defaultLang = 'python'
        } else if (tName.includes('sql') || tName.includes('postgres') || tName.includes('mysql') || tName.includes('db')) {
          defaultLang = 'sql'
        } else if (tName.includes('rust')) {
          defaultLang = 'rust'
        } else if (tName.includes('go') && !tName.includes('django')) {
          defaultLang = 'go'
        } else if (tName.includes('java') && !tName.includes('javascript')) {
          defaultLang = 'java'
        } else if (tName.includes('c++') || tName.includes('cpp')) {
          defaultLang = 'cpp'
        } else if (tName.includes('html') || tName.includes('css')) {
          defaultLang = 'html'
        }
        
        setEditorLanguage(defaultLang)

        if (r.data.user_submission) {
          setSubmission(r.data.user_submission)
          setAnswer(r.data.user_submission.content || '')
          if (r.data.user_submission.certificate) {
            setCertificate(r.data.user_submission.certificate)
          }
        } else {
          setAnswer(getBoilerplateByLanguage(defaultLang, r.data.topic?.name))
        }
      })
      .catch(() => navigate('/challenges'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <PageWrapper>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'128px 0' }}>
        <div style={{ width:32, height:32, border:'2px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      </div>
    </PageWrapper>
  )

  if (!challenge) return null

  const isCompleted = submission?.status === 'evaluated'
  const score = submission?.score || 0
  const scoreColor = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#fb7185'

  return (
    <PageWrapper noPadding>
      <div className="container" style={{ paddingTop:28, paddingBottom:64 }}>

        {/* Back */}
        <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} style={{ marginBottom:20 }}>
          <Link to="/challenges" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'var(--text-muted)', textDecoration:'none', fontSize:14, fontWeight:500, transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--text-heading)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
            <ArrowLeft size={15} /> Back to Challenges
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            <span style={{ ...diffStyle(challenge.difficulty), padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:700, textTransform:'capitalize' }}>
              {challenge.difficulty}
            </span>
            {challenge.topic && (
              <span style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:600, background:'rgba(99,102,241,0.1)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.25)' }}>
                {challenge.topic.icon} {challenge.topic.name}
              </span>
            )}
            {challenge.challenge_type === 'daily' && (
              <span style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:700, background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.3)' }}>
                🔥 Daily
              </span>
            )}
            {isCompleted && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:700, background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.3)' }}>
                <CheckCircle size={11} /> Completed
              </span>
            )}
          </div>
          <h1 style={{ fontSize:'clamp(24px,3.5vw,38px)', fontWeight:900, color:'var(--text-heading)', marginBottom:12, letterSpacing:'-0.02em', lineHeight:1.2 }}>
            {challenge.title}
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'#818cf8', fontWeight:700, fontSize:15 }}>
              <Zap size={15} /> {challenge.xp_reward} XP Reward
            </div>
            {challenge.estimated_time && (
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', fontSize:14 }}>
                <Clock size={14} /> {challenge.estimated_time}
              </div>
            )}
          </div>
        </motion.div>

        {/* 2-col layout */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24, alignItems:'start' }} className="challenge-grid">

          {/* LEFT: Main content */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Description */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}>
              <div style={{ ...S.card, padding:24 }}>
                <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />
                <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text-heading)', marginBottom:14, display:'flex', alignItems:'center', gap:8, position:'relative', zIndex:1 }}>
                  <span style={{ width:32, height:32, borderRadius:8, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)' }}>
                    <Code2 size={15} style={{ color:'#818cf8' }} />
                  </span>
                  Challenge Description
                </h2>
                <p style={{ fontSize:14, color:'var(--text-color)', lineHeight:1.85, whiteSpace:'pre-wrap', position:'relative', zIndex:1 }}>
                  {challenge.description}
                </p>
              </div>
            </motion.div>

            {/* Requirements */}
            {challenge.requirements?.length > 0 && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
                <div style={{ ...S.card, padding:24 }}>
                  <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />
                  <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text-heading)', marginBottom:16, display:'flex', alignItems:'center', gap:8, position:'relative', zIndex:1 }}>
                    <span style={{ width:32, height:32, borderRadius:8, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.25)' }}>
                      <CheckCircle size={15} style={{ color:'#34d399' }} />
                    </span>
                    Requirements
                  </h2>
                  <ul style={{ display:'flex', flexDirection:'column', gap:10, position:'relative', zIndex:1 }}>
                    {challenge.requirements.map((req, i) => (
                      <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:'var(--text-color)', lineHeight:1.6 }}>
                        <CheckCircle size={15} style={{ color:'#34d399', marginTop:2, flexShrink:0 }} />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Answer Editor */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              <div style={{ ...S.card, padding:24 }}>
                <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.2),transparent)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'relative', zIndex: 1 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                    {isCompleted ? '✅ Your Submission' : '✍️ Your Code Editor'}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Language:</span>
                    <select
                      value={editorLanguage}
                      onChange={e => handleLanguageChange(e.target.value)}
                      disabled={isCompleted || submitting}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-color)',
                        outline: 'none',
                      }}
                    >
                      <option value="javascript">JavaScript / TypeScript</option>
                      <option value="python">Python</option>
                      <option value="sql">SQL</option>
                      <option value="rust">Rust</option>
                      <option value="go">Go</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="html">HTML / CSS</option>
                      <option value="markdown">Markdown (Theory + Code)</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative', zIndex: 1 }}>
                  {/* Editor toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: 'var(--card-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24' }} />
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#34d399' }} />
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {editorLanguage === 'markdown' ? 'theory-answer.md' : `solution.${editorLanguage === 'javascript' ? 'js' : editorLanguage === 'python' ? 'py' : editorLanguage === 'cpp' ? 'cpp' : editorLanguage === 'java' ? 'java' : editorLanguage === 'sql' ? 'sql' : editorLanguage === 'go' ? 'go' : editorLanguage === 'rust' ? 'rs' : editorLanguage}`}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>Ctrl+Space for suggestions</span>
                  </div>
                  <Editor
                    height="360px"
                    language={editorLanguage}
                    theme={document.documentElement.getAttribute('data-theme') === 'light' ? 'vs-light' : 'vs-dark'}
                    value={answer}
                    onChange={val => setAnswer(val || '')}
                    options={{
                      readOnly: isCompleted || submitting,
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: '"Fira Code", "Cascadia Code", Consolas, "Courier New", monospace',
                      fontLigatures: true,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      lineNumbers: 'on',
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 8,
                      lineNumbersMinChars: 3,
                      renderLineHighlight: 'gutter',
                      bracketPairColorization: { enabled: true },
                      guides: { bracketPairs: true, indentation: true },
                      wordWrap: editorLanguage === 'markdown' ? 'on' : 'off',
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: 'on',
                      smoothScrolling: true,
                      padding: { top: 14, bottom: 14 },
                      suggest: { showKeywords: true },
                      tabSize: editorLanguage === 'python' ? 4 : 2,
                    }}
                  />
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, position:'relative', zIndex:1 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>{answer.length} characters</span>
                  {!isAuthenticated ? (
                    <Link to="/login">
                      <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                        Sign in to Submit
                      </motion.div>
                    </Link>
                  ) : !isCompleted ? (
                    <motion.button
                      whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      onClick={async () => {
                        if (!answer.trim()) return
                        setSubmitting(true)
                        try {
                          const { data } = await challengeService.submit(id, { content: answer })
                           setSubmission(data)
                           setShowFeedback(true)
                           refreshUser()
                           if (data.certificate) setCertificate(data.certificate)
                           // Trigger confetti burst on successful evaluate/submit
                           setCelebrate(true)
                           setTimeout(() => setCelebrate(false), 5000)
                        } catch (err) { alert(err.response?.data?.error || 'Submission failed') }
                        finally { setSubmitting(false) }
                      }}
                      disabled={!answer.trim() || submitting}
                      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:600, fontSize:13, cursor:!answer.trim()||submitting?'not-allowed':'pointer', opacity:!answer.trim()||submitting?0.6:1, border:'none', outline:'none' }}>
                      {submitting ? <Loader2 size={14} style={{ animation:'spin 0.8s linear infinite' }} /> : <Send size={14} />}
                      Submit Solution
                    </motion.button>
                  ) : null}
                </div>
              </div>
            </motion.div>

            {/* Certificate Banner */}
            <AnimatePresence>
              {certificate && (
                <motion.div initial={{ opacity:0, scale:0.95, y:10 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ type:'spring', stiffness:260, damping:20 }}>
                  <div style={{ ...S.card, padding:24, background:'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(234,179,8,0.04))', border:'1px solid rgba(251,191,36,0.35)', marginBottom:16 }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#fbbf24,transparent)' }} />
                    <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative', zIndex:1, flexWrap:'wrap' }}>
                      <div style={{ width:52, height:52, borderRadius:14, background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🏆</div>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                          <Award size={15} style={{ color:'#fbbf24' }} />
                          <span style={{ fontSize:15, fontWeight:800, color:'#fbbf24' }}>Certificate Earned!</span>
                        </div>
                        <p style={{ fontSize:13, fontWeight:600, color:'var(--text-heading)', marginBottom:4 }}>{certificate.title}</p>
                        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Certificate ID: <span style={{ color:'#fbbf24', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.05em' }}>{certificate.certificate_id}</span></p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, flexWrap:'wrap' }}>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Issued</div>
                          <div style={{ fontSize:12, color:'var(--text-color)', fontWeight:600 }}>{new Date(certificate.issued_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => downloadCertificatePDF({
                            name: user?.full_name || user?.name || user?.username,
                            title: challenge.title,
                            score: score,
                            id: certificate.certificate_id,
                            date: certificate.issued_at
                          })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0f172a',
                            background: '#fbbf24',
                            border: 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: '0 4px 12px rgba(251,191,38,0.25)'
                          }}
                        >
                          <Download size={13} /> PDF Certificate
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Feedback */}
            <AnimatePresence>
              {submission?.feedback && (
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                  <div style={{ ...S.card, padding:24, border:'1px solid rgba(99,102,241,0.3)', background:'rgba(99,102,241,0.06)' }}>
                    <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),transparent)' }} />
                    <button onClick={() => setShowFeedback(f => !f)}
                      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', position:'relative', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:24 }}>🤖</span>
                        <div style={{ textAlign:'left' }}>
                          <p style={{ fontSize:15, fontWeight:700, color:'var(--text-heading)' }}>AI Evaluation</p>
                          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Gemini's detailed feedback</p>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:24, fontWeight:900, color:scoreColor, fontVariantNumeric:'tabular-nums' }}>{score}/100</span>
                        {showFeedback ? <ChevronUp size={17} style={{ color:'var(--text-muted)' }} /> : <ChevronDown size={17} style={{ color:'var(--text-muted)' }} />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {showFeedback && (
                        <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                          style={{ overflow:'hidden', position:'relative', zIndex:1 }}>
                          <div style={{ paddingTop:16, marginTop:16, borderTop:'1px solid rgba(99,102,241,0.15)', fontSize:14, color:'var(--text-color)', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
                            {submission.feedback}
                          </div>
                          {submission.xp_earned > 0 && (
                            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, color:'#818cf8', fontWeight:700, fontSize:14 }}>
                              <Zap size={14} /> +{submission.xp_earned} XP earned
                            </div>
                          )}

                          {/* Complexity Desk Upgrade */}
                          {(submission.time_complexity || submission.complexity_table) && (
                            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed rgba(99,102,241,0.25)' }}>
                              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ⚡ Sandbox Complexity Desk
                              </h4>
                              
                              {/* Badges */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center' }}>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Theoretical Time</div>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>{submission.time_complexity || 'O(N)'}</div>
                                </div>
                                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Theoretical Space</div>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>{submission.space_complexity || 'O(1)'}</div>
                                </div>
                              </div>

                              {/* Complexity Table */}
                              {submission.complexity_table && (
                                <div style={{ 
                                  background: 'rgba(0,0,0,0.2)', 
                                  padding: 12, 
                                  borderRadius: 10, 
                                  border: '1px solid var(--glass-border)', 
                                  fontSize: 12, 
                                  lineHeight: 1.6, 
                                  marginBottom: 20,
                                  overflowX: 'auto'
                                }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>Case</th>
                                        <th style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>Time Complexity</th>
                                        <th style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>Space Complexity</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {submission.complexity_table.split('\n')
                                        .filter(line => line.includes('|') && !line.includes('Case') && !line.includes('---') && !line.includes('Best Case') && !line.match(/Time.*Complexity/i))
                                        .map((line, lidx) => {
                                          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
                                          if (cells.length < 3) return null;
                                          return (
                                            <tr key={lidx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-heading)' }}>{cells[0].replace(/\*\*/g, '')}</td>
                                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#818cf8' }}>{cells[1]}</td>
                                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#10b981' }}>{cells[2]}</td>
                                            </tr>
                                          );
                                        })
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Empirical Chart */}
                              {submission.empirical_data && submission.empirical_data.length > 0 && (
                                <div style={{ background: 'rgba(0,0,0,0.12)', border: '1px solid var(--glass-border)', padding: 16, borderRadius: 10, marginBottom: 16 }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empirical Runtime Telemetry</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {submission.empirical_data.map((item, idx) => {
                                      const maxVal = Math.max(...submission.empirical_data.map(d => d.time_ms)) || 0.001
                                      const pct = Math.min(100, Math.max(12, (item.time_ms / maxVal) * 100))
                                      return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', width: 60 }}>N = {item.N}</span>
                                          <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4 }} />
                                            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 800, color: '#fff' }}>{item.time_ms} ms</span>
                                          </div>
                                          <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 60, textAlign: 'right', fontFamily: 'monospace' }}>{item.memory_kb} KB</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, position:'sticky', top:88 }}>

            {/* Challenge Info */}
            <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
              <div style={{ ...S.card, padding:20 }}>
                <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />
                <h3 style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16, position:'relative', zIndex:1 }}>
                  Challenge Info
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:12, position:'relative', zIndex:1 }}>
                  {[
                    { label:'Difficulty', value: <span style={{ ...diffStyle(challenge.difficulty), padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:700, textTransform:'capitalize' }}>{challenge.difficulty}</span> },
                    { label:'XP Reward',  value: <span style={{ color:'#818cf8', fontWeight:700, fontSize:14 }}>{challenge.xp_reward} XP</span> },
                    challenge.estimated_time && { label:'Est. Time', value: <span style={{ color:'var(--text-color)', fontSize:13 }}>{challenge.estimated_time}</span> },
                    { label:'Type', value: <span style={{ color:'var(--text-color)', fontSize:13, textTransform:'capitalize' }}>{challenge.challenge_type}</span> },
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, color:'var(--text-muted)' }}>{row.label}</span>
                      {row.value}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Tags */}
            {challenge.tags?.length > 0 && (
              <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}>
                <div style={{ ...S.card, padding:20 }}>
                  <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />
                  <h3 style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14, position:'relative', zIndex:1 }}>Tags</h3>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, position:'relative', zIndex:1 }}>
                    {challenge.tags.map((tag, i) => (
                      <span key={i} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:500, background:'rgba(99,102,241,0.08)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.2)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action */}
            {isCompleted && (
              <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}>
                <div style={{ ...S.card, padding:20, background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.25)', textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#34d399', marginBottom:4 }}>Challenge Complete!</p>
                  <p style={{ fontSize:12, color:'var(--text-muted)' }}>Score: <strong style={{ color:scoreColor }}>{score}/100</strong></p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Responsive style */}
        <style>{`
          @media (max-width: 768px) {
            .challenge-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        
        {/* Full-screen confetti celebration */}
        <Confetti active={celebrate} />
      </div>
    </PageWrapper>
  )
}
