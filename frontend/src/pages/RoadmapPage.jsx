import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Brain, ChevronDown, ChevronUp, CheckCircle, Circle,
  Zap, Target, BookOpen, Mic, Code2, RefreshCw, Sparkles,
  Trophy, ArrowRight, AlertCircle, Loader2, CheckSquare, AlertTriangle, ExternalLink, FileText
} from 'lucide-react'
import roadmapService from '@/services/roadmapService'
import resumeService from '@/services/resumeService'
import YoutubePlayerModal from '@/components/ui/YoutubePlayerModal'
import PageTour, { HelpButton } from '@/components/ui/PageTour'
import { usePageTour } from '@/components/ui/usePageTour'

const ROADMAP_TOUR_STEPS = [
  {
    target: 'roadmap-header',
    title: '🗺️ Personalized Roadmap',
    description: 'Build a customized week-by-week developer learning plan tailored to your target career role.',
    color: '#3b82f6',
    placement: 'bottom',
  },
  {
    target: 'roadmap-role',
    title: '🎯 Role Selection',
    description: 'Select your target role (FAANG SWE, Full Stack, Frontend, Backend, DevOps, ML) to analyze required skills against your resume.',
    color: '#6366f1',
    placement: 'bottom',
  },
]

const TARGET_ROLES = [
  { value: 'faang_swe',    label: 'FAANG / Big Tech SWE',   emoji: '🏢', desc: 'Google, Meta, Amazon, Microsoft' },
  { value: 'fullstack_dev',label: 'Full Stack Developer',   emoji: '⚡', desc: 'Frontend + Backend + Deployment' },
  { value: 'frontend_dev', label: 'Frontend Developer',     emoji: '🎨', desc: 'React, CSS, Web Performance' },
  { value: 'backend_dev',  label: 'Backend Developer',      emoji: '🔧', desc: 'APIs, Databases, Architecture' },
  { value: 'devops',       label: 'DevOps / Cloud Engineer',emoji: '☁️', desc: 'CI/CD, Docker, Kubernetes, AWS' },
  { value: 'ml_engineer',  label: 'ML / AI Engineer',       emoji: '🤖', desc: 'Python, TensorFlow, Data Science' },
  { value: 'product',      label: 'Technical PM',           emoji: '📋', desc: 'Product + Engineering blend' },
]

const ROLE_SKILLS = {
  faang_swe: ['Data Structures', 'Algorithms', 'System Design', 'Java', 'Python', 'C++', 'Distributed Systems'],
  fullstack_dev: ['React', 'Node.js', 'JavaScript', 'HTML', 'CSS', 'SQL', 'Express', 'REST APIs'],
  frontend_dev: ['React', 'JavaScript', 'HTML', 'CSS', 'TailwindCSS', 'TypeScript', 'Redux', 'Webpack'],
  backend_dev: ['Python', 'Django', 'Node.js', 'PostgreSQL', 'SQL', 'REST APIs', 'Docker', 'System Design'],
  devops: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform', 'Nginx'],
  ml_engineer: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy'],
  product: ['Product Management', 'System Design', 'Agile', 'Scrum', 'SQL', 'Analytics'],
}

const YOUTUBE_COURSES = {
  'Data Structures': {
    title: 'Data Structures and Algorithms for Beginners',
    url: 'https://www.youtube.com/watch?v=8hly31xKjhc',
    thumbnail: 'https://img.youtube.com/vi/8hly31xKjhc/hqdefault.jpg'
  },
  'Algorithms': {
    title: 'Algorithms Course for Beginners',
    url: 'https://www.youtube.com/watch?v=0IAPZzGSbME',
    thumbnail: 'https://img.youtube.com/vi/0IAPZzGSbME/hqdefault.jpg'
  },
  'System Design': {
    title: 'System Design Course for Beginners',
    url: 'https://www.youtube.com/watch?v=kYyE9l9V1Sg',
    thumbnail: 'https://img.youtube.com/vi/kYyE9l9V1Sg/hqdefault.jpg'
  },
  'Java': {
    title: 'Java Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=A74TOX803D0',
    thumbnail: 'https://img.youtube.com/vi/A74TOX803D0/hqdefault.jpg'
  },
  'Python': {
    title: 'Python for Beginners - Full Course',
    url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
    thumbnail: 'https://img.youtube.com/vi/_uQrJ0TkZlc/hqdefault.jpg'
  },
  'C++': {
    title: 'C++ Tutorial for Beginners - Full Course',
    url: 'https://www.youtube.com/watch?v=vLnPwxZdW4Y',
    thumbnail: 'https://img.youtube.com/vi/vLnPwxZdW4Y/hqdefault.jpg'
  },
  'Distributed Systems': {
    title: 'Distributed Systems Lecture Series',
    url: 'https://www.youtube.com/watch?v=cQP8WApzIQQ',
    thumbnail: 'https://img.youtube.com/vi/cQP8WApzIQQ/hqdefault.jpg'
  },
  'React': {
    title: 'React JS Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    thumbnail: 'https://img.youtube.com/vi/SqcY0GlETPk/hqdefault.jpg'
  },
  'Node.js': {
    title: 'Node.js and Express.js Full Course',
    url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
    thumbnail: 'https://img.youtube.com/vi/Oe421EPjeBE/hqdefault.jpg'
  },
  'JavaScript': {
    title: 'JavaScript Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=c-I5S_z56PM',
    thumbnail: 'https://img.youtube.com/vi/c-I5S_z56PM/hqdefault.jpg'
  },
  'HTML': {
    title: 'HTML & CSS Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=mU6anWqOD4c',
    thumbnail: 'https://img.youtube.com/vi/mU6anWqOD4c/hqdefault.jpg'
  },
  'CSS': {
    title: 'CSS Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=OXGznpKZ_sA',
    thumbnail: 'https://img.youtube.com/vi/OXGznpKZ_sA/hqdefault.jpg'
  },
  'SQL': {
    title: 'Learn SQL in 1 Hour - SQL Basics for Beginners',
    url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    thumbnail: 'https://img.youtube.com/vi/HXV3zeQKqGY/hqdefault.jpg'
  },
  'Express': {
    title: 'ExpressJS Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=7H_QH9nipRL',
    thumbnail: 'https://img.youtube.com/vi/7H_QH9nipRL/hqdefault.jpg'
  },
  'REST APIs': {
    title: 'REST API Crash Course - Design & Development',
    url: 'https://www.youtube.com/watch?v=-MTSQjw5DrM',
    thumbnail: 'https://img.youtube.com/vi/-MTSQjw5DrM/hqdefault.jpg'
  },
  'TailwindCSS': {
    title: 'Tailwind CSS Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=lCxcTsOHr5Y',
    thumbnail: 'https://img.youtube.com/vi/lCxcTsOHr5Y/hqdefault.jpg'
  },
  'TypeScript': {
    title: 'TypeScript Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=d56mG7DezGs',
    thumbnail: 'https://img.youtube.com/vi/d56mG7DezGs/hqdefault.jpg'
  },
  'Redux': {
    title: 'Redux Toolkit Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=iBUJVy8pe1Q',
    thumbnail: 'https://img.youtube.com/vi/iBUJVy8pe1Q/hqdefault.jpg'
  },
  'Webpack': {
    title: 'Webpack Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=X1lyVyyEsQg',
    thumbnail: 'https://img.youtube.com/vi/X1lyVyyEsQg/hqdefault.jpg'
  },
  'Django': {
    title: 'Python Django Web Framework - Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=F5mRW0b-mMM',
    thumbnail: 'https://img.youtube.com/vi/F5mRW0b-mMM/hqdefault.jpg'
  },
  'PostgreSQL': {
    title: 'PostgreSQL Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=qw--VYLpxG4',
    thumbnail: 'https://img.youtube.com/vi/qw--VYLpxG4/hqdefault.jpg'
  },
  'Docker': {
    title: 'Docker for Beginners: Full Course',
    url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
    thumbnail: 'https://img.youtube.com/vi/fqMOX6JJhGo/hqdefault.jpg'
  },
  'Kubernetes': {
    title: 'Kubernetes Course for Beginners',
    url: 'https://www.youtube.com/watch?v=d6WC5n9G_sM',
    thumbnail: 'https://img.youtube.com/vi/d6WC5n9G_sM/hqdefault.jpg'
  },
  'CI/CD': {
    title: 'CI/CD Pipelines Explained',
    url: 'https://www.youtube.com/watch?v=scEDHsr3APg',
    thumbnail: 'https://img.youtube.com/vi/scEDHsr3APg/hqdefault.jpg'
  },
  'AWS': {
    title: 'AWS Certified Cloud Practitioner Training',
    url: 'https://www.youtube.com/watch?v=SOTamWGuqXs',
    thumbnail: 'https://img.youtube.com/vi/SOTamWGuqXs/hqdefault.jpg'
  },
  'Linux': {
    title: 'Linux for Beginners Course',
    url: 'https://www.youtube.com/watch?v=wBp0Rb-ZJak',
    thumbnail: 'https://img.youtube.com/vi/wBp0Rb-ZJak/hqdefault.jpg'
  },
  'Terraform': {
    title: 'Terraform Course for Beginners',
    url: 'https://www.youtube.com/watch?v=7xzyhDby_b8',
    thumbnail: 'https://img.youtube.com/vi/7xzyhDby_b8/hqdefault.jpg'
  },
  'Nginx': {
    title: 'Nginx Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=JKxlsvZsAbA',
    thumbnail: 'https://img.youtube.com/vi/JKxlsvZsAbA/hqdefault.jpg'
  },
  'TensorFlow': {
    title: 'TensorFlow 2.0 Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=tPYj31viWy0',
    thumbnail: 'https://img.youtube.com/vi/tPYj31viWy0/hqdefault.jpg'
  },
  'PyTorch': {
    title: 'PyTorch for Deep Learning Bootcamp',
    url: 'https://www.youtube.com/watch?v=V_xro1bcAuA',
    thumbnail: 'https://img.youtube.com/vi/V_xro1bcAuA/hqdefault.jpg'
  },
  'Machine Learning': {
    title: 'Machine Learning for Beginners Course',
    url: 'https://www.youtube.com/watch?v=NWONeJKn6kc',
    thumbnail: 'https://img.youtube.com/vi/NWONeJKn6kc/hqdefault.jpg'
  },
  'Deep Learning': {
    title: 'Deep Learning Full Course - 12 Hours',
    url: 'https://www.youtube.com/watch?v=5tvmMX8r_OM',
    thumbnail: 'https://img.youtube.com/vi/5tvmMX8r_OM/hqdefault.jpg'
  },
  'Pandas': {
    title: 'Pandas Data Analysis Tutorial',
    url: 'https://www.youtube.com/watch?v=vmEHCJofHsg',
    thumbnail: 'https://img.youtube.com/vi/vmEHCJofHsg/hqdefault.jpg'
  },
  'NumPy': {
    title: 'NumPy Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=QUT1VHiLgKQ',
    thumbnail: 'https://img.youtube.com/vi/QUT1VHiLgKQ/hqdefault.jpg'
  },
  'Product Management': {
    title: 'Product Management Course for Beginners',
    url: 'https://www.youtube.com/watch?v=JmSZ_j09g18',
    thumbnail: 'https://img.youtube.com/vi/JmSZ_j09g18/hqdefault.jpg'
  },
  'Agile': {
    title: 'Agile Methodology Full Course',
    url: 'https://www.youtube.com/watch?v=84hV03N5G6U',
    thumbnail: 'https://img.youtube.com/vi/84hV03N5G6U/hqdefault.jpg'
  },
  'Scrum': {
    title: 'Scrum Methodologies Explained',
    url: 'https://www.youtube.com/watch?v=9TycXR0825I',
    thumbnail: 'https://img.youtube.com/vi/9TycXR0825I/hqdefault.jpg'
  },
  'Analytics': {
    title: 'Data Analytics Full Course',
    url: 'https://www.youtube.com/watch?v=u83gT0P7bH4',
    thumbnail: 'https://img.youtube.com/vi/u83gT0P7bH4/hqdefault.jpg'
  }
}

// ── YoutubeCard: hides itself when thumbnail is missing/broken ───────────────
// YouTube serves a 120×90 gray image (not 404) for missing/deleted videos,
// so onError never fires. We use onLoad to check naturalWidth === 120.
function YoutubeCard({ skill, course }) {
  const [hidden, setHidden] = useState(false)
  const [showModal, setShowModal] = useState(false)

  if (hidden) return null
  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        style={{ display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, overflow: 'hidden', transition: 'all 0.4s ease', cursor: 'pointer' }}
      >
        <div style={{ width: '100%', height: 110, position: 'relative', overflow: 'hidden', background: 'var(--glass-bg)' }}>
          <img
            src={course.thumbnail}
            alt={course.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onLoad={e => { if (e.target.naturalWidth <= 120) setHidden(true) }}
            onError={() => setHidden(true)}
          />
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
            {skill}
          </div>
        </div>
        <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.4 }}>{course.title}</div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: 11, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', width: '100%' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#ef4444"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
            Watch with Transcript
          </button>
        </div>
      </div>

      <YoutubePlayerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        video={{ ...course, skill }}
      />
    </>
  )
}

const TASK_ICON = {
  challenge: Code2,
  interview: Mic,
  study:     BookOpen,
}

const TASK_COLOR = {
  challenge: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' },
  interview: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', text: '#f472b6' },
  study:     { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
}

const FOCUS_AREA_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
]

export default function RoadmapPage() {
  const [roadmap,      setRoadmap]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [generating,   setGenerating]   = useState(false)
  const [error,        setError]        = useState('')
  const [selectedRole, setSelectedRole] = useState('fullstack_dev')
  const [expandedWeeks,setExpandedWeeks]= useState({})
  const [completing,   setCompleting]   = useState({})
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const navigate = useNavigate()
  const { isOpen: tourOpen, openTour, closeTour } = usePageTour('roadmap')

  const [wizardStep, setWizardStep] = useState('select') // 'select', 'verify', 'active'
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState(false)
  const [isResumeEmpty, setIsResumeEmpty] = useState(false)
  const [matchedSkills, setMatchedSkills] = useState([])
  const [missingSkills, setMissingSkills] = useState([])
  
  const [youtubeCourses, setYoutubeCourses] = useState({})
  const [loadingResources, setLoadingResources] = useState(false)

  const fetchYoutubeResourcesForSkills = async (skills) => {
    if (!skills || skills.length === 0) return
    setLoadingResources(true)
    try {
      const fetched = { ...youtubeCourses }
      await Promise.all(
        skills.map(async (skill) => {
          if (fetched[skill]) return
          try {
            const data = await roadmapService.getYoutubeResources(skill)
            if (data && data.length > 0) {
              fetched[skill] = data[0]
            }
          } catch (err) {
            console.error(`Failed to fetch YouTube course for ${skill}:`, err)
          }
        })
      )
      setYoutubeCourses(fetched)
    } catch (e) {
      console.error('Error fetching YouTube resources:', e)
    } finally {
      setLoadingResources(false)
    }
  }

  useEffect(() => {
    loadRoadmap()
  }, [])

  const loadRoadmap = async () => {
    setLoading(true)
    try {
      const data = await roadmapService.get()
      if (!data || data.active === false || !data.weeks) {
        setRoadmap(null)
        setWizardStep('select')
      } else {
        setRoadmap(data)
        setWizardStep('active')
        // Sync the role selector to the current roadmap's target role
        if (data.target_role) setSelectedRole(data.target_role)
        // Auto-expand first incomplete week
        const firstIncomplete = data.weeks?.find(w => !w.is_completed)
        if (firstIncomplete) {
          setExpandedWeeks({ [firstIncomplete.id]: true })
        }
        // Fetch dynamic YouTube resources
        const roleSkills = ROLE_SKILLS[data.target_role] || []
        fetchYoutubeResourcesForSkills(roleSkills)
      }
    } catch (e) {
      if (e?.response?.status === 404) {
        setRoadmap(null) // No roadmap yet — show generator
        setWizardStep('select')
      } else {
        setError('Failed to load roadmap. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySkills = async () => {
    setVerifying(true)
    setVerificationError(false)
    setIsResumeEmpty(false)
    try {
      const res = await resumeService.getResume()
      const data = res.data
      const rSkills = (data.skills || []).flatMap(g => g.items || []).map(s => s.toLowerCase())
      
      const required = ROLE_SKILLS[selectedRole] || []
      const matched = []
      const missing = []

      required.forEach(skill => {
        const skillLower = skill.toLowerCase()
        if (rSkills.includes(skillLower)) {
          matched.push(skill)
        } else {
          missing.push(skill)
        }
      })
      
      setMatchedSkills(matched)
      setMissingSkills(missing)
      setIsResumeEmpty(rSkills.length === 0)
      setVerificationError(matched.length === 0)
      setWizardStep('verify')
      // Fetch dynamic recommended materials for missing skills
      fetchYoutubeResourcesForSkills(missing)
    } catch (e) {
      console.error(e)
      setVerificationError(true)
      setWizardStep('verify')
    } finally {
      setVerifying(false)
    }
  }

  const handleQuickStart = async () => {
    setGenerating(true)
    setError('')
    try {
      // Auto-populate required skills into Resume profile
      const required = ROLE_SKILLS[selectedRole] || []
      const defaultSkills = [
        { category: 'Languages', items: required.slice(0, Math.ceil(required.length / 2)) },
        { category: 'Frameworks & Tools', items: required.slice(Math.ceil(required.length / 2)) },
      ]
      
      await resumeService.saveResume({
        personal_info: { name: '', title: '', email: '', phone: '', linkedin: '', github: '', website: '', summary: '' },
        experience: [],
        projects: [],
        skills: defaultSkills,
        education: [],
        certifications: [],
        target_role: TARGET_ROLES.find(r => r.value === selectedRole)?.label || '',
      })

      // Proceed to generate roadmap
      await handleGenerate()
    } catch (err) {
      console.error('Failed in quick start flow:', err)
      setError('Failed to auto-populate skills. Please try manual resume creation.')
      setGenerating(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const data = await roadmapService.generate(selectedRole)
      setRoadmap(data)
      setWizardStep('active')
      setShowRoleSelect(false)
      const firstWeek = data.weeks?.[0]
      if (firstWeek) setExpandedWeeks({ [firstWeek.id]: true })
      
      // Fetch dynamic YouTube resources
      const roleSkills = ROLE_SKILLS[selectedRole] || []
      fetchYoutubeResourcesForSkills(roleSkills)
    } catch (e) {
      setError('Failed to generate roadmap. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleTask = async (taskId) => {
    setCompleting(prev => ({ ...prev, [taskId]: true }))
    try {
      const updated = await roadmapService.completeTask(taskId)
      setRoadmap(prev => ({
        ...prev,
        weeks: prev.weeks.map(week => ({
          ...week,
          tasks: week.tasks.map(t => t.id === taskId ? updated : t),
          is_completed: week.tasks.every(t =>
            t.id === taskId ? updated.is_done : t.is_done
          ),
        }))
      }))
    } catch (e) {
      console.error('Failed to toggle task:', e)
    } finally {
      setCompleting(prev => ({ ...prev, [taskId]: false }))
    }
  }

  const toggleWeek = (weekId) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }))
  }

  const handleTaskAction = (task) => {
    navigate(`/roadmap/learn/${task.id}`)
  }


  const totalTasks     = roadmap?.weeks?.reduce((a, w) => a + (w.tasks?.length || 0), 0) || 0
  const completedTasks = roadmap?.weeks?.reduce((a, w) => a + (w.tasks?.filter(t => t.is_done).length || 0), 0) || 0
  const overallPct     = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const completedWeeks = roadmap?.weeks?.filter(w => w.tasks?.length > 0 && w.tasks.every(t => t.is_done)).length || 0

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={40} color="#6366f1" />
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingTop: 80, transition: 'background-color 0.4s ease' }}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="container" style={{ maxWidth: 900, position: 'relative', zIndex: 1, paddingBottom: 80 }}>

        {/* ── Header ── */}
        <motion.div data-tour="roadmap-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 16 }}>
            <Brain size={14} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', letterSpacing: '0.05em' }}>AI-POWERED LEARNING PATH</span>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, background: 'linear-gradient(135deg, var(--text-heading) 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
            My Roadmap
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
            Personalized week-by-week plan based on your actual challenge and interview performance
          </p>
        </motion.div>

        {/* ── Wizard Step 1: Select Aiming Role ── */}
        {!roadmap && wizardStep === 'select' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ padding: 36, borderRadius: 24, background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(24px)', transition: 'all 0.4s ease' }}>
              <div data-tour="roadmap-role" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Target size={20} color="#818cf8" />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Step 1: Select Your Target Role</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
                Select the role you are aiming for. We will verify your resume against the industry-standard skillset required for this role.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
                {TARGET_ROLES.map(role => (
                  <motion.button key={role.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole(role.value)}
                    style={{
                      padding: '14px 16px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                      background: selectedRole === role.value ? 'rgba(99,102,241,0.2)' : 'var(--glass-bg)',
                      border: `1px solid ${selectedRole === role.value ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                      transition: 'all 0.2s',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{role.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedRole === role.value ? '#818cf8' : 'var(--text-color)', marginBottom: 2 }}>{role.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{role.desc}</div>
                  </motion.button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleVerifySkills} disabled={verifying}
                  className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: verifying ? 'not-allowed' : 'pointer' }}>
                  {verifying ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Verifying Resume...</>
                  ) : (
                    <><CheckSquare size={16} />Verify Skills &amp; Resume</>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Wizard Step 2: Resume Skills Check & Recommendations ── */}
        {!roadmap && wizardStep === 'verify' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ padding: 36, borderRadius: 24, background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(24px)', transition: 'all 0.4s ease' }}>
              
              {/* Back to roles button */}
              <button onClick={() => setWizardStep('select')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                ← Back to Roles Selection
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Brain size={22} color="#818cf8" />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                  Step 2: Skill Verification
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
                Target Role: <strong style={{ color: 'var(--text-heading)' }}>{TARGET_ROLES.find(r => r.value === selectedRole)?.label}</strong>
              </p>

              {/* Case A: 0 overlap (Verification Error) */}
              {verificationError ? (
                isResumeEmpty ? (
                  /* Case A1: Brand new user with empty resume */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 12, padding: '18px 20px', borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                      <Sparkles size={24} style={{ flexShrink: 0, marginTop: 2, color: '#818cf8' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: 'var(--text-heading)' }}>Welcome to Nexora! Let's get you set up</div>
                        <p style={{ fontSize: 13, color: 'var(--text-color)', opacity: 0.85, margin: 0, lineHeight: 1.6 }}>
                          It looks like you haven't declared any skills in your resume profile yet. To help you get started quickly, we can automatically add the core skills for <b>{TARGET_ROLES.find(r => r.value === selectedRole)?.label}</b> to your profile and generate your roadmap instantly!
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleQuickStart}
                        disabled={generating}
                        className="btn-primary"
                        style={{ padding: '14px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {generating ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Sparkles size={16} /> Auto-populate & Create Roadmap</>}
                      </motion.button>
                      <button onClick={() => navigate('/resume')} style={{ padding: '14px 20px', borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        Build Resume Manually
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Case A2: Existing user with mismatched skills */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderRadius: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                      <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Update your resume as it does not match your current skillset</div>
                        <p style={{ fontSize: 13, color: 'var(--text-color)', opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
                          We couldn't find any overlapping technical skills for the role of <b>{TARGET_ROLES.find(r => r.value === selectedRole)?.label}</b> in your active resume. Please add your skills to your resume first to continue.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/resume')}
                        className="btn-primary"
                        style={{ padding: '14px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} /> Go to Resume Hub
                      </motion.button>
                      <button onClick={() => setWizardStep('select')} style={{ padding: '14px 20px', borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Case B: Success with overlap */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                    <CheckCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>Resume Verified!</div>
                      <span style={{ fontSize: 13, color: 'var(--text-color)', opacity: 0.85 }}>Your resume overlaps with the required skills for this role.</span>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Matched Skills */}
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: 20, borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#10b981', fontWeight: 700, fontSize: 14 }}>
                        <CheckCircle size={14} /> Matched Resume Skills ({matchedSkills.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {matchedSkills.map(s => (
                          <span key={s} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: 20, borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#f59e0b', fontWeight: 700, fontSize: 14 }}>
                        <AlertTriangle size={14} /> Missing Skills ({missingSkills.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {missingSkills.map(s => (
                          <span key={s} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706', fontSize: 12, fontWeight: 600 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* YouTube Courses for Missing Skills */}
                  {(() => {
                    const coursesForMissing = missingSkills.filter(s => youtubeCourses[s])
                    if (coursesForMissing.length === 0 && !loadingResources) return null
                    
                    return (
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>
                          Recommended Learning Materials
                        </h3>
                        {loadingResources ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {Array.from({ length: 2 }).map((_, idx) => (
                              <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', height: 160, position: 'relative' }} className="shimmer">
                                <div style={{ height: 100, background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ padding: 12 }}>
                                  <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 8 }} />
                                  <div style={{ height: 10, width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {coursesForMissing.map(skill => (
                              <YoutubeCard key={skill} skill={skill} course={youtubeCourses[skill]} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertCircle size={14} color="#ef4444" />
                      <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={handleGenerate} disabled={generating}
                      className="btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer' }}>
                      {generating ? (
                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />AI is generating your roadmap...</>
                      ) : (
                        <><Sparkles size={16} />Generate Weekly AI Roadmap</>
                      )}
                    </motion.button>
                    <button onClick={() => setWizardStep('select')} style={{ padding: '14px 20px', borderRadius: 14, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Active Roadmap ── */}
        {roadmap && !showRoleSelect && (
          <>
            {/* Stats Bar */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
              {[
                { label: 'Target Role', value: TARGET_ROLES.find(r => r.value === roadmap.target_role)?.label || roadmap.target_role, icon: Target, color: '#818cf8' },
                { label: 'Total Weeks', value: `${roadmap.total_weeks} weeks`, icon: Brain, color: '#f472b6' },
                { label: 'Completed', value: `${completedWeeks}/${roadmap.total_weeks} weeks`, icon: Trophy, color: '#fbbf24' },
                { label: 'Tasks Done', value: `${completedTasks}/${totalTasks}`, icon: CheckCircle, color: '#34d399' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(12px)', transition: 'all 0.4s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <stat.icon size={14} color={stat.color} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{stat.value}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Overall Progress */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ marginBottom: 36, padding: '20px 24px', borderRadius: 16, background: 'var(--card-bg)', border: '1px solid var(--card-border)', transition: 'all 0.4s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-color)' }}>Overall Progress</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>{overallPct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1.2, delay: 0.4 }}
                  style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' }} />
              </div>
            </motion.div>

            {/* Regenerate Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                onClick={() => { setRoadmap(null); setWizardStep('select') }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <RefreshCw size={13} />
                Regenerate
              </motion.button>
            </div>

            {/* Week Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {roadmap.weeks?.map((week, idx) => {
                const color = FOCUS_AREA_COLORS[idx % FOCUS_AREA_COLORS.length]
                const isExpanded = expandedWeeks[week.id]
                
                // Dynamic calculations for reactivity
                const totalTasksCount = week.tasks?.length || 0
                const completedTasksCount = week.tasks?.filter(t => t.is_done).length || 0
                const weekPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0
                const isWeekCompleted = totalTasksCount > 0 && week.tasks.every(t => t.is_done)

                return (
                  <motion.div key={week.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    style={{ borderRadius: 20, background: 'var(--card-bg)', border: `1px solid ${isWeekCompleted ? 'rgba(52,211,153,0.3)' : 'var(--card-border)'}`, backdropFilter: 'blur(16px)', overflow: 'hidden', transition: 'all 0.4s ease' }}>

                    {/* Week Header */}
                    <button onClick={() => toggleWeek(week.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      {/* Week number circle */}
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: isWeekCompleted ? 'rgba(52,211,153,0.15)' : `${color}22`, border: `2px solid ${isWeekCompleted ? '#34d399' : color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                        {isWeekCompleted
                          ? <CheckCircle size={20} color="#34d399" />
                          : <span style={{ fontSize: 15, fontWeight: 800, color }}>{week.week_number}</span>
                        }
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Week {week.week_number}: {week.focus_area}</span>
                          {isWeekCompleted && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', padding: '2px 8px', borderRadius: 20 }}>DONE</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--scrollbar-track)', overflow: 'hidden', maxWidth: 200, transition: 'all 0.4s ease' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${weekPct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                              style={{ height: '100%', borderRadius: 2, background: isWeekCompleted ? '#34d399' : `linear-gradient(90deg, ${color}, ${color}99)` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{completedTasksCount}/{totalTasksCount} tasks</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Zap size={11} color="#fbbf24" />
                            <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>{week.xp_goal} XP goal</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>

                    {/* Weak Area Note */}
                    {isExpanded && week.weakness_reason && (
                      <div style={{ margin: '0 24px 16px', padding: '10px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', gap: 8 }}>
                        <AlertCircle size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.5 }}>{week.weakness_reason}</span>
                      </div>
                    )}

                    {/* Tasks */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {week.tasks?.map((task, ti) => {
                            const TaskIcon  = TASK_ICON[task.task_type] || Circle
                            const colors    = TASK_COLOR[task.task_type] || TASK_COLOR.study
                            const isLoading = completing[task.id]
                            const isActionable = task.task_type !== 'study'

                            return (
                              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ti * 0.05 }}
                                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, background: task.is_done ? 'rgba(52,211,153,0.05)' : colors.bg, border: `1px solid ${task.is_done ? 'rgba(52,211,153,0.2)' : colors.border}`, transition: 'all 0.3s' }}>

                                {/* Status indicator — read only, auto-set when task is completed */}
                                <div
                                  title={task.is_done ? 'Completed' : 'Complete this task to mark it done'}
                                  style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${task.is_done ? '#34d399' : colors.text}`, background: task.is_done ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s', cursor: 'default' }}>
                                  {task.is_done && <CheckCircle size={12} color="#fff" fill="#fff" />}
                                </div>

                                {/* Task Icon */}
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <TaskIcon size={13} color={colors.text} />
                                </div>

                                {/* Task Content */}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: task.is_done ? 'var(--text-muted)' : 'var(--text-color)', textDecoration: task.is_done ? 'line-through' : 'none', marginBottom: 2 }}>
                                    {task.title}
                                  </div>
                                  {task.description && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.description}</div>
                                  )}
                                  {task.interview_mode && (
                                    <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                                      <span style={{ fontSize: 10, fontWeight: 600, color: colors.text, background: colors.bg, border: `1px solid ${colors.border}`, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>
                                        {task.interview_mode}
                                      </span>
                                      {task.interview_difficulty && (
                                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-color)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>
                                          {task.interview_difficulty}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Action Button */}
                                {!task.is_done && (
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => handleTaskAction(task)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                    Go <ArrowRight size={11} />
                                  </motion.button>
                                )}
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

            {/* ── YouTube Learning Resources (always visible on active roadmap) ── */}
            {(() => {
              const roleSkills = ROLE_SKILLS[roadmap.target_role] || []
              if (roleSkills.length === 0) return null
              
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  style={{ marginTop: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#ef4444"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>Learning Resources</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Curated YouTube courses for your {TARGET_ROLES.find(r => r.value === roadmap.target_role)?.label} roadmap</p>
                    </div>
                  </div>
                  
                  {loadingResources ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                      {roleSkills.slice(0, 3).map((_, idx) => (
                        <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', height: 160, position: 'relative' }} className="shimmer">
                          <div style={{ height: 100, background: 'rgba(255,255,255,0.05)' }} />
                          <div style={{ padding: 12 }}>
                            <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 8 }} />
                            <div style={{ height: 10, width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                      {roleSkills.map(skill => {
                        const course = youtubeCourses[skill]
                        if (!course) return null
                        return <YoutubeCard key={skill} skill={skill} course={course} />
                      })}
                    </div>
                  )}
                </motion.div>
              )
            })()}
          </>
        )}
      </div>

      {/* ── Page Tour ── */}
      <HelpButton onClick={openTour} accentColor="#3b82f6" />
      <PageTour
        steps={ROADMAP_TOUR_STEPS}
        isOpen={tourOpen}
        onClose={closeTour}
        accentColor="#3b82f6"
      />
    </div>
  )
}
