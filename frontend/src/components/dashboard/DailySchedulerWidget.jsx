import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, CheckCircle, Circle, ArrowRight,
  Sparkles, Loader2, BookOpen, Map
} from 'lucide-react'
import api from '@/services/api'

const S = {
  card: {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--card-border)',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    padding: 20,
    transition: 'background-color 0.4s ease, border-color 0.4s ease',
  },
  focusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(99,102,241,0.05))',
    border: '1px solid rgba(129,140,248,0.25)',
    borderRadius: 12,
    padding: '10px 14px',
    marginBottom: 16,
  },
  noRoadmapBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(234,179,8,0.04))',
    border: '1px solid rgba(251,191,36,0.25)',
    borderRadius: 12,
    padding: '10px 14px',
    marginBottom: 16,
  },
  topicBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
    background: 'rgba(129,140,248,0.12)',
    color: '#818cf8',
    border: '1px solid rgba(129,140,248,0.2)',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
}

export default function DailySchedulerWidget() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [adapted, setAdapted] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [todayTopic, setTodayTopic] = useState(null)
  const [hasRoadmap, setHasRoadmap] = useState(false)
  const [generatingId, setGeneratingId] = useState(null) // AI challenge generation in progress

  const fetchSchedule = () => {
    api.get('/progress/schedule/sync/')
      .then(res => {
        setTasks(res.data.tasks || [])
        setAdapted(res.data.adapted || false)
        setTodayTopic(res.data.today_topic || null)
        setHasRoadmap(res.data.has_roadmap || false)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching schedule:', err)
        setLoading(false)
      })
  }

  useEffect(() => { fetchSchedule() }, [])

  const toggleComplete = async (taskId) => {
    setTogglingId(taskId)
    try {
      await api.post(`/progress/schedule/complete/${taskId}/`)
      fetchSchedule()
    } catch (err) {
      console.error('Error toggling task:', err)
    } finally {
      setTogglingId(null)
    }
  }

  // For roadmap challenge tasks with no specific challenge linked yet:
  // auto-generate an AI challenge on the spot and redirect to it.
  const generateAndGo = async (task) => {
    if (generatingId) return // prevent double-tap
    setGeneratingId(task.id)
    try {
      const res = await api.post('/challenges/generate-from-task/', { task_id: task.id })
      const newId = res.data.challenge_id
      // Refresh schedule so next click goes directly to the challenge
      fetchSchedule()
      navigate(`/challenges/${newId}`)
    } catch (err) {
      console.error('Error generating challenge:', err)
      // Fallback to challenges list
      navigate('/challenges')
    } finally {
      setGeneratingId(null)
    }
  }

  const formatTaskDate = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const priorityColor = (p) => {
    if (p === 3) return '#fb7185'
    if (p === 2) return '#fbbf24'
    return '#60a5fa'
  }

  const priorityLabel = (p) => {
    if (p === 3) return 'HIGH'
    if (p === 2) return 'MED'
    return 'LOW'
  }

  // Group tasks by date
  const groupedTasks = tasks.reduce((groups, task) => {
    const d = task.scheduled_date
    if (!groups[d]) groups[d] = []
    groups[d].push(task)
    return groups
  }, {})
  const sortedDates = Object.keys(groupedTasks).sort()

  // todayTopic & hasRoadmap come directly from API — reliable even for old generic tasks
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTasks = groupedTasks[todayStr] || []

  if (loading) {
    return (
      <div style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
      </div>
    )
  }

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={18} style={{ color: '#818cf8' }} />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)' }}>
            What Should I Do Today?
          </h3>
        </div>
        <div style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
          Adaptive Tracker
        </div>
      </div>

      {/* Today's Focus Banner — shown when roadmap topic exists */}
      <AnimatePresence>
        {todayTopic && (
          <motion.div
            key="focus-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={S.focusBanner}
          >
            <BookOpen size={15} style={{ color: '#818cf8', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Today's Focus
              </span>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#c7d2fe', margin: 0, marginTop: 1 }}>
                {todayTopic}
              </p>
            </div>
          </motion.div>
        )}



        {/* Adaptive shift notification */}
        {adapted && (
          <motion.div
            key="adapted-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <Sparkles size={14} style={{ color: '#34d399', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
              <strong style={{ color: '#34d399' }}>Schedule Adapted!</strong> Missed tasks were automatically rescheduled to keep you on track.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {sortedDates.length === 0 ? (
          hasRoadmap ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No scheduled tasks for this week. Great job! 🎉
            </p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px 20px',
              textAlign: 'center',
              background: 'rgba(251,191,36,0.02)',
              border: '1px dashed rgba(251,191,36,0.2)',
              borderRadius: 12,
            }}>
              <Map size={24} style={{ color: '#fbbf24', marginBottom: 12 }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 6px' }}>
                No active roadmap
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, margin: '0 0 16px', lineHeight: 1.5 }}>
                Generate a personalized roadmap to get structured daily tasks tailored to your learning goals.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { navigate('/roadmap') }}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
                }}
              >
                Create Your First Roadmap ✨
              </motion.button>
            </div>
          )
        ) : (
          sortedDates.map((dateStr) => (
            <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Date section header */}
              <div style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                color: 'var(--text-muted)', letterSpacing: '0.05em',
                borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span>{formatTaskDate(dateStr)}</span>
                {/* Show topic label in section header if all tasks share one */}
                {groupedTasks[dateStr].every(t => t.topic_label === groupedTasks[dateStr][0].topic_label) &&
                 groupedTasks[dateStr][0].topic_label && dateStr !== todayStr && (
                  <span style={S.topicBadge}>{groupedTasks[dateStr][0].topic_label}</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groupedTasks[dateStr].map((task) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ x: 4 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: task.completed
                        ? 'rgba(16,185,129,0.03)'
                        : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${task.completed ? 'rgba(16,185,129,0.12)' : 'var(--glass-border)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {/* Read-only Completion Status (Auto-ticked on task completion) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: task.completed ? '#10b981' : 'var(--text-muted)',
                          flexShrink: 0,
                          cursor: 'default'
                        }}
                        title={task.completed ? 'Completed automatically' : 'Automatically checks when you finish this task'}
                      >
                        {task.completed ? (
                          <CheckCircle size={18} />
                        ) : (
                          <Circle size={18} style={{ opacity: 0.6 }} />
                        )}
                      </div>

                      {/* Task info */}
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: task.completed ? 'var(--text-muted)' : 'var(--text-heading)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </span>
                          {/* Priority dot */}
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor(task.priority), flexShrink: 0 }} title={priorityLabel(task.priority)} />
                          {/* Per-task topic badge (today only — shown inline) */}
                          {task.topic_label && dateStr === todayStr && (
                            <span style={S.topicBadge}>{task.topic_label}</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 1 }}>
                          {task.description}
                        </span>
                      </div>
                    </div>

                    {/* Go button */}
                    {task.target_url && !task.completed && (() => {
                      const isChallengeTask = task.task_type === 'challenge'
                      const needsGeneration = isChallengeTask && (task.target_url === '/challenges' || task.target_url === '/challenges/')
                      const isGenerating = generatingId === task.id
                      return (
                        <button
                          onClick={() => isChallengeTask ? generateAndGo(task) : navigate(task.target_url)}
                          disabled={isGenerating}
                          title={needsGeneration ? 'Click to generate an AI challenge for this task' : 'Go to challenge'}
                          style={{
                            background: needsGeneration ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.08)',
                            border: `1px solid ${needsGeneration ? 'rgba(129,140,248,0.35)' : 'rgba(99,102,241,0.2)'}`,
                            padding: '5px 10px', borderRadius: 8,
                            color: '#818cf8', fontSize: 11, fontWeight: 700,
                            cursor: isGenerating ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center',
                            gap: 4, flexShrink: 0, marginLeft: 8,
                            opacity: isGenerating ? 0.7 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          {isGenerating
                            ? <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                            : needsGeneration
                              ? <>✨ Generate</>
                              : <>Go <ArrowRight size={10} /></>}
                        </button>
                      )
                    })()}
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
