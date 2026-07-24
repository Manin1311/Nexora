import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, CheckCircle, Award } from 'lucide-react'
import { challengeService } from '@/services/challengeService'
import { useTheme } from '@/context/ThemeContext'

export default function ContributionGrid() {
  const { theme } = useTheme()
  const [activity, setActivity] = useState({})
  const [loading, setLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState(null)

  useEffect(() => {
    challengeService.getActivity()
      .then(data => setActivity(data || {}))
      .catch(err => console.error('Failed to load activity grid:', err))
      .finally(() => setLoading(false))
  }, [])

  // 1. Generate dates for the past 24 weeks (Sunday to Saturday layout)
  const weeksToShow = 24
  const daysInGrid = weeksToShow * 7
  
  const today = new Date()
  // Adjust to the end of the current week (Saturday) to keep grid aligned
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + (6 - today.getDay()))

  const dates = []
  for (let i = daysInGrid - 1; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(endDate.getDate() - i)
    dates.push(d)
  }

  // Group dates into 24 columns (weeks), each containing 7 days
  const gridWeeks = []
  for (let i = 0; i < weeksToShow; i++) {
    gridWeeks.push(dates.slice(i * 7, (i + 1) * 7))
  }

  // 2. Statistics calculation
  const totalSubmissions = Object.values(activity).reduce((a, b) => a + b, 0)
  const maxSolves = Object.values(activity).reduce((a, b) => Math.max(a, b), 0)

  // Calculate current streak
  let currentStreak = 0
  let checkDate = new Date()
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (activity[dateStr] && activity[dateStr] > 0) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      // Allow today to be 0 if yesterday was active
      if (currentStreak === 0 && checkDate.toDateString() === today.toDateString()) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      }
      break
    }
  }

  const formatDateStr = (date) => {
    return date.toISOString().split('T')[0]
  }

  const getIntensityColor = (count) => {
    if (!count || count === 0) {
      return theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.08)'
    }
    if (count <= 2) return 'rgba(99, 102, 241, 0.25)' // Light Indigo
    if (count <= 4) return 'rgba(99, 102, 241, 0.6)'  // Medium Indigo
    return '#6366f1' // Intense brand Indigo
  }

  if (loading) {
    return (
      <div style={{ padding: 20, borderRadius: 16, background: 'var(--card-bg)', border: '1px solid var(--card-border)', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '20px 24px', 
      borderRadius: 18, 
      background: 'var(--card-bg)', 
      border: '1px solid var(--card-border)',
      boxShadow: 'var(--glass-shadow)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      transition: 'background-color 0.4s ease, border-color 0.4s ease'
    }}>
      {/* Background radial accent glow */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(99, 102, 241, 0.08)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Header and stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.01em' }}>Activity consistency</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>Your challenge solving logs over the last 24 weeks</p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={14} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.1 }}>{currentStreak} days</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Streak</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={14} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.1 }}>{totalSubmissions} solves</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Solved</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={14} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.1 }}>{maxSolves} max</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Max In A Day</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid container with custom styling for scrollbar */}
      <div style={{ overflowX: 'auto', width: '100%', paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
          {/* Day of Week Labels (Sun, Mon, Tue, Wed, Thu, Fri, Sat) */}
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gap: 3, marginRight: 6, fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, justifyItems: 'end', alignContent: 'center', opacity: 0.6 }}>
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid columns */}
          {gridWeeks.map((week, wIdx) => (
            <div key={wIdx} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gap: 3 }}>
              {week.map((date, dIdx) => {
                const dateStr = formatDateStr(date)
                const count = activity[dateStr] || 0
                const isToday = date.toDateString() === today.toDateString()
                
                return (
                  <div
                    key={dIdx}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredCell({
                        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        count,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 38
                      })
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2.5,
                      background: getIntensityColor(count),
                      border: isToday ? '1px solid #818cf8' : 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, background-color 0.2s',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend display */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>
        <span>Less</span>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.08)' }} />
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(99, 102, 241, 0.25)' }} />
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(99, 102, 241, 0.6)' }} />
        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} />
        <span>More</span>
      </div>

      {/* Custom Tooltip */}
      {hoveredCell && (
        <div style={{
          position: 'fixed',
          left: hoveredCell.x,
          top: hoveredCell.y,
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 10,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}>
          {hoveredCell.count === 0 ? 'No solves' : `${hoveredCell.count} challenge${hoveredCell.count !== 1 ? 's' : ''} solved`} on {hoveredCell.date}
        </div>
      )}
    </div>
  )
}
