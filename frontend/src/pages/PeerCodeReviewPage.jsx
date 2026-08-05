import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, MessageSquare, ThumbsUp, Code, Sparkles, Filter, Plus,
  Search, CheckCircle2, AlertCircle, HelpCircle, Lightbulb, ExternalLink,
  ChevronRight, X, Loader2, ArrowLeft, ShieldCheck, Tag, Terminal, Send
} from 'lucide-react'
import peerReviewService from '@/services/peerReviewService'
import { showcaseService } from '@/services/showcaseService'
import { challengeService } from '@/services/challengeService'
import { useAuth } from '@/context/AuthContext'
import PageWrapper from '@/components/layout/PageWrapper'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'
import { cacheGet, cacheSet } from '@/services/cache'

const TOUR_STEPS = [
  {
    target: 'peer-review-header',
    title: '🤝 Peer Code Review Network',
    description: 'Get constructive feedback from fellow developers and AI on your showcase projects, challenge solutions, and custom snippets.',
    color: '#8b5cf6',
    placement: 'bottom',
  },
  {
    target: 'peer-review-feed',
    title: '💬 Community Feed',
    description: 'Browse code review requests submitted by developers across the platform. Filter by project type or focus area.',
    color: '#6366f1',
    placement: 'right',
  },
  {
    target: 'peer-review-create',
    title: '🚀 Request a Review',
    description: 'Click here to submit your project or snippet for peer feedback. Select specific focus areas like Security, Performance, or Architecture.',
    color: '#10b981',
    placement: 'left',
  },
]

const COMMENT_TYPES = [
  { id: 'suggestion', label: '💡 Suggestion', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  { id: 'issue',      label: '⚠️ Issue',      color: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)' },
  { id: 'praise',     label: '✅ Praise',     color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)' },
  { id: 'question',   label: '❓ Question',   color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.3)' },
]

const FOCUS_OPTIONS = [
  { id: 'security',      label: '🛡️ Security' },
  { id: 'performance',   label: '⚡ Performance' },
  { id: 'readability',   label: '📖 Readability' },
  { id: 'architecture',  label: '🏗️ Architecture' },
  { id: 'testing',       label: '🧪 Testing' },
  { id: 'general',       label: '🔍 General' },
]

export default function PeerCodeReviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('peer-review')

  const [requests, setRequests] = useState(() => {
    // Pre-populate from cache so feed shows instantly on return
    const cached = cacheGet('peer-reviews-all', null)
    return cached ? cached.data : []
  })
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loading, setLoading] = useState(() => !cacheGet('peer-reviews-all', null))
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Filters
  const [filterSource, setFilterSource] = useState('all') // all | project | challenge | snippet | me
  const [searchQuery, setSearchQuery] = useState('')

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userProjects, setUserProjects] = useState([])
  const [userChallenges, setUserChallenges] = useState([
    { id: 1, title: 'Build JWT Authentication API' },
    { id: 2, title: 'Explain JavaScript Closures' },
    { id: 3, title: 'Design a URL Shortener System' },
    { id: 4, title: 'Build a React Custom Hook: useLocalStorage' },
    { id: 5, title: 'Write a Binary Search Implementation' },
    { id: 6, title: 'Build a Custom Decorator for Function Execution Time Profiling' },
    { id: 7, title: 'Design a Distributed Rate Limiter' },
    { id: 8, title: 'Implement a Custom Promise Polyfill (MyPromise)' },
    { id: 9, title: 'Optimize a PostgreSQL Schema with Indexing and Query Tuning' },
    { id: 10, title: 'Implement a Least Recently Used (LRU) Cache Eviction Policy' },
  ])
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    source_type: 'project',
    project_id: '',
    project_title: '',
    challenge_id: '',
    challenge_title: '',
    language: 'javascript',
    github_url: '',
    focus_areas: ['readability', 'architecture'],
  })
  const [submitting, setSubmitting] = useState(false)

  // Comment Form
  const [commentBody, setCommentBody] = useState('')
  const [commentType, setCommentType] = useState('suggestion')
  const [lineRef, setLineRef] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = {}
      if (filterSource === 'me') {
        params.author = 'me'
      } else if (filterSource !== 'all') {
        params.source = filterSource
      }
      const res = await peerReviewService.getAll(params)
      const data = res.data || []
      cacheSet(`peer-reviews-${filterSource}`, null, data)
      setRequests(data)

      // Auto select first or keep selected
      if (data.length > 0 && !selectedRequest) {
        loadDetail(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load peer review requests', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cacheKey = `peer-reviews-${filterSource}`
    const cached = cacheGet(cacheKey, null)
    if (cached && !cached.stale) {
      // Fresh cache: show immediately, no spinner
      setRequests(cached.data)
      setLoading(false)
      if (cached.data.length > 0 && !selectedRequest) loadDetail(cached.data[0].id)
    } else if (cached && cached.stale) {
      // Stale: show immediately, refresh silently
      setRequests(cached.data)
      setLoading(false)
      if (cached.data.length > 0 && !selectedRequest) loadDetail(cached.data[0].id)
      fetchRequests(true)
    } else {
      fetchRequests(false)
    }
  }, [filterSource])

  // Load account holder's own projects + challenges on mount and when modal opens
  const loadModalData = () => {
    showcaseService.getMyProjects()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || [])
        setUserProjects(list)
      })
      .catch(() => {})

    challengeService.getAll()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || [])
        if (list.length > 0) setUserChallenges(list)
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadModalData()
  }, [])

  // Auto-fetch challenges whenever user selects Challenge source type
  useEffect(() => {
    if (createForm.source_type === 'challenge') {
      challengeService.getAll()
        .then(res => {
          const list = Array.isArray(res.data) ? res.data : (res.data?.results || [])
          if (list.length > 0) setUserChallenges(list)
        })
        .catch(() => {})
    }
  }, [createForm.source_type])

  // Handle pre-fill from query param `?project=<id>`
  useEffect(() => {
    const projectIdParam = searchParams.get('project')
    if (projectIdParam) {
      setShowCreateModal(true)
      showcaseService.getById(projectIdParam).then(res => {
        const proj = res.data
        if (proj) {
          // Seed this project into the dropdown in case user has not published it themselves
          setUserProjects(prev => prev.some(p => String(p.id) === String(proj.id)) ? prev : [proj, ...prev])

          let richDesc = proj.description || ''
          if (proj.architecture) richDesc += `\n\nArchitecture Overview: ${proj.architecture}`
          if (proj.live_url) richDesc += `\n\nLive Demo: ${proj.live_url}`

          setCreateForm(prev => ({
            ...prev,
            source_type: 'project',
            project_id: String(proj.id),
            project_title: proj.title,
            title: `Peer Review Request: ${proj.title}`,
            description: richDesc,
            github_url: proj.github_url || '',
            language: proj.tags?.[0]?.name?.toLowerCase() || 'javascript',
          }))
        }
      }).catch(() => {})
    }
  }, [searchParams])

  // Lock scroll when modal is open and refresh options
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden'
      loadModalData()
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showCreateModal])

  const loadDetail = async (id) => {
    setLoadingDetail(true)
    try {
      const res = await peerReviewService.getById(id)
      setSelectedRequest(res.data)
    } catch (err) {
      console.error('Failed to load detail', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.title.trim()) return

    // Mandatory validation for Project and Challenge selection
    if (createForm.source_type === 'project' && !createForm.project_id) {
      setToast({ type: 'error', message: '⚠️ Please select a Showcase project for your review request.' })
      setTimeout(() => setToast(null), 4000)
      return
    }
    if (createForm.source_type === 'challenge' && !createForm.challenge_id) {
      setToast({ type: 'error', message: '⚠️ Please select a Challenge for your review request.' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...createForm,
        project_id: createForm.project_id ? parseInt(createForm.project_id, 10) : null,
        challenge_id: createForm.challenge_id ? parseInt(createForm.challenge_id, 10) : null,
        focus_areas: createForm.focus_areas.join(','),
      }
      const res = await peerReviewService.create(payload)
      setToast({ type: 'success', message: '🎉 Peer review request published!' })
      setShowCreateModal(false)
      fetchRequests()
      if (res.data) {
        setSelectedRequest(res.data)
      }
    } catch (err) {
      console.error('Failed to create peer review request:', err)
      const errRes = err.response?.data
      let errMsg = 'Failed to publish review request.'
      if (typeof errRes === 'object' && errRes !== null) {
        errMsg = Object.entries(errRes).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
      }
      setToast({ type: 'error', message: `❌ ${errMsg}` })
    } finally {
      setSubmitting(false)
      setTimeout(() => setToast(null), 5000)
    }
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!commentBody.trim() || !selectedRequest) return

    setPostingComment(true)
    try {
      const res = await peerReviewService.addComment(selectedRequest.id, {
        body: commentBody,
        comment_type: commentType,
        line_ref: lineRef.trim(),
      })
      setCommentBody('')
      setLineRef('')
      // Update selected request comments list locally
      setSelectedRequest(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data],
        comment_count: (prev.comment_count || 0) + 1
      }))
      // Also update feed card comment count
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, comment_count: r.comment_count + 1 } : r))
      setToast({ type: 'success', message: '💬 Feedback posted to reviewer thread!' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to post comment.' })
    } finally {
      setPostingComment(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleUpvoteRequest = async (reqId) => {
    try {
      const res = await peerReviewService.toggleUpvote(reqId)
      const { upvoted, upvote_count } = res.data
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, has_upvoted: upvoted, upvote_count } : r))
      if (selectedRequest?.id === reqId) {
        setSelectedRequest(prev => ({ ...prev, has_upvoted: upvoted, upvote_count }))
      }
    } catch (err) {
      console.error('Upvote failed', err)
    }
  }

  const handleUpvoteComment = async (commentId) => {
    try {
      const res = await peerReviewService.toggleCommentUpvote(commentId)
      const { upvoted, upvote_count } = res.data
      setSelectedRequest(prev => ({
        ...prev,
        comments: prev.comments.map(c => c.id === commentId ? { ...c, has_upvoted: upvoted, upvote_count } : c)
      }))
    } catch (err) {
      console.error('Comment upvote failed', err)
    }
  }

  const toggleFocusArea = (areaId) => {
    setCreateForm(prev => {
      const exists = prev.focus_areas.includes(areaId)
      if (exists) {
        return { ...prev, focus_areas: prev.focus_areas.filter(a => a !== areaId) }
      } else {
        return { ...prev, focus_areas: [...prev.focus_areas, areaId] }
      }
    })
  }

  const filteredRequests = requests.filter(r => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.author?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <PageWrapper noPadding>
      <PageTour tourKey="peer-review" steps={TOUR_STEPS} isOpen={tourOpen} onClose={closeTour} />

      <div className="container" style={{ paddingTop: 24, paddingBottom: 24, position: 'relative' }}>
        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 84, left: '50%', transform: 'translateX(-50%)',
              background: toast.type === 'error' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700,
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)', zIndex: 200
            }}
          >
            {toast.message}
          </motion.div>
        )}

        {/* Ambient background mesh */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: -100, right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header Banner */}
        <motion.div
          data-tour="peer-review-header"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                🤝 Community Feedback Hub
              </span>
              <HelpButton onClick={openTour} tooltip="Take Page Tour" />
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 950, color: 'var(--text-heading)', letterSpacing: '-0.03em', margin: 0 }}>
              Peer Code <span className="gradient-text">Review Network</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: 600 }}>
              Exchange architectural critiques, security audits, and code refactor suggestions with top developers alongside AI review bots.
            </p>
          </div>

          <motion.button
            data-tour="peer-review-create"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setCreateForm({ title:'', description:'', source_type:'project', project_id:'', project_title:'', challenge_id:'', challenge_title:'', language:'javascript', github_url:'', focus_areas:['readability','architecture'] })
              setShowCreateModal(true)
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 800,
              background: '#000', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              outline: 'none'
            }}
          >
            <Plus size={16} /> Request Peer Review
          </motion.button>
        </motion.div>

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Source Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14 }}>
            {[
              { id: 'all',       label: '🌐 All Feed' },
              { id: 'project',   label: '📦 Showcase Projects' },
              { id: 'challenge', label: '⚔️ Challenge Solutions' },
              { id: 'me',        label: '👤 My Requests' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterSource(tab.id)}
                style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none',
                  border: '1px solid ' + (filterSource === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent'),
                  background: filterSource === tab.id ? '#000' : 'transparent',
                  color: filterSource === tab.id ? '#fff' : 'var(--text-muted)',
                  boxShadow: filterSource === tab.id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search peer reviews by keyword, author, title..."
              style={{
                width: '100%', padding: '8px 14px 8px 38px', borderRadius: 12, fontSize: 12.5,
                background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Workspace 2-Column Split */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 20, minHeight: 600, position: 'relative', zIndex: 1 }}>

          {/* LEFT COLUMN: Review Feed List */}
          <div data-tour="peer-review-feed" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 12 }}>
                <Loader2 size={28} className="spinning" style={{ color: '#8b5cf6' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Loading Peer Review Feed…</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <Users size={32} style={{ color: '#8b5cf6', opacity: 0.7, marginBottom: 12 }} />
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px' }}>No Review Requests Found</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Be the first developer to post a code review request in this feed!
                </p>
                <button
                  onClick={() => {
                    setCreateForm({ title:'', description:'', source_type:'project', project_id:'', project_title:'', challenge_id:'', challenge_title:'', language:'javascript', github_url:'', focus_areas:['readability','architecture'] })
                    setShowCreateModal(true)
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  <Plus size={13} style={{ display: 'inline', marginRight: 4 }} /> Request Review
                </button>
              </div>
            ) : (
              filteredRequests.map(req => {
                const isSelected = selectedRequest?.id === req.id
                const focusList = (req.focus_areas || 'general').split(',').map(f => f.trim())
                return (
                  <motion.div
                    key={req.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => loadDetail(req.id)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))' : 'var(--card-bg)',
                      border: `1px solid ${isSelected ? '#8b5cf6' : 'var(--card-border)'}`,
                      borderRadius: 16, padding: 16, cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 8px 24px rgba(139,92,246,0.15)' : 'none'
                    }}
                  >
                    {/* Header Row: Author + Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>
                          {req.author?.full_name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-heading)', margin: 0, lineHeight: 1.2 }}>
                            {req.author?.full_name || 'Developer'}
                          </p>
                          <span style={{ fontSize: 9.5, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>
                            {req.author?.dev_rank || 'explorer'}
                          </span>
                        </div>
                      </div>

                      {/* Source tag */}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: req.source_type === 'project' ? 'rgba(236,72,153,0.12)' : req.source_type === 'challenge' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)', color: req.source_type === 'project' ? '#ec4899' : req.source_type === 'challenge' ? '#818cf8' : '#10b981', border: `1px solid ${req.source_type === 'project' ? 'rgba(236,72,153,0.3)' : req.source_type === 'challenge' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                        {req.source_type === 'project' ? '📦 Project' : req.source_type === 'challenge' ? '⚔️ Challenge' : '💻 Snippet'}
                      </span>
                    </div>

                    {/* Request Title */}
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px', lineHeight: 1.35 }}>
                      {req.title}
                    </h3>

                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {req.description || 'No detailed description provided.'}
                    </p>

                    {/* Focus pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {focusList.map((f, i) => (
                        <span key={i} style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 8, background: 'var(--glass-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Card Footer: Upvote + Comment counts */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpvoteRequest(req.id); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, background: req.has_upvoted ? 'rgba(139,92,246,0.15)' : 'transparent',
                          border: `1px solid ${req.has_upvoted ? '#8b5cf6' : 'transparent'}`, padding: '3px 9px', borderRadius: 8,
                          fontSize: 11, fontWeight: 700, color: req.has_upvoted ? '#a78bfa' : 'var(--text-muted)', cursor: 'pointer'
                        }}
                      >
                        <ThumbsUp size={12} /> {req.upvote_count || 0}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                        <MessageSquare size={12} /> {req.comment_count || 0} Comments
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* RIGHT COLUMN: Detail & Comment Thread */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', minHeight: 600 }}>
            {!selectedRequest ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 48, textAlign: 'center' }}>
                <Code size={40} style={{ color: '#8b5cf6', opacity: 0.5, marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px' }}>Select a Review Request</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, maxWidth: 320 }}>
                  Click any request card from the community feed on the left to inspect code snippets and post feedback.
                </p>
              </div>
            ) : loadingDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Loader2 size={32} className="spinning" style={{ color: '#8b5cf6' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

                {/* Request Header */}
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {selectedRequest.source_type} review request
                      </span>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-heading)', margin: '2px 0 6px', lineHeight: 1.3 }}>
                        {selectedRequest.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => handleUpvoteRequest(selectedRequest.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: selectedRequest.has_upvoted ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'var(--glass-bg)',
                        color: selectedRequest.has_upvoted ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--glass-border)', padding: '6px 14px', borderRadius: 10,
                        fontSize: 12, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      <ThumbsUp size={13} /> {selectedRequest.upvote_count || 0} Upvotes
                    </button>
                  </div>

                  {/* Author meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>By <strong style={{ color: 'var(--text-heading)' }}>{selectedRequest.author?.full_name}</strong></span>
                    <span>•</span>
                    <span>Rank: <strong style={{ color: '#a78bfa' }}>{selectedRequest.author?.dev_rank}</strong></span>
                    {selectedRequest.github_url && (
                      <>
                        <span>•</span>
                        <a href={selectedRequest.github_url} target="_blank" rel="noreferrer" style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700 }}>
                          <ExternalLink size={12} /> GitHub Repo
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Description & Focus */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px' }}>Request Details</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.6, margin: '0 0 12px' }}>
                    {selectedRequest.description || 'No additional notes provided.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>Focus Areas:</span>
                    {(selectedRequest.focus_areas || 'general').split(',').map((area, i) => (
                      <span key={i} style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                        {area.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Code Snippet Box */}
                {selectedRequest.code_snippet && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Terminal size={13} /> {selectedRequest.language || 'Code'} Snippet
                      </span>
                    </div>
                    <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, overflowX: 'auto', fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.6, maxHeight: 280, overflowY: 'auto' }}>
                      <pre style={{ margin: 0 }}>{selectedRequest.code_snippet}</pre>
                    </div>
                  </div>
                )}

                {/* Comment Thread Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={14} style={{ color: '#8b5cf6' }} /> Peer Review Feedback ({selectedRequest.comments?.length || 0})
                  </h4>

                  {/* List of comments */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }} className="no-scrollbar">
                    {(!selectedRequest.comments || selectedRequest.comments.length === 0) ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', italic: 'true', margin: '8px 0' }}>
                        No peer comments yet. Be the first to post feedback on this code!
                      </p>
                    ) : (
                      selectedRequest.comments.map(c => {
                        const typeMeta = COMMENT_TYPES.find(t => t.id === c.comment_type) || COMMENT_TYPES[0]
                        return (
                          <div key={c.id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 14 }}>
                            {/* Comment Top bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 800 }}>
                                  {c.author?.full_name?.charAt(0) || 'U'}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-heading)' }}>
                                  {c.author?.full_name}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: typeMeta.bg, color: typeMeta.color, border: `1px solid ${typeMeta.border}` }}>
                                  {typeMeta.label}
                                </span>
                                {c.line_ref && (
                                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--card-bg)', padding: '1px 6px', borderRadius: 4 }}>
                                    {c.line_ref}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleUpvoteComment(c.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4, background: c.has_upvoted ? 'rgba(139,92,246,0.15)' : 'transparent',
                                  border: `1px solid ${c.has_upvoted ? '#8b5cf6' : 'transparent'}`, padding: '2px 8px', borderRadius: 6,
                                  fontSize: 10.5, fontWeight: 700, color: c.has_upvoted ? '#a78bfa' : 'var(--text-muted)', cursor: 'pointer'
                                }}
                              >
                                <ThumbsUp size={11} /> {c.upvote_count || 0}
                              </button>
                            </div>

                            <p style={{ fontSize: 12.5, color: 'var(--text-color)', lineHeight: 1.55, margin: 0 }}>
                              {c.body}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Add Comment Composer */}
                  <form onSubmit={handlePostComment} style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>Feedback Type:</span>
                      {COMMENT_TYPES.map(t => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => setCommentType(t.id)}
                          style={{
                            padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none',
                            background: commentType === t.id ? t.bg : 'transparent',
                            color: commentType === t.id ? t.color : 'var(--text-muted)',
                            border: `1px solid ${commentType === t.id ? t.border : 'var(--glass-border)'}`
                          }}
                        >
                          {t.label}
                        </button>
                      ))}

                      <input
                        type="text"
                        value={lineRef}
                        onChange={e => setLineRef(e.target.value)}
                        placeholder="Line ref (e.g. L12-L24)"
                        style={{
                          marginLeft: 'auto', width: 140, padding: '3px 8px', borderRadius: 8, fontSize: 10.5,
                          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <textarea
                        value={commentBody}
                        onChange={e => setCommentBody(e.target.value)}
                        placeholder="Write your peer code review feedback, security warning, or refactoring suggestion..."
                        rows={2}
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 12.5,
                          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none', resize: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!commentBody.trim() || postingComment}
                        style={{
                          padding: '0 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none',
                          opacity: !commentBody.trim() || postingComment ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {postingComment ? <Loader2 size={16} className="spinning" /> : <Send size={15} />}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* CREATE REVIEW REQUEST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 580, background: 'var(--card-bg)',
                border: '1px solid var(--card-border)', borderRadius: 24, padding: 28, zIndex: 1,
                maxHeight: '90vh', overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-heading)', margin: 0 }}>
                    Request Peer Code Review
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Publish your code or project to get targeted feedback from the community.
                  </p>
                </div>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Source type tabs */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Review Source</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'project',   label: '📦 Showcase Project' },
                      { id: 'challenge', label: '⚔️ Challenge' },
                    ].map(s => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setCreateForm(prev => ({ ...prev, source_type: s.id }))}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none',
                          background: createForm.source_type === s.id ? '#000' : 'var(--glass-bg)',
                          color: createForm.source_type === s.id ? '#fff' : 'var(--text-muted)',
                          border: `1px solid ${createForm.source_type === s.id ? 'rgba(255,255,255,0.2)' : 'var(--glass-border)'}`,
                          boxShadow: createForm.source_type === s.id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* If Showcase Project source selected */}
                {createForm.source_type === 'project' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Select Showcase Project <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      required
                      value={createForm.project_id}
                      onChange={e => {
                        const proj = userProjects.find(p => String(p.id) === String(e.target.value))
                        setCreateForm(prev => ({
                          ...prev,
                          project_id: e.target.value,
                          project_title: proj ? proj.title : '',
                          title: proj ? `Peer Review Request: ${proj.title}` : prev.title,
                          github_url: proj ? proj.github_url || '' : prev.github_url
                        }))
                      }}
                      style={{ width: '100%', padding: '9px 14px', borderRadius: 10, fontSize: 12.5, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none' }}
                    >
                      <option value="" disabled>-- Select a Showcase Project --</option>
                      {userProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* If Challenge source selected */}
                {createForm.source_type === 'challenge' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Select Challenge <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      required
                      value={createForm.challenge_id}
                      onChange={e => {
                        const ch = userChallenges.find(c => String(c.id) === String(e.target.value))
                        setCreateForm(prev => ({
                          ...prev,
                          challenge_id: e.target.value,
                          challenge_title: ch ? ch.title : '',
                          title: ch ? `Peer Review: ${ch.title}` : prev.title,
                        }))
                      }}
                      style={{ width: '100%', padding: '9px 14px', borderRadius: 10, fontSize: 12.5, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none' }}
                    >
                      <option value="" disabled>-- Select a Challenge --</option>
                      {userChallenges.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Title</label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Need feedback on Redis caching & async queue architecture"
                    style={{ width: '100%', padding: '9px 14px', borderRadius: 10, fontSize: 12.5, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none' }}
                  />
                </div>

                {/* Focus Areas Selection */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Focus Areas for Reviewers</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {FOCUS_OPTIONS.map(f => {
                      const selected = createForm.focus_areas.includes(f.id)
                      return (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => toggleFocusArea(f.id)}
                          style={{
                            padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none',
                            background: selected ? '#000' : 'var(--glass-bg)',
                            color: selected ? '#fff' : 'var(--text-muted)',
                            border: `1px solid ${selected ? 'rgba(255,255,255,0.2)' : 'var(--glass-border)'}`
                          }}
                        >
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description & Questions</label>
                  <textarea
                    rows={3}
                    value={createForm.description}
                    onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Explain what your code does, edge cases you are worried about, or specific questions..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 12.5, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                    background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer', opacity: submitting ? 0.7 : 1, marginTop: 8,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                  }}
                >
                  {submitting ? <Loader2 size={16} className="spinning" /> : '🚀 Publish Review Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
