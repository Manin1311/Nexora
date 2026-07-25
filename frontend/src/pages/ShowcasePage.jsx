import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { 
  Plus, Link2, ExternalLink, Trash2, Edit2, Tag, X, Rocket, 
  Globe, Heart, Bot, Terminal, Sparkles, AlertCircle, Loader2, Users
} from 'lucide-react'
import { showcaseService } from '@/services/showcaseService'
import { useAuth } from '@/context/AuthContext'
import PageWrapper from '@/components/layout/PageWrapper'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const SHOWCASE_TOUR_STEPS = [
  {
    target: 'showcase-header',
    title: '🎨 Developer Showcase',
    description: 'Exhibit your personal projects, open-source repositories, and scaled applications to recruiters and peers.',
    color: '#ec4899',
    placement: 'bottom',
  },
  {
    target: 'showcase-add',
    title: '➕ Add Project',
    description: 'Click here to publish a new project with GitHub links, live demo URL, tech stack tags, and architectural description.',
    color: '#10b981',
    placement: 'left',
  },
  {
    target: 'showcase-grid',
    title: '📱 Public Project Cards',
    description: 'Browse candidate projects, upvote your favorites, and click any card to inspect full tech specs and get AI pitch critiques.',
    color: '#6366f1',
    placement: 'top',
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

const stagger = {
  container: { hidden:{}, show:{ transition:{ staggerChildren:0.08 } } },
  item: { hidden:{ opacity:0, y:24 }, show:{ opacity:1, y:0, transition:{ duration:0.4, ease:[0.4,0,0.2,1] } } },
}

/* ── Card Thumbnail Helper ── */
function renderCardThumbnail(project, hovered) {
  const titleLower = (project.title || '').toLowerCase()
  
  if (titleLower.includes('studyverse')) {
    return (
      <div style={{ 
        width:'100%', height:'100%', position:'relative', overflow:'hidden', 
        background:'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'
      }}>
        {/* Particle/Grid mesh */}
        <div style={{ position:'absolute', inset:0, opacity:0.1, backgroundImage:'radial-gradient(#a78bfa 1px, transparent 1px)', backgroundSize:'10px 10px' }} />
        {/* Orbit Rings */}
        <div style={{ 
          position:'absolute', width:90, height:90, borderRadius:'50%', border:'1px dashed rgba(167,139,250,0.3)',
          animation:'spin 16s linear infinite'
        }} />
        <div style={{ 
          position:'absolute', width:130, height:130, borderRadius:'50%', border:'1px solid rgba(167,139,250,0.15)',
          animation:'spin 24s linear infinite reverse'
        }} />
        {/* Central Core sphere */}
        <div style={{ 
          width:36, height:36, borderRadius:'50%', background:'radial-gradient(circle, #c084fc, #6366f1)',
          boxShadow:'0 0 20px rgba(167,139,250,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16
        }}>
          🎓
        </div>
        {/* Monospace Code tag */}
        <span style={{ position:'absolute', bottom:10, right:12, fontFamily:'monospace', fontSize:9, color:'rgba(167,139,250,0.7)', letterSpacing:0.5 }}>
          [studyverse_env: active]
        </span>
      </div>
    )
  }

  if (titleLower.includes('skillbridge')) {
    return (
      <div style={{ 
        width:'100%', height:'100%', position:'relative', overflow:'hidden', 
        background:'linear-gradient(135deg, #022c22 0%, #0f172a 100%)', display:'flex', justifyContent:'center', alignItems:'center'
      }}>
        {/* Digital Grid line */}
        <div style={{ position:'absolute', left:0, right:0, height:1, background:'rgba(52,211,153,0.2)', top:'50%' }} />
        <div style={{ position:'absolute', top:0, bottom:0, width:1, background:'rgba(52,211,153,0.1)', left:'50%' }} />
        
        {/* Left Node */}
        <div style={{ 
          position:'absolute', left:'20%', width:24, height:24, borderRadius:8, background:'rgba(16,185,129,0.2)', 
          border:'1px solid #10b981', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#10b981', fontWeight: 800, boxShadow:'0 0 10px rgba(16,185,129,0.3)'
        }}>
          C
        </div>
        
        {/* Right Node */}
        <div style={{ 
          position:'absolute', right:'20%', width:24, height:24, borderRadius:8, background:'rgba(99,102,241,0.2)', 
          border:'1px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#818cf8', fontWeight: 800, boxShadow:'0 0 10px rgba(99,102,241,0.3)'
        }}>
          D
        </div>

        {/* Floating pulse marker */}
        <div style={{ 
          position:'absolute', width:6, height:6, borderRadius:'50%', background:'#10b981', 
          boxShadow:'0 0 8px #10b981', left: hovered ? '75%' : '25%', top:'50%', transform:'translate(-50%, -50%)',
          transition:'left 1.2s ease-in-out'
        }} />

        <span style={{ position:'absolute', bottom:10, left:12, fontFamily:'monospace', fontSize:9, color:'rgba(52,211,153,0.7)' }}>
          [p2p_bridge: connected]
        </span>
      </div>
    )
  }

  if (titleLower.includes('fairlens')) {
    return (
      <div style={{ 
        width:'100%', height:'100%', position:'relative', overflow:'hidden', 
        background:'linear-gradient(135deg, #042f2e 0%, #080710 100%)', display:'flex', justifyContent:'center', alignItems:'center'
      }}>
        {/* Grid dots overlay */}
        <div style={{ position:'absolute', inset:0, opacity:0.1, backgroundImage:'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize:'12px 12px' }} />
        
        {/* Scanner target ring */}
        <div style={{ 
          width:64, height:64, borderRadius:'50%', border:'2px solid rgba(6,182,212,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
          boxShadow:'inset 0 0 15px rgba(6,182,212,0.1)'
        }}>
          {/* Concentric scan ring */}
          <div style={{ 
            width:36, height:36, borderRadius:'50%', border:'1px dashed rgba(6,182,212,0.5)',
            animation:'spin 8s linear infinite'
          }} />
          {/* Target core dot */}
          <div style={{ position:'absolute', width:4, height:4, borderRadius:'50%', background:'#06b6d4' }} />
        </div>

        {/* Vertical scanner laser bar */}
        <div style={{ 
          position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#06b6d4,transparent)',
          top: hovered ? '80%' : '20%', transition:'top 0.8s ease-in-out'
        }} />

        <span style={{ position:'absolute', top:10, right:12, fontFamily:'monospace', fontSize:9, color:'rgba(6,182,212,0.7)' }}>
          [fairlens_audit: 100%]
        </span>
      </div>
    )
  }

  // Fallback terminal-styled mock container
  return (
    <div style={{ 
      width:'100%', height:'100%', position:'relative', overflow:'hidden', 
      background:'linear-gradient(135deg, #09090b 0%, #18181b 100%)', 
      fontFamily:'monospace', padding:16, display:'flex', flexDirection:'column', justifyContent:'space-between', textAlign: 'left'
    }}>
      {/* Grid pattern overlay */}
      <div style={{ position:'absolute', inset:0, opacity:0.04, background:'radial-gradient(circle, #818cf8 1px, transparent 1px)', backgroundSize:'8px 8px' }} />
      
      {/* Top terminal window header pills */}
      <div style={{ display:'flex', gap:5, opacity:0.4, marginBottom:10 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#fb7185' }} />
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#fbbf24' }} />
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399' }} />
      </div>

      {/* Code mockup lines */}
      <div style={{ flex:1, opacity:0.55, fontSize:9, color:'#818cf8', display:'flex', flexDirection:'column', gap:3, overflow:'hidden', pointerEvents:'none' }}>
        <div>{`import { Sandbox } from 'nexora'`}</div>
        <div style={{ color:'#34d399' }}>{`const project = new Sandbox({`}</div>
        <div style={{ paddingLeft:10 }}>{`id: "${project.id || 0}",`}</div>
        <div style={{ paddingLeft:10 }}>{`engine: "AI_Agent"`}</div>
        <div style={{ color:'#34d399' }}>{`});`}</div>
      </div>

      <span style={{ alignSelf:'flex-end', fontSize:8, color:'var(--text-muted)', opacity:0.6 }}>
        [project_descriptor: active]
      </span>
    </div>
  )
}

/* ── Project Card ── */
function ProjectCard({ project, onEdit, onDelete, isOwn, onSelect, onLike }) {
  const [hovered, setHovered] = useState(false)
  const { user } = useAuth()

  return (
    <motion.div
      variants={stagger.item}
      style={{ position:'relative', height:'100%' }}
      whileHover={{ y:-6 }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(project)}
        style={{ 
          ...S.card, 
          display:'flex', 
          flexDirection:'column', 
          height:'100%', 
          cursor:'pointer',
          boxShadow: hovered ? '0 12px 30px rgba(99,102,241,0.08)' : 'none',
          borderColor: hovered ? 'rgba(99,102,241,0.3)' : 'var(--card-border)'
        }}
      >
        {/* Holographic glowing line */}
        <div style={{ 
          position:'absolute', top:0, left:0, right:0, height:2, 
          background: hovered ? 'linear-gradient(90deg, #6366f1, #06b6d4)' : 'linear-gradient(90deg,transparent,rgba(99,102,241,0.2),transparent)' 
        }} />

        {/* Exhibition Frame / Image area */}
        <div style={{ 
          height:190, position:'relative', overflow:'hidden', 
          background:'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.08))', 
          borderBottom:'1px solid rgba(99,102,241,0.1)', flexShrink:0 
        }}>
          {project.image ? (
            <img src={project.image} alt={project.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition: 'all 0.5s ease' }} className={hovered ? 'scale-up' : ''} />
          ) : (
            renderCardThumbnail(project, hovered)
          )}
          
          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ position:'absolute', inset:0, background:'rgba(8,7,16,0.72)', display:'flex', alignItems:'center', justifyContent:'center', gap:12, backdropFilter: 'blur(4px)' }}>
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>
                    <motion.div whileHover={{ scale:1.12 }}
                      style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}>
                      <Link2 size={18} style={{ color:'#fff' }} />
                    </motion.div>
                  </a>
                )}
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>
                    <motion.div whileHover={{ scale:1.12 }}
                      style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #6366f1, #8b5cf6)', border:'none', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                      <ExternalLink size={18} style={{ color:'#fff' }} />
                    </motion.div>
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Owner options */}
          {isOwn && String(project.user) === String(user?.id) && (
            <AnimatePresence>
              {hovered && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ position:'absolute', top:12, right:12, display:'flex', gap:6, zIndex:10 }}>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(project) }}
                    style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--card-bg)', border:'1px solid var(--card-border)', cursor:'pointer', outline:'none', transition:'all 0.3s' }}>
                    <Edit2 size={13} style={{ color:'#818cf8' }} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(project.id) }}
                    style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--card-bg)', border:'1px solid rgba(251,113,133,0.25)', cursor:'pointer', outline:'none', transition:'all 0.3s' }}>
                    <Trash2 size={13} style={{ color:'#fb7185' }} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Content area */}
        <div style={{ padding:'20px 22px 22px', flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>
          <h3 style={{ fontSize:17, fontWeight:900, color:'var(--text-heading)', marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', letterSpacing: '-0.01em' }}>
            {project.title}
          </h3>
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:16, flex:1, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {project.description}
          </p>

          {/* Tags */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            {project.tags?.slice(0, 3).map(tag => (
              <span key={tag.id} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:'rgba(99,102,241,0.06)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.12)', textTransform: 'lowercase' }}>
                {tag.name}
              </span>
            ))}
          </div>

          {/* Footer actions */}
          <div style={{ paddingTop:14, borderTop:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight: 500 }}>
              by <span style={{ color:'var(--text-color)', fontWeight: 700 }}>{project.owner_name || 'Developer'}</span>
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/peer-review?project=${project.id}`) }}
                title="Request Peer Review for this project"
                style={{
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: 20, padding: '4px 10px', outline: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5, color: '#a78bfa',
                  fontSize: 11, fontWeight: 800, transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)' }}
              >
                <Users size={11} /> Review
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onLike(project.id) }}
                title={project.is_liked ? "Remove Upvote" : "Upvote Project"}
                style={{
                  background: project.is_liked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', 
                  border:`1px solid ${project.is_liked ? 'rgba(239,68,68,0.25)' : 'var(--glass-border)'}`, 
                  borderRadius: 20, padding:'4px 10px', outline:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:6, color: project.is_liked ? '#ef4444' : 'var(--text-muted)',
                  fontSize:11, fontWeight:800, transition:'all 0.2s'
                }}
                onMouseEnter={e => { if(!project.is_liked) e.currentTarget.style.borderColor='rgba(99,102,241,0.3)' }}
                onMouseLeave={e => { if(!project.is_liked) e.currentTarget.style.borderColor='var(--glass-border)' }}
              >
                <Heart size={12} fill={project.is_liked ? '#ef4444' : 'none'} style={{ transition:'fill 0.2s' }} />
                <span>{project.likes_count || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Project Form Modal ── */
function ProjectModal({ isOpen, onClose, onSaved, editProject }) {
  const [form, setForm] = useState({ title:'', description:'', github_url:'', live_url:'' })
  const [tags, setTags]         = useState([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (editProject) {
      setForm({ title:editProject.title||'', description:editProject.description||'', github_url:editProject.github_url||'', live_url:editProject.live_url||'' })
      setTags(editProject.tags?.map(t => t.name) || [])
    } else {
      setForm({ title:'', description:'', github_url:'', live_url:'' })
      setTags([])
    }
    setTagInput('')
  }, [editProject, isOpen])

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 8) { setTags([...tags, t]); setTagInput('') }
  }
  const removeTag = tag => setTags(tags.filter(t => t !== tag))

  const handleSave = async () => {
    const title = form.title.trim()
    const description = form.description.trim() || 'A high-impact developer project built with modern software architecture.'
    if (!title) {
      alert('Please enter a Project Title.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, title, description, tag_names: tags }
      if (editProject) await showcaseService.update(editProject.id, payload)
      else await showcaseService.create(payload)
      onSaved(); onClose()
    } catch (err) {
      const serverErr = err.response?.data
      let msg = 'Failed to save project.'
      if (serverErr) {
        if (typeof serverErr === 'string') msg = serverErr
        else if (serverErr.error) msg = serverErr.error
        else if (serverErr.detail) msg = serverErr.detail
        else {
          const firstKey = Object.keys(serverErr)[0]
          if (firstKey) msg = `${firstKey}: ${serverErr[firstKey]}`
        }
      }
      alert(msg)
    } finally { setSaving(false) }
  }

  const fieldStyle = {
    width:'100%', padding:'12px 14px', borderRadius:12, fontSize:13,
    background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
    color:'var(--text-color)', outline:'none', display:'block',
    transition:'all 0.3s ease',
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}>
          <motion.div initial={{ scale:0.95, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.95, opacity:0 }}
            style={{ width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:24, boxShadow:'0 32px 80px rgba(0,0,0,0.3)', transition:'all 0.4s ease' }}
            className="no-scrollbar"
          >
            <div style={{ height:3, background:'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }} />
            <div style={{ padding:32 }}>
              <div style={{ display:'flex', alignItems:'center', justifySpace: 'between', marginBottom:24, justifyContent: 'space-between' }}>
                <h2 style={{ fontSize:20, fontWeight:900, color:'var(--text-heading)', letterSpacing: '-0.02em' }}>{editProject ? 'Edit Showcase Project' : 'Share A Project'}</h2>
                <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--text-muted)', cursor:'pointer', outline:'none', transition:'all 0.3s' }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:750, color:'var(--text-color)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Project Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title:e.target.value })} placeholder="e.g. StudyVerse Platform" style={fieldStyle} />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:750, color:'var(--text-color)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Brief Pitch & Description *</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} placeholder="Explain the stack, complexity and why you built it..." rows={4} style={{ ...fieldStyle, resize:'none', fontFamily:'inherit', lineHeight:1.5 }} />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:750, color:'var(--text-color)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Github Repository</label>
                    <input type="url" value={form.github_url} onChange={e => setForm({ ...form, github_url:e.target.value })} placeholder="https://github.com/..." style={fieldStyle} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:750, color:'var(--text-color)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Live Demonstration URL</label>
                    <input type="url" value={form.live_url} onChange={e => setForm({ ...form, live_url:e.target.value })} placeholder="https://..." style={fieldStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:750, color:'var(--text-color)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Tech Keywords & Tags</label>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter') { e.preventDefault(); addTag() } }} placeholder="e.g. react, python, web-sockets" style={{ ...fieldStyle, flex:1 }} />
                    <button onClick={addTag} style={{ padding:'0 16px', borderRadius:12, border:'none', background:'var(--glass-border)', color:'var(--text-color)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Add</button>
                  </div>
                  {tags.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {tags.map(t => (
                        <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 8px', borderRadius:8, fontSize:11, fontWeight:700, background:'rgba(99,102,241,0.1)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.2)' }}>
                          {t} <X size={10} style={{ cursor:'pointer' }} onClick={() => removeTag(t)} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:12 }}>
                  <button onClick={onClose} style={{ padding:'11px 20px', borderRadius:12, border:'1px solid var(--glass-border)', background:'transparent', color:'var(--text-muted)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-primary" style={{ padding:'11px 24px', borderRadius:12, border:'none', fontSize:13, fontWeight:800, cursor:'pointer', opacity:saving||!form.title.trim()?0.5:1 }}>
                    {saving ? 'Uploading...' : editProject ? 'Save Changes' : 'Publish Project'}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ── Project Detail & AI Pitch Auditor Modal ── */
function ProjectDetailModal({ project, isOpen, onClose, onLike, isOwn, user, onEdit, onDelete }) {
  const [critique, setCritique] = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    setCritique(''); setLoading(false)
  }, [project])

  if (!project) return null

  const askAICritic = async () => {
    setLoading(true)
    try {
      const res = await showcaseService.critique(project.id)
      setCritique(res.data.critique || res.data)
    } catch {
      setCritique("Reviewing system timed out. Please try again.")
    } finally { setLoading(false) }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(8,7,16,0.85)', backdropFilter:'blur(12px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}>
          
          <motion.div initial={{ scale:0.95, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.95, opacity:0 }}
            style={{ width:'100%', maxWidth:920, background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:24, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', transition:'all 0.4s ease' }}
          >
            {/* Split Details HUD layout */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', height:520, maxHeight:'80vh' }} className="workspace-container">
              
              {/* Left Panel: Content information */}
              <div style={{ padding:32, overflowY:'auto', display:'flex', flexDirection:'column', justifyContent:'space-between', borderRight:'1px solid var(--card-border)' }} className="no-scrollbar">
                
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
                    <div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                        {project.tags?.map(t => (
                          <span key={t.id} style={{ padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:750, background:'rgba(99,102,241,0.06)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.12)' }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                      <h2 style={{ fontSize:24, fontWeight:950, color:'var(--text-heading)', margin:0, letterSpacing: '-0.02em' }}>{project.title}</h2>
                      <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>by <span style={{ color:'var(--text-color)', fontWeight: 700 }}>{project.owner_name}</span></p>
                    </div>

                    {isOwn && String(project.user) === String(user?.id) && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => { onEdit(project); onClose() }}
                          style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', cursor:'pointer', outline:'none' }}>
                          <Edit2 size={13} style={{ color:'#818cf8' }} />
                        </button>
                        <button onClick={() => { onDelete(project.id); onClose() }}
                          style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(251,113,133,0.12)', border:'1px solid rgba(251,113,133,0.25)', cursor:'pointer', outline:'none' }}>
                          <Trash2 size={13} style={{ color:'#fb7185' }} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize:14, color:'var(--text-color)', lineHeight:1.7, marginBottom:20, whiteSpace:'pre-wrap', fontWeight: 500 }}>
                    {project.description}
                  </p>
                </div>

                {/* Bottom interactive actions row */}
                <div style={{ display:'flex', gap:10, borderTop:'1px solid var(--card-border)', paddingTop:18, marginTop:20 }}>
                  <button
                    onClick={() => onLike(project.id)}
                    style={{
                      padding:'11px 20px', borderRadius:12, fontSize:13, fontWeight:800,
                      background: project.is_liked ? 'rgba(239,68,68,0.12)' : 'var(--glass-bg)',
                      border: `1px solid ${project.is_liked ? '#ef4444' : 'var(--glass-border)'}`,
                      color: project.is_liked ? '#ef4444' : 'var(--text-color)',
                      cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:8, transition:'all 0.2s'
                    }}
                  >
                    <Heart size={16} fill={project.is_liked ? '#ef4444' : 'none'} />
                    <span>{project.likes_count || 0} Upvotes</span>
                  </button>

                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener" style={{ textDecoration:'none' }}>
                      <button style={{ padding:'11px 20px', borderRadius:12, fontSize:13, fontWeight:700, background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--text-color)', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                        <Link2 size={15} /> Source Code
                      </button>
                    </a>
                  )}

                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noopener" style={{ textDecoration:'none' }}>
                      <button style={{ padding:'11px 20px', borderRadius:12, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                        <Globe size={15} /> Live Demo
                      </button>
                    </a>
                  )}
                </div>
              </div>

              {/* Right Panel: AI Critique Terminal */}
              <div style={{ padding:28, display:'flex', flexDirection:'column', gap:18, overflowY:'auto', background:'rgba(0,0,0,0.15)' }} className="no-scrollbar">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Bot size={16} style={{ color:'#818cf8' }} />
                    <span style={{ fontSize:12, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>AI Critique Engine</span>
                  </div>
                </div>

                <div style={{
                  flex:1, background:'#080710', border:'1px solid var(--card-border)',
                  borderRadius:16, padding:20, fontFamily:'monospace', fontSize:13,
                  overflowY:'auto', position:'relative', minHeight:260,
                  boxShadow:'inset 0 0 20px rgba(0,0,0,0.8)'
                }} className="no-scrollbar">
                  <div style={{ position:'absolute', top:12, left:12, width:6, height:6, borderRadius:'50%', background:'#818cf8', boxShadow:'0 0 8px #818cf8' }} />

                  {loading ? (
                    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--text-muted)' }}>
                      <Loader2 className="spinning" size={24} style={{ color:'#818cf8' }} />
                      <motion.span
                        animate={{ opacity:[0.4,1,0.4] }} transition={{ repeat:Infinity, duration:1.2 }}
                        style={{ fontSize:12 }}
                      >
                        Analyzing pitch & tech stack...
                      </motion.span>
                    </div>
                  ) : critique ? (
                    <div style={{ color:'#d1d5db', lineHeight:1.6, whiteSpace:'pre-wrap' }} className="markdown-critique">
                      {critique}
                    </div>
                  ) : (
                    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--text-muted)', textAlign:'center', padding:20 }}>
                      <Terminal size={32} style={{ opacity:0.2, color:'#818cf8' }} />
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text-heading)', marginBottom:6 }}>Need a Second Opinion?</div>
                        <div style={{ fontSize:12, lineHeight:1.5, maxWidth:240 }}>Click below to get a brutal, honest tech review from our AI venture strategist.</div>
                      </div>
                    </div>
                  )}
                </div>

                {!critique && !loading && (
                  <button
                    onClick={askAICritic}
                    style={{
                      width:'100%', padding:'12px', borderRadius:12, border:'none',
                      background:'linear-gradient(135deg, #6366f1, #06b6d4)', color:'#fff',
                      fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center',
                      justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(99,102,241,0.25)'
                    }}
                  >
                    <Sparkles size={14} /> Request AI Pitch Audit
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ── Main Page ── */
export default function ShowcasePage() {
  const [projects,      setProjects]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [detailOpen,    setDetailOpen]    = useState(false)
  const [editProject,   setEditProject]   = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeFilter,  setActiveFilter]  = useState('all')
  const { isAuthenticated, user } = useAuth()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('showcase')

  const loadProjects = () => {
    showcaseService.getAll()
      .then(r => setProjects(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  const handleEdit   = p => { setEditProject(p); setModalOpen(true) }
  const handleDelete = async id => {
    if (!confirm('Delete this project?')) return
    try { await showcaseService.delete(id); setProjects(p => p.filter(x => x.id !== id)) } catch {}
  }

  const handleLike = async (id) => {
    try {
      const res = await showcaseService.like(id)
      setProjects(prev => prev.map(p =>
        p.id === id ? { ...p, is_liked: res.data.liked, likes_count: res.data.likes_count } : p
      ))
      if (selectedProject?.id === id) {
        setSelectedProject(prev => ({ ...prev, is_liked: res.data.liked, likes_count: res.data.likes_count }))
      }
    } catch {}
  }

  const handleSelect = (project) => {
    setSelectedProject(project)
    setDetailOpen(true)
  }

  const allTags = [...new Set(projects.flatMap(p => p.tags?.map(t => t.name) || []))]
  const filtered = activeFilter === 'all' ? projects : projects.filter(p => p.tags?.some(t => t.name === activeFilter))

  return (
    <PageWrapper noPadding>
      <div className="container" style={{ paddingTop:24, paddingBottom:64, position: 'relative' }}>

        {/* Futuristic Grid & Ambient Nebula Mesh */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.25, pointerEvents: 'none', backgroundImage: 'radial-gradient(var(--card-border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: -150, right: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 100, left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header banner */}
        <div data-tour="showcase-header" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:20, marginBottom:32 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Sparkles size={16} style={{ color:'#10b981' }} />
                <span style={{ color:'#10b981', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em' }}>Project Sandbox</span>
              </div>
              <h1 style={{ fontSize:'clamp(26px, 4.5vw, 42px)', fontWeight:950, color:'var(--text-heading)', marginBottom:12, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                Projects that <span className="gradient-text">speak for you.</span>
              </h1>
              <p style={{ fontSize:15, color:'var(--text-muted)', maxWidth:520, lineHeight:1.6, margin: 0 }}>
                A premium exhibition portfolio of candidate developer projects. Share your scaled blueprints, codebase modules, and show the world what you've built.
              </p>
            </div>
          {isAuthenticated && (
            <motion.button data-tour="showcase-add" whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              onClick={() => { setEditProject(null); setModalOpen(true) }}
              className="btn-primary"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, fontWeight:800, fontSize:13, cursor:'pointer', border: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}>
              <Plus size={16} /> Add Project
            </motion.button>
          )}
        </motion.div>

        {/* Tag filters capsules */}
        {allTags.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:28, padding: 4 }}>
            {['all', ...allTags.slice(0, 12)].map(tag => {
              const isActive = activeFilter === tag
              return (
                <button 
                  key={tag} 
                  onClick={() => setActiveFilter(tag === activeFilter && tag !== 'all' ? 'all' : tag)}
                  style={{ 
                    padding:'6px 14px', borderRadius:10, fontSize:11, fontWeight:750, cursor:'pointer', outline:'none', transition:'all 0.3s', textTransform:'capitalize',
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.01)',
                    color: isActive ? '#818cf8' : 'var(--text-color)',
                    borderColor: isActive ? 'rgba(99,102,241,0.45)' : 'var(--glass-border)',
                    borderWidth:1, borderStyle:'solid',
                  }}
                >
                  {tag === 'all' ? 'All Projects' : tag}
                </button>
              )
            })}
          </div>
        )}

        {/* Exhibition list grids */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:20 }}>
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className="shimmer" style={{ borderRadius:20, height:340 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:76, height:76, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', margin:'0 auto 20px' }}>🚀</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'var(--text-heading)', marginBottom:6 }}>No projects published</h3>
            <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:24 }}>Be the first one to highlight your work in the sandbox!</p>
            {isAuthenticated && (
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => { setEditProject(null); setModalOpen(true) }}
                className="btn-primary"
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:12, fontWeight:800, fontSize:13, cursor:'pointer', border: 'none' }}>
                <Plus size={15} /> Showcase Your Project
              </motion.button>
            )}
          </div>
        ) : (
          <motion.div data-tour="showcase-grid" variants={stagger.container} initial="hidden" animate="show"
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:20 }}>
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} onEdit={handleEdit} onDelete={handleDelete} isOwn={isAuthenticated} onSelect={handleSelect} onLike={handleLike} />
            ))}
          </motion.div>
        )}
      </div>

      </div>

      <ProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadProjects} editProject={editProject} />
      
      <ProjectDetailModal project={selectedProject} isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedProject(null) }} onLike={handleLike} isOwn={isAuthenticated} user={user} onEdit={handleEdit} onDelete={handleDelete} />

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .scale-up {
          transform: scale(1.05);
        }
        .markdown-critique h3 {
          font-size: 13px !important;
          font-weight: 800 !important;
          color: #818cf8 !important;
          margin-top: 18px !important;
          margin-bottom: 8px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          border-bottom: 1px dashed rgba(129,140,248,0.2) !important;
          padding-bottom: 4px !important;
        }
        .markdown-critique p {
          font-size: 12px !important;
          line-height: 1.6 !important;
          color: #d1d5db !important;
          margin-bottom: 12px !important;
        }
        .markdown-critique li {
          font-size: 12px !important;
          line-height: 1.6 !important;
          color: #d1d5db !important;
          margin-bottom: 6px !important;
          list-style: square !important;
          margin-left: 16px !important;
        }
      `}</style>

      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#ec4899" />
      <PageTour
        steps={SHOWCASE_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#ec4899"
      />
    </PageWrapper>
  )
}
