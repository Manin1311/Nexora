import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X, Play, Search, FileText } from 'lucide-react'

// Comprehensive English transcript generator matching 1+ hour full course structure
function generateDefaultTranscript(title, skill) {
  const topic = skill || title || 'Software Engineering'
  const topicLower = topic.toLowerCase()

  if (topicLower.includes('react')) {
    return [
      { time: 0, timeStr: '00:00', text: 'Welcome to this complete React.js full course! Today we will build and deploy a production-grade Web Application from scratch.' },
      { time: 60, timeStr: '01:00', text: 'First, let’s explore why React is the leading UI library for building scalable, high-performance web interfaces.' },
      { time: 135, timeStr: '02:15', text: 'Setting up Node.js, NPM, and initializing your modern Vite + React project workspace.' },
      { time: 240, timeStr: '04:00', text: 'Understanding JSX syntax: writing HTML-like structure directly inside JavaScript functions.' },
      { time: 345, timeStr: '05:45', text: 'Creating your first React functional component and understanding component hierarchy.' },
      { time: 480, timeStr: '08:00', text: 'Embedding dynamic JavaScript expressions and styling components with CSS modules & Tailwind.' },
      { time: 630, timeStr: '10:30', text: 'Passing data down to child components using React Props and default prop values.' },
      { time: 780, timeStr: '13:00', text: 'Understanding Component Reusability: modularizing UI cards, buttons, and navigation bars.' },
      { time: 940, timeStr: '15:40', text: 'Introduction to React State: using the useState hook to handle interactive dynamic data.' },
      { time: 1110, timeStr: '18:30', text: 'Handling User Events: onClick, onChange, form submissions, and input state binding.' },
      { time: 1300, timeStr: '21:40', text: 'Rendering Collections & Lists: using array.map() and assigning unique key properties.' },
      { time: 1500, timeStr: '25:00', text: 'Conditional Rendering in React: logical AND (&&), ternary operators, and state toggles.' },
      { time: 1720, timeStr: '28:40', text: 'Managing Complex Component State: handling objects, arrays, and immutable state updates.' },
      { time: 1960, timeStr: '32:40', text: 'Side Effects with useEffect Hook: lifecycle management, dependency arrays, and cleanup.' },
      { time: 2220, timeStr: '37:00', text: 'Fetching External Data from REST APIs: using async/await with fetch and Axios.' },
      { time: 2500, timeStr: '41:40', text: 'Handling Loading States, API Skeleton Shimmers, and Error Handlers gracefully.' },
      { time: 2800, timeStr: '46:40', text: 'Global State Management: Introduction to React Context API and useContext hook.' },
      { time: 3120, timeStr: '52:00', text: 'Single Page App Routing: implementing client-side navigation with React Router DOM.' },
      { time: 3450, timeStr: '57:30', text: 'Performance Optimization: Memoization with useMemo, useCallback, and React.memo.' },
      { time: 3780, timeStr: '63:00', text: 'Building the Production Bundle (`npm run build`) and deploying live on Vercel / Netlify.' },
      { time: 4100, timeStr: '68:20', text: 'Final Wrap-Up: Summary of key React concepts mastered. Test your understanding in Nexora Code Arena!' }
    ]
  }

  if (topicLower.includes('python')) {
    return [
      { time: 0, timeStr: '00:00', text: `Welcome to this full Python programming masterclass! We will master Python from basics to production grade.` },
      { time: 90, timeStr: '01:30', text: 'Installing Python 3, setting up VS Code, virtual environments, and running your first print statement.' },
      { time: 240, timeStr: '04:00', text: 'Python Data Types & Variables: integers, floats, strings, booleans, and type casting.' },
      { time: 450, timeStr: '07:30', text: 'String Manipulation & Formatting: f-strings, slicing, methods, and string operations.' },
      { time: 690, timeStr: '11:30', text: 'Control Flow in Python: if, elif, else statements, comparison operators, and logical conditions.' },
      { time: 960, timeStr: '16:00', text: 'Python Collections: Lists, Tuples, Sets, and Dictionaries in depth.' },
      { time: 1260, timeStr: '21:00', text: 'Loops in Python: for loops, while loops, range(), enumerate(), and list comprehensions.' },
      { time: 1560, timeStr: '26:00', text: 'Functions & Scope: def statements, positional arguments, *args, **kwargs, and return values.' },
      { time: 1920, timeStr: '32:00', text: 'File I/O: Reading and writing text, JSON, and CSV files safely using context managers.' },
      { time: 2280, timeStr: '38:00', text: 'Object-Oriented Programming: Classes, Objects, __init__, Inheritance, and Encapsulation.' },
      { time: 2700, timeStr: '45:00', text: 'Exception Handling: try, except, else, finally, and custom exception classes.' },
      { time: 3120, timeStr: '52:00', text: 'Modules & Packages: Importing standard libraries, PIP package management, and PyPI.' },
      { time: 3600, timeStr: '60:00', text: 'Building a Full Python CLI & Web Scraping Project end-to-end.' },
      { time: 4000, timeStr: '66:40', text: 'Conclusion and Next Steps: Review your Python skills in Nexora Practice Sandbox!' }
    ]
  }

  // General 1+ hour engineering course default transcript
  return [
    { time: 0, timeStr: '00:00', text: `Welcome to this 1-hour masterclass on ${topic}. In this session, we cover end-to-end engineering concepts.` },
    { time: 120, timeStr: '02:00', text: `First, let’s understand the foundational architecture and industry demand for ${topic}.` },
    { time: 300, timeStr: '05:00', text: 'Setting up your development environment, CLI tooling, and workspace configuration.' },
    { time: 540, timeStr: '09:00', text: 'Core syntax, variables, memory allocation, and basic execution flows explained step-by-step.' },
    { time: 780, timeStr: '13:00', text: 'Control structures, conditional logic, loops, and function declarations in production code.' },
    { time: 1050, timeStr: '17:30', text: 'Data structures in depth: arrays, hash maps, queues, stacks, and key-value objects.' },
    { time: 1350, timeStr: '22:30', text: 'Object-Oriented Programming (OOP) and Modular Code Architecture.' },
    { time: 1680, timeStr: '28:00', text: 'Algorithmic time and space complexity: Big-O analysis of core operations.' },
    { time: 2040, timeStr: '34:00', text: 'Error handling, exception management, and defensive programming techniques.' },
    { time: 2400, timeStr: '40:00', text: 'Working with asynchronous operations, concurrency, Promises, and async/await.' },
    { time: 2760, timeStr: '46:00', text: 'Building a real-world project integrating all discussed engineering concepts.' },
    { time: 3120, timeStr: '52:00', text: 'Testing, debugging, profiling performance bottlenecks, and code refactoring.' },
    { time: 3500, timeStr: '58:20', text: 'Deployment, CI/CD pipelines, and industry best practices summary for technical interviews.' },
    { time: 3900, timeStr: '65:00', text: 'Course conclusion! Practice solving related interview challenges in Nexora Code Arena.' }
  ]
}

export default function YoutubePlayerModal({ isOpen, onClose, video }) {
  const [activeTime, setActiveTime] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const iframeRef = useRef(null)
  const activeItemRef = useRef(null)

  const videoId = video?.url ? (video.url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#/]+)/)?.[1] || '') : ''
  const transcript = video?.transcript || generateDefaultTranscript(video?.title, video?.skill)

  // ── Real-time YouTube Iframe postMessage player sync ──
  useEffect(() => {
    if (!isOpen) return

    setActiveTime(0)

    const handleMessage = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data && data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setActiveTime(Math.floor(data.info.currentTime))
          }
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleMessage)

    // Periodically poll YouTube iframe player position via postMessage (every 250ms)
    const pollInterval = setInterval(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1 }),
          '*'
        )
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'getCurrentTime' }),
          '*'
        )
      }
    }, 250)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(pollInterval)
    }
  }, [isOpen])

  // Find active transcript index based on activeTime
  let activeIdx = 0
  for (let i = 0; i < transcript.length; i++) {
    if (activeTime >= transcript[i].time) {
      activeIdx = i
    }
  }

  // Auto-scroll active transcript line into center of view
  useEffect(() => {
    if (activeItemRef.current && !searchTerm) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeIdx, searchTerm])

  if (!isOpen || !video) return null

  const handleSeek = (seconds) => {
    setActiveTime(seconds)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      )
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo' }),
        '*'
      )
    }
  }

  const filteredTranscript = transcript.filter(item =>
    item.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return createPortal(
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(5, 5, 12, 0.88)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          style={{
            width: '100%', maxWidth: 1080, height: '88vh', maxHeight: 820,
            background: 'var(--card-bg, #0f172a)', border: '1px solid var(--card-border, rgba(99,102,241,0.25))',
            borderRadius: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 20px', background: '#0f172a',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900,
                background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              }}>
                <Play size={12} fill="#ef4444" /> NEXORA RESOURCE PLAYER
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 500 }}>
                {video.title}
              </h3>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <X size={18} />
            </button>
          </div>


          {/* Modal Main Content (Split view: Video Player on Left, Transcript on Right) */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 0 }} className="resource-player-grid">
            
            {/* Left Side: Video Player */}
            <div style={{
              background: '#000', display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', position: 'relative'
            }}>
              {videoId ? (
                <iframe
                  ref={iframeRef}
                  id="youtube-player-iframe"
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0`}
                  title={video.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Video source unavailable</div>
              )}
            </div>

            {/* Right Side: Interactive English Transcript */}
            <div style={{
              background: 'var(--card-bg, #090d16)', borderLeft: '1px solid var(--card-border, rgba(255,255,255,0.08))',
              display: 'flex', flexDirection: 'column', minHeight: 0
            }}>
              {/* Transcript Header & Search */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.08))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: 'var(--text-heading, #fff)' }}>
                    <FileText size={16} style={{ color: '#818cf8' }} /> English Transcript
                  </div>
                  <span style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                    Auto-Synchronized
                  </span>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border, rgba(255,255,255,0.1))'
                }}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search in transcript..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: 'var(--text-heading, #fff)', fontSize: 12, width: '100%'
                    }}
                  />
                </div>
              </div>

              {/* Transcript Lines Scroll List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredTranscript.map((item, idx) => {
                  const isActive = idx === activeIdx && !searchTerm
                  return (
                    <motion.div
                      key={idx}
                      ref={isActive ? activeItemRef : null}
                      onClick={() => handleSeek(item.time)}
                      whileHover={{ x: 3, background: 'rgba(99,102,241,0.08)' }}
                      style={{
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: isActive ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.015)',
                        border: isActive ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
                        display: 'flex', gap: 12, alignItems: 'flex-start'
                      }}
                    >
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                        background: isActive ? '#6366f1' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : '#818cf8', fontFamily: 'monospace', flexShrink: 0
                      }}>
                        {item.timeStr}
                      </span>
                        <p style={{
                          fontSize: 12.5, lineHeight: 1.5, margin: 0,
                          color: isActive ? '#fff' : 'var(--text-muted, #cbd5e1)',
                          fontWeight: isActive ? 700 : 400
                        }}>
                          {item.text}
                        </p>
                    </motion.div>
                  )
                })}

                {filteredTranscript.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                    No matching transcript lines found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
