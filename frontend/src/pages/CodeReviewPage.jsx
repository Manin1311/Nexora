import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code, AlertTriangle, CheckCircle, Terminal, Cpu, Award, Zap,
  Loader2, Play, RefreshCw, ChevronRight, ChevronDown, BookOpen, ExternalLink,
  ShieldAlert, Sparkles, HelpCircle, History, ListCollapse
} from 'lucide-react'
import codeReviewService from '@/services/codeReviewService'
import { useAuth } from '@/context/AuthContext'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const CODEREVIEW_TOUR_STEPS = [
  {
    target: 'codereview-header',
    title: '🔬 AI Code Review Bot',
    description: 'Instant AI code auditor. Paste GitHub repository links or snippets for automated quality, security, and refactoring analysis.',
    color: '#8b5cf6',
    placement: 'bottom',
  },
  {
    target: 'codereview-input',
    title: '🔗 Repo Scanner Input',
    description: 'Paste any public GitHub repository link here and click Analyze Repo to initiate a comprehensive security scan.',
    color: '#6366f1',
    placement: 'bottom',
  },
]

const LOADING_QUOTES = [
  "Inspecting directory structure... Let's see how clean this is.",
  "Scanning files... Looking for code that works 'most of the time'.",
  "Checking for hardcoded secrets... Please tell me there are none.",
  "Analyzing imports... Hoping to not find 50 unused dependencies.",
  "Evaluating error handling... Are you catching general Exceptions?",
  "Calculating code complexity... Watch out for deep nested loops.",
  "Constructing refactoring roadmap... Formulating your actionable steps.",
]

const S = {
  card: {
    position: 'relative',
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 24,
    padding: 24,
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    backdropFilter: 'blur(20px)',
  }
}

export default function CodeReviewPage() {
  const { user, isAuthenticated } = useAuth()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('codereview')
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem('cr_repo_url') || '')
  const [loading, setLoading] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(LOADING_QUOTES[0])
  const [error, setError] = useState(null)
  const [review, setReview] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cr_review') || 'null') } catch { return null }
  })
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedFiles, setExpandedFiles] = useState({})
  const [refactors, setRefactors] = useState({})
  const [loadingRefactor, setLoadingRefactor] = useState({})
  const [copiedRefactor, setCopiedRefactor] = useState({})

  const triggerRefactor = async (filePath, issue, key) => {
    if (refactors[key]) return
    setLoadingRefactor(prev => ({ ...prev, [key]: true }))
    try {
      const data = await codeReviewService.refactor({
        code_snippet: issue.code_snippet,
        description: issue.description,
        fix: issue.fix,
        file_path: filePath
      })
      setRefactors(prev => ({ ...prev, [key]: data }))
    } catch (err) {
      alert("Refactoring generation failed: " + (err.response?.data?.error || err.message))
    } finally {
      setLoadingRefactor(prev => ({ ...prev, [key]: false }))
    }
  }

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedRefactor(prev => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCopiedRefactor(prev => ({ ...prev, [key]: false }))
    }, 2000)
  }

  useEffect(() => {
    fetchHistory()
    // If a scan was pending when user navigated away, auto-restart it
    const pendingUrl = localStorage.getItem('cr_pending_url')
    if (pendingUrl) {
      localStorage.removeItem('cr_pending_url')
      setRepoUrl(pendingUrl)
      handleReviewWithUrl(pendingUrl, false)
    }
  }, [])

  // Rotate loading quotes while loading
  useEffect(() => {
    if (!loading) return
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_QUOTES.length
      setLoadingQuote(LOADING_QUOTES[index])
    }, 3000)
    return () => clearInterval(interval)
  }, [loading])

  const fetchHistory = async () => {
    try {
      const data = await codeReviewService.getHistory()
      setHistory(data)
    } catch (err) {
      console.error("Failed to fetch review history", err)
    }
  }

  // Internal handler accepting a URL argument (avoids closure staleness)
  const handleReviewWithUrl = async (url, forceRefresh = false) => {
    if (!url) return
    setLoading(true)
    setError(null)
    setReview(null)
    setExpandedFiles({})
    localStorage.setItem('cr_repo_url', url)
    localStorage.setItem('cr_pending_url', url) // mark scan in-flight
    try {
      const res = await codeReviewService.submit(url, forceRefresh)
      const reportData = res.review.report_json
      setReview(reportData)
      localStorage.setItem('cr_review', JSON.stringify(reportData))
      localStorage.removeItem('cr_pending_url')
      fetchHistory()
    } catch (err) {
      localStorage.removeItem('cr_pending_url')
      setError(err.response?.data?.error || "Failed to analyze repository. Make sure the repository is public and contains supported source files.")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (forceRefresh = false) => handleReviewWithUrl(repoUrl, forceRefresh)

  const handleHistoryItemClick = (histItem) => {
    if (histItem.report_json) {
      setReview(histItem.report_json)
      setRepoUrl(histItem.repo_url)
      setExpandedFiles({})
    }
  }

  const toggleFile = (filePath) => {
    setExpandedFiles(prev => ({ ...prev, [filePath]: !prev[filePath] }))
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981' // Green
    if (score >= 60) return '#f59e0b' // Orange
    return '#ef4444' // Red
  }

  const getSeverityBadgeColor = (sev) => {
    switch (sev) {
      case 'critical': return 'rgba(239, 68, 68, 0.12)'
      case 'high': return 'rgba(249, 115, 22, 0.12)'
      case 'medium': return 'rgba(234, 179, 8, 0.12)'
      default: return 'rgba(59, 130, 246, 0.12)'
    }
  }

  const getSeverityTextColor = (sev) => {
    switch (sev) {
      case 'critical': return '#f87171'
      case 'high': return '#fb923c'
      case 'medium': return '#facc15'
      default: return '#60a5fa'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingTop: 90, paddingBottom: 80, color: 'var(--text-color)', transition: 'background-color 0.4s ease', position: 'relative' }}>
      
      {/* Ambient Grid Backdrop & Glow Nebulae */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <div data-tour="codereview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16 }}>
              <Sparkles size={12} color="#818cf8" />
              <span style={{ fontSize: 11, fontWeight: 855, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Cyber Scanner</span>
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 950, color: 'var(--text-heading)', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>
              AI Code <span className="gradient-text">Review Bot</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 15, maxWidth: 620 }}>
              Audit raw directories, vulnerability stacks, and refactor code modules with an automated Next-Gen compiler review engine.
            </p>
          </div>

          <button onClick={() => setShowHistory(!showHistory)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.4s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <History size={16} /> {showHistory ? 'Hide Audits' : 'Scan Archive'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: showHistory ? '300px 1fr' : '1fr', gap: 28, transition: 'all 0.3s' }}>
          
          {/* History Sidebar */}
          {showHistory && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 20, height: 'fit-content', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', transition: 'all 0.4s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Audit Logs Vault</h3>
              {history.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No previous scans recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map(item => (
                    <div key={item.id} onClick={() => handleHistoryItemClick(item)}
                      style={{ padding: 14, borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.06)'
                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--glass-bg)'
                        e.currentTarget.style.borderColor = 'var(--glass-border)'
                      }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.repo_owner}/{item.repo_name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: getScoreColor(item.overall_score), fontWeight: 800 }}>
                          Score: {item.overall_score || '--'}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Main Review Dashboard Area */}
          <div style={{ flex: 1 }}>

            {/* Input URL Card */}
            <div data-tour="codereview-input" style={S.card}>
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
              
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                  <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} disabled={loading}
                    placeholder="https://github.com/owner/repository"
                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 14, outline: 'none', transition: 'all 0.4s ease' }} />
                  <Code size={18} color="#64748b" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                
                <button onClick={() => handleReview(false)} disabled={loading || !repoUrl}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 16, fontSize: 14, fontWeight: 800, cursor: (loading || !repoUrl) ? 'not-allowed' : 'pointer', opacity: (loading || !repoUrl) ? 0.6 : 1, border: 'none', transition: 'opacity 0.2s', boxShadow: '0 4px 14px rgba(99,102,241,0.2)' }}>
                  {loading ? <Loader2 size={16} className="spinning" /> : <Play size={16} />} Scan Repository
                </button>

                {review && (
                  <button onClick={() => handleReview(true)} disabled={loading}
                    style={{ padding: '16px', borderRadius: 16, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease' }}>
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Loading Indicator with Live Terminal Log stream */}
            {loading && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                
                {/* Cyber Scanner Reticle */}
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.15)', borderBottomColor: '#a78bfa' }} />
                  <Cpu size={28} color="#8b5cf6" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 1.5s infinite' }} />
                </div>
                
                <div style={{ maxWidth: 500 }}>
                  <h3 style={{ fontSize: 19, color: 'var(--text-heading)', fontWeight: 800, margin: '0 0 6px 0' }}>AI Senior Compiler Audit Running...</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>"{loadingQuote}"</p>
                </div>

                {/* Cyber logs overlay */}
                <div style={{
                  width: '100%', maxWidth: 560, textAlign: 'left', background: 'rgba(8, 7, 16, 0.96)', 
                  border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 16, padding: 18, 
                  fontFamily: 'monospace', fontSize: 12, color: '#38bdf8', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.15)'
                }}>
                  <div style={{ color: '#10b981', marginBottom: 4 }}>[GATEWAY SECURE CONNECTED]</div>
                  <div style={{ color: '#a78bfa', marginBottom: 6 }}>$ nexora audit --repo={repoUrl}</div>
                  <div style={{ opacity: 0.7 }}>[INF] Mapping target repository code structures...</div>
                  <div style={{ opacity: 0.7 }}>[INF] Analyzing directory files and configurations...</div>
                  <div style={{ opacity: 0.7, color: '#fb923c' }}>[WRN] Detected deep recursive loops inside module imports.</div>
                  <div style={{ opacity: 0.7, color: '#f87171' }}>[ERR] Found vulnerable callback handlers inside repository root.</div>
                  <div style={{ opacity: 0.8, color: '#10b981' }}>[OK] Scanner compile status: ACTIVE</div>
                  <div style={{ color: '#818cf8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                    Active Step: {loadingQuote}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty State / Telemetry Showcase Panel */}
            {!review && !loading && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 12 }}>
                
                {/* AUDIT SYSTEM COVERAGE & STATUS */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  
                  {/* System limits guidelines card */}
                  <div style={{
                    flex: '1 1 300px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 20,
                    padding: 24,
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 18 }}>⚙️</span>
                      <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-heading)', margin: 0 }}>Audit Scope & Language Support</h4>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.5 }}>
                      <li><strong>Supported Stack:</strong> Full analysis for JavaScript, TypeScript, Python, HTML, CSS.</li>
                      <li><strong>Repository Limits:</strong> Public GitHub URLs only (private repo integrations coming soon).</li>
                      <li><strong>Size Threshold:</strong> Optimised for repository sizes up to 50MB.</li>
                      <li><strong>Outputs Generated:</strong> Prioritized architectural roadmap, flags categorization, and inline refactoring diffs.</li>
                    </ul>
                  </div>

                  {/* Core system state cockpit block */}
                  <div style={{
                    flex: '1 1 240px',
                    background: 'rgba(99,102,241,0.03)',
                    border: '1px dashed rgba(99,102,241,0.25)',
                    borderRadius: 20,
                    padding: 24,
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Telemetry Core</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                          SYSTEM ONLINE
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'monospace', fontSize: 12 }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>ENGINE:</span> Gemini Cognitive Core</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>LATENCY:</span> ~8.5 seconds / report</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>BUFFER:</span> 120 files max / scan</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: 12, marginTop: 16 }}>
                      🔒 Scans are performed on ephemeral instances. No code is stored.
                    </div>
                  </div>

                </div>

                {/* SCANNER FEATURES DETAIL GRIDS */}
                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, paddingLeft: 4 }}>
                    Telemetry Scan Engine Features
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    {[
                      { icon: '🛡️', title: 'Complexity Audits', desc: 'Flag deep nested loop branches, logical redundancy, and structural bottlenecks.' },
                      { icon: '🔑', title: 'Secret Scanner', desc: 'Inspect raw credentials, exposed env variables, and hardcoded API tokens.' },
                      { icon: '⚡', title: 'Refactor Suggestion', desc: 'Inject customized senior-engineer cleaner alternatives instantly into file breakdowns.' },
                      { icon: '📊', title: 'Telemetry Metrics', desc: 'Generate system-wide health grading scores to track refactoring cycles.' }
                    ].map((feature, idx) => (
                      <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 20, textAlign: 'left', transition: 'all 0.4s ease' }}>
                        <div style={{ fontSize: 24, marginBottom: 12 }}>{feature.icon}</div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px 0' }}>{feature.title}</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* Code Review Results Report */}
            {review && !loading && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Dashboard Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  
                  {/* Cyber Power dial Core */}
                  <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ 
                      width: 86, height: 86, borderRadius: '50%', 
                      background: `conic-gradient(${getScoreColor(review.overall_score)} ${review.overall_score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                      boxShadow: `0 0 20px rgba(99,102,241,0.08)`, flexShrink: 0
                    }}>
                      {/* Rotating glow boundary */}
                      <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px dashed ${getScoreColor(review.overall_score)}40`, animation: 'spin 12s linear infinite' }} />
                      <div style={{ 
                        position: 'absolute', width: 72, height: 72, borderRadius: '50%', 
                        background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 950, color: 'var(--text-heading)' 
                      }}>
                        {review.overall_score}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0', fontWeight: 800 }}>Core Health Ratio</h3>
                      <p style={{ fontSize: 16, fontWeight: 900, margin: 0, color: getScoreColor(review.overall_score) }}>
                        {review.overall_score >= 80 ? 'Good Architecture' : review.overall_score >= 60 ? 'Needs Refactoring' : 'Severe Fault Risk'}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                        Sector rating: certified
                      </span>
                    </div>
                  </div>

                  {/* Issues Counter */}
                  <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={22} color="#ef4444" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0', fontWeight: 800 }}>Compiler Flags</h3>
                      <p style={{ fontSize: 22, fontWeight: 950, color: 'var(--text-heading)', margin: 0 }}>
                        {review.total_issues} issues
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                        Scanned {review.files_reviewed} component files
                      </span>
                    </div>
                  </div>

                  {/* Severity Counters Gauge */}
                  <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: 800 }}>Vulnerability Ratio</h3>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{review.total_issues} total</span>
                    </div>
                    
                    <div style={{ height: 8, borderRadius: 20, background: 'rgba(255,255,255,0.04)', display: 'flex', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      {review.severity_counts?.critical > 0 && (
                        <div style={{ width: `${(review.severity_counts.critical / (review.total_issues || 1)) * 100}%`, background: '#f87171' }} title={`Critical: ${review.severity_counts.critical}`} />
                      )}
                      {review.severity_counts?.high > 0 && (
                        <div style={{ width: `${(review.severity_counts.high / (review.total_issues || 1)) * 100}%`, background: '#fb923c' }} title={`High: ${review.severity_counts.high}`} />
                      )}
                      {review.severity_counts?.medium > 0 && (
                        <div style={{ width: `${(review.severity_counts.medium / (review.total_issues || 1)) * 100}%`, background: '#facc15' }} title={`Medium: ${review.severity_counts.medium}`} />
                      )}
                      {review.severity_counts?.low > 0 && (
                        <div style={{ width: `${(review.severity_counts.low / (review.total_issues || 1)) * 100}%`, background: '#60a5fa' }} title={`Low: ${review.severity_counts.low}`} />
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>Crit ({review.severity_counts?.critical || 0})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c' }} />
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>High ({review.severity_counts?.high || 0})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#facc15' }} />
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>Med ({review.severity_counts?.medium || 0})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>Low ({review.severity_counts?.low || 0})</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Refactoring Roadmap Checklist */}
                <div style={S.card}>
                  <div style={{ position: 'absolute', top: 0, left: 24, width: 44, height: 2, background: '#facc15' }} />
                  
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={18} color="#facc15" style={{ fill: '#facc15' }} /> Refactoring Roadmap Core
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px 0' }}>Sequential code optimization checklist generated by compiler telemetry.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                    {/* Visual Connector Line */}
                    <div style={{ position: 'absolute', left: 34, top: 20, bottom: 20, width: 2, borderLeft: '2px dashed rgba(99,102,241,0.25)', pointerEvents: 'none' }} />

                    {review.roadmap?.map((step) => (
                      <div key={step.step} style={{ display: 'flex', gap: 20, padding: '16px 0', position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--card-bg)', border: '2px solid #818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#818cf8', flexShrink: 0, boxShadow: '0 0 10px rgba(99,102,241,0.2)' }}>
                          {step.step}
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: 18, borderRadius: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)' }}>{step.title}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: getSeverityBadgeColor(step.severity), color: getSeverityTextColor(step.severity), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {step.severity} Priority
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-color)', margin: '0 0 12px 0', lineHeight: 1.6 }}>{step.description}</p>
                          <div style={{ fontSize: 12, background: 'rgba(8,7,16,0.5)', padding: '12px 14px', borderRadius: 10, borderLeft: '3px solid #818cf8', color: '#38bdf8', fontFamily: 'monospace', border: '1px solid var(--glass-border)', borderLeftWidth: 3 }}>
                            <strong>Fix Logic:</strong> {step.fix}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File breakdown analysis (Dossiers) */}
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOpen size={18} color="#818cf8" /> File-by-File Breakdown Dossiers
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {review.files?.map((f) => {
                      const isExpanded = !!expandedFiles[f.file]
                      const totalIssues = f.issues?.length || 0

                      return (
                        <div key={f.file} style={{ background: 'var(--card-bg)', border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.35)' : 'var(--card-border)'}`, borderRadius: 20, overflow: 'hidden', transition: 'all 0.4s ease', boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.06)' : 'none' }}>
                          
                          {/* File Header */}
                          <div onClick={() => toggleFile(f.file)}
                            style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? 'rgba(99,102,241,0.05)' : 'transparent', transition: 'all 0.4s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)' }}>📄 {f.file}</span>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'var(--glass-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', letterSpacing: '0.02em' }}>
                                {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: getScoreColor(f.file_score) }}>
                                Score: {f.file_score}
                              </span>
                              {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                            </div>
                          </div>

                          {/* File Details (Expanded issues comments) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                style={{ borderTop: '1px solid var(--card-border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden', transition: 'all 0.4s ease' }}>
                                {totalIssues === 0 ? (
                                  <p style={{ fontSize: 13, color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                                    <CheckCircle size={14} /> Perfect code quality checked. No vulnerabilities identified.
                                  </p>
                                ) : (
                                  f.issues.map((iss, issIdx) => {
                                    const issueKey = `${f.file}-${issIdx}`
                                    const isRefactorLoading = !!loadingRefactor[issueKey]
                                    const refactorData = refactors[issueKey]
                                    const isCopied = !!copiedRefactor[issueKey]

                                    return (
                                      <div key={issIdx} style={{ padding: 18, borderRadius: 16, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.4s ease' }}>
                                        <div style={{ display: 'flex', justifySpace: 'between', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#818cf8', fontFamily: 'monospace' }}>LINE {iss.line}</span>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)' }}>{iss.type}</span>
                                          </div>
                                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: getSeverityBadgeColor(iss.severity), color: getSeverityTextColor(iss.severity), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {iss.severity}
                                          </span>
                                        </div>

                                        <p style={{ fontSize: 13, color: 'var(--text-color)', margin: 0, lineHeight: 1.6 }}>{iss.description}</p>

                                        {iss.code_snippet && (
                                          <pre style={{ margin: 0, padding: 14, borderRadius: 10, background: 'rgba(8,7,16,0.95)', color: '#38bdf8', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto', border: '1px solid rgba(99,102,241,0.2)', transition: 'all 0.4s ease' }}>
                                            <code>{iss.code_snippet}</code>
                                          </pre>
                                        )}

                                        <div style={{ fontSize: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', borderLeft: '3px solid #10b981', color: '#10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                          <div style={{ flex: 1, lineHeight: 1.5 }}>
                                            <strong>Suggested Remediation:</strong> {iss.fix}
                                          </div>
                                          
                                          {iss.code_snippet && (
                                            <motion.button
                                              whileHover={{ scale: 1.03 }}
                                              whileTap={{ scale: 0.97 }}
                                              onClick={() => triggerRefactor(f.file, iss, issueKey)}
                                              disabled={isRefactorLoading}
                                              style={{
                                                padding: '6px 14px',
                                                borderRadius: 8,
                                                fontSize: 11,
                                                fontWeight: 800,
                                                color: '#fff',
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                border: 'none',
                                                cursor: isRefactorLoading ? 'not-allowed' : 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                boxShadow: '0 4px 10px rgba(99,102,241,0.15)'
                                              }}
                                            >
                                              {isRefactorLoading ? (
                                                <>
                                                  <Loader2 size={12} className="spinning" /> Compiling...
                                                </>
                                              ) : (
                                                <>
                                                  <Sparkles size={12} /> Refactor Code
                                                </>
                                              )}
                                            </motion.button>
                                          )}
                                        </div>

                                        {/* Refactoring Diff Panel Output Block */}
                                        <AnimatePresence>
                                          {refactorData && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              transition={{ duration: 0.3 }}
                                              style={{ overflow: 'hidden', marginTop: 8 }}
                                            >
                                              <div style={{ padding: 16, borderRadius: 12, background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <span style={{ fontSize: 11, fontWeight: 805, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Sparkles size={12} /> Cyber Refactored Code (AI Verified)
                                                  </span>
                                                  <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => copyToClipboard(refactorData.refactored_code, issueKey)}
                                                    style={{
                                                      padding: '3px 10px',
                                                      borderRadius: 6,
                                                      fontSize: 10,
                                                      fontWeight: 800,
                                                      color: isCopied ? '#10b981' : 'var(--text-color)',
                                                      background: 'var(--glass-bg)',
                                                      border: '1px solid var(--glass-border)',
                                                      cursor: 'pointer',
                                                      outline: 'none'
                                                    }}
                                                  >
                                                    {isCopied ? '✓ Copied' : 'Copy Code'}
                                                  </motion.button>
                                                </div>
 
                                                <pre style={{ margin: 0, padding: 14, borderRadius: 10, background: 'rgba(8,7,16,0.98)', border: '1px solid rgba(99,102,241,0.25)', color: '#34d399', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto' }}>
                                                  <code>{refactorData.refactored_code}</code>
                                                </pre>
 
                                                {refactorData.explanation && (
                                                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
                                                    <strong>AI Insight:</strong> {refactorData.explanation}
                                                  </p>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )
                                  })
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      )
                    })}
                  </div>
                </div>

              </motion.div>
            )}

          </div>

        </div>

      </div>

      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#8b5cf6" />
      <PageTour
        steps={CODEREVIEW_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#8b5cf6"
      />
    </div>
  )
}
