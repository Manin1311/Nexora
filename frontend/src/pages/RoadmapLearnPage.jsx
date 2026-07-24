import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  BookOpen, Mic, Award, CheckCircle, XCircle, ArrowLeft, ArrowRight,
  BookMarked, HelpCircle, Loader2, Sparkles, Check, Play, RefreshCw, AlertCircle
} from 'lucide-react'
import roadmapService from '@/services/roadmapService'

// Custom Markdown parser that converts basic MD formatting to JSX cleanly
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  let inList = false
  const listItems = []
  const elements = []

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ paddingLeft: 20, marginBottom: 16, color: 'var(--text-color)', lineHeight: 1.6 }}>
          {listItems.map((item, idx) => (
            <li key={`li-${key}-${idx}`} style={{ marginBottom: 6 }}>{item}</li>
          ))}
        </ul>
      )
      listItems.length = 0
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Code Blocks
    if (line.startsWith('```')) {
      flushList(i)
      const lang = line.slice(3)
      let code = ''
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code += lines[i] + '\n'
        i++
      }
      elements.push(
        <pre key={`code-${i}`} style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
          padding: 16,
          overflowX: 'auto',
          fontSize: 13,
          fontFamily: 'monospace',
          color: 'var(--text-color)',
          marginBottom: 20,
          transition: 'all 0.4s ease',
        }}>
          <code>{code}</code>
        </pre>
      )
      continue
    }

    // Headings
    if (line.startsWith('###')) {
      flushList(i)
      elements.push(
        <h4 key={`h3-${i}`} style={{ fontSize: 16, fontWeight: 700, color: '#818cf8', marginTop: 24, marginBottom: 12 }}>
          {line.slice(3).trim()}
        </h4>
      )
      continue
    }
    if (line.startsWith('##')) {
      flushList(i)
      elements.push(
        <h3 key={`h2-${i}`} style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6', marginTop: 28, marginBottom: 14 }}>
          {line.slice(2).trim()}
        </h3>
      )
      continue
    }
    if (line.startsWith('#')) {
      flushList(i)
      elements.push(
        <h2 key={`h1-${i}`} style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', marginTop: 32, marginBottom: 16 }}>
          {line.slice(1).trim()}
        </h2>
      )
      continue
    }

    // Lists
    if (line.startsWith('-') || line.startsWith('*')) {
      listItems.push(line.slice(1).trim())
      continue
    }

    // Paragraphs
    if (line !== '') {
      flushList(i)
      // inline formatting: **bold**
      let formattedText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>')
      formattedText = formattedText.replace(/`(.*?)`/g, '<code style="background:var(--scrollbar-track);padding:2px 6px;border-radius:4px;color:#818cf8;font-family:monospace;font-size:12px">$1</code>')

      elements.push(
        <p key={`p-${i}`}
          style={{ color: 'var(--text-color)', fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      )
    }
  }

  flushList(lines.length)
  return <div style={{ paddingBottom: 20 }}>{elements}</div>
}

export default function RoadmapLearnPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [taskData, setTaskData] = useState(null)
  const [activeTab, setActiveTab] = useState('learn') // 'learn' | 'quiz'
  const [currentChapter, setCurrentChapter] = useState(0)

  // Quiz state
  const [answers, setAnswers] = useState({}) // { questionIndex: optionIndex }
  const [graded, setGraded] = useState(false)
  const [score, setScore] = useState(0)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)

  // Certificate Modal State
  const [showCertModal, setShowCertModal] = useState(false)
  const [earnedCert, setEarnedCert] = useState(null)

  useEffect(() => {
    loadContent()
  }, [taskId])

  const loadContent = async () => {
    setLoading(true)
    try {
      const data = await roadmapService.getTaskContent(taskId)
      setTaskData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleNextChapter = () => {
    if (currentChapter < (taskData?.chapters?.length || 1) - 1) {
      setCurrentChapter(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setActiveTab('quiz')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSelectOption = (qIdx, oIdx) => {
    if (graded) return
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }))
  }

  const handleSubmitQuiz = async () => {
    if (graded) return
    let quizScore = 0
    taskData.quiz.forEach((q, idx) => {
      if (answers[idx] === q.correct_index) {
        quizScore++
      }
    })
    setScore(quizScore)
    setGraded(true)

    // Check if passed (Score >= 4 out of 5)
    if (quizScore >= 4) {
      setSubmittingQuiz(true)
      try {
        const response = await roadmapService.completeTask(taskId)
        if (response.certificate_earned) {
          setEarnedCert(response.certificate_earned)
          setShowCertModal(true)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setSubmittingQuiz(false)
      }
    }
  }

  const handleRetryQuiz = () => {
    setAnswers({})
    setGraded(false)
    setScore(0)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={40} color="#6366f1" />
        </motion.div>
      </div>
    )
  }

  const chapters = taskData?.chapters || []
  const quiz = taskData?.quiz || []
  const hasPassed = score >= 4

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingTop: 80, paddingBottom: 80, transition: 'background-color 0.4s ease' }}>
      {/* Ambient backgrounds */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '15%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(45px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', filter: 'blur(45px)' }} />
      </div>

      <div className="container" style={{ maxWidth: 840, position: 'relative', zIndex: 1 }}>

        {/* ── Navbar Back link ── */}
        <button onClick={() => navigate('/roadmap')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24, padding: 0 }}>
          <ArrowLeft size={16} /> Back to Roadmap
        </button>

        {/* ── Title block ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 12 }}>
            <Sparkles size={12} color="#818cf8" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Learning Chapter</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>{taskData?.title}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 15 }}>Master the concepts and test your knowledge to earn competency achievements.</p>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', marginBottom: 28, transition: 'all 0.4s ease' }}>
          <button onClick={() => setActiveTab('learn')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, border: 'none',
              background: activeTab === 'learn' ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeTab === 'learn' ? '#818cf8' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}>
            <BookOpen size={16} /> Learn Course
          </button>
          <button onClick={() => setActiveTab('quiz')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, border: 'none',
              background: activeTab === 'quiz' ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeTab === 'quiz' ? '#818cf8' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}>
            <HelpCircle size={16} /> Knowledge Quiz
          </button>
        </div>

        {/* ── Course Study View ── */}
        {activeTab === 'learn' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 36, backdropFilter: 'blur(20px)', transition: 'all 0.4s ease' }}>

            {/* Chapter Progress Header */}
            <div style={{ display: 'flex', justifySpace: 'between', alignItems: 'center', marginBottom: 28, justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>
                CHAPTER {currentChapter + 1} OF {chapters.length}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>
                {chapters[currentChapter]?.title}
              </span>
            </div>

            {/* Chapter Content */}
            <div style={{ minHeight: 280 }}>
              {renderMarkdown(chapters[currentChapter]?.content)}
            </div>

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, borderTop: '1px solid var(--card-border)', paddingTop: 24 }}>
              <button onClick={handlePrevChapter} disabled={currentChapter === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: currentChapter === 0 ? 'var(--text-muted)' : 'var(--text-color)', cursor: currentChapter === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.4s ease'
                }}>
                  <ArrowLeft size={14} /> Previous
              </button>
              <button onClick={handleNextChapter}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(99,102,241,0.25)'
                }}>
                {currentChapter === chapters.length - 1 ? 'Go to Quiz' : 'Next Chapter'} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Quiz Graded View ── */}
        {activeTab === 'quiz' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Graded Header summary banner */}
            {graded && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{
                  padding: 24, borderRadius: 20, textAlign: 'center',
                  background: hasPassed ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${hasPassed ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`
                }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: hasPassed ? '#34d399' : '#f87171', marginBottom: 6 }}>
                  {hasPassed ? '🎉 Quiz Completed!' : '❌ Let\'s Try Again!'}
                </h2>
                <p style={{ color: 'var(--text-color)', fontSize: 14, margin: '0 0 16px 0' }}>
                  You scored **{score}/5** correct responses. {hasPassed ? 'You passed the module successfully!' : 'You need at least 4/5 correct options to complete the course.'}
                </p>
                <div style={{ display: 'flex', justifyCenter: 'center', gap: 12, justifyContent: 'center' }}>
                  {hasPassed ? (
                    <>
                      {earnedCert && (
                        <button onClick={() => setShowCertModal(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#34d399)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          <Award size={14} /> View Certificate
                        </button>
                      )}
                      <button onClick={() => navigate('/roadmap')}
                        style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.4s ease' }}>
                        Return to Roadmap
                      </button>
                    </>
                  ) : (
                    <button onClick={handleRetryQuiz}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <RefreshCw size={13} /> Retry Quiz
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Questions List */}
            {quiz.map((q, qIdx) => {
              const selectedOpt = answers[qIdx]
              const isCorrect     = selectedOpt === q.correct_index

              return (
                <div key={qIdx} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 24, transition: 'all 0.4s ease' }}>
                  <div style={{ display: 'flex', justifySpace: 'between', marginBottom: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Question {qIdx + 1} · <span style={{ color: q.difficulty === 'advanced' ? '#f59e0b' : q.difficulty === 'intermediate' ? '#a78bfa' : '#60a5fa' }}>{q.difficulty}</span>
                    </span>
                    {graded && (
                      isCorrect
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#34d399', fontSize: 12, fontWeight: 700 }}><CheckCircle size={14} /> Correct</span>
                        : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f87171', fontSize: 12, fontWeight: 700 }}><XCircle size={14} /> Incorrect</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 16, lineHeight: 1.5 }}>{q.question}</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: graded ? 16 : 0 }}>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedOpt === oIdx
                      const isOptionCorrect = oIdx === q.correct_index

                      let bg = 'var(--glass-bg)'
                      let border = '1px solid var(--glass-border)'
                      let color = 'var(--text-color)'

                      if (graded) {
                        if (isOptionCorrect) {
                          bg = 'rgba(52,211,153,0.1)'
                          border = '1px solid rgba(52,211,153,0.3)'
                          color = '#34d399'
                        } else if (isSelected) {
                          bg = 'rgba(239,68,68,0.1)'
                          border = '1px solid rgba(239,68,68,0.3)'
                          color = '#f87171'
                        }
                      } else if (isSelected) {
                        bg = 'rgba(99,102,241,0.15)'
                        border = '1px solid rgba(99,102,241,0.4)'
                        color = '#818cf8'
                      }

                      return (
                        <button key={oIdx} onClick={() => handleSelectOption(qIdx, oIdx)} disabled={graded}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: 10, background: bg, border: border, color: color, fontSize: 14, textAlign: 'left', cursor: graded ? 'default' : 'pointer', fontWeight: isSelected || (graded && isOptionCorrect) ? 600 : 400, transition: 'all 0.15s'
                          }}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>

                  {graded && !isCorrect && q.explanation && (
                    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', gap: 8, marginTop: 12 }}>
                      <AlertCircle size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Submit Bar */}
            {!graded && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(answers).length < quiz.length || submittingQuiz}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: (Object.keys(answers).length < quiz.length || submittingQuiz) ? 'not-allowed' : 'pointer', opacity: (Object.keys(answers).length < quiz.length || submittingQuiz) ? 0.6 : 1, boxShadow: '0 4px 20px rgba(99,102,241,0.3)'
                  }}>
                  {submittingQuiz ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Submit Quiz Answers
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* ── Certificate Celebration Modal ── */}
      {createPortal(
        <AnimatePresence>
          {showCertModal && earnedCert && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
              onClick={e => { if (e.target === e.currentTarget) setShowCertModal(false) }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 640, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', transition: 'all 0.4s ease' }}>
              
              <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #34d399, #8b5cf6)' }} />
  
                <div style={{ padding: 36, textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '2px solid #34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Award size={40} color="#34d399" />
                  </div>
  
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-heading)', marginBottom: 8 }}>Competency Certificate Earned!</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                    Congratulations, you've completed this week's focus curriculum and passed the graded quiz.
                  </p>
  
                  {/* Certificate Mock Frame */}
                  <div style={{
                    padding: '32px 24px', borderRadius: 16, background: 'var(--bg-color)', border: '2px solid var(--card-border)', position: 'relative', overflow: 'hidden', marginBottom: 28, textLeft: 'center'
                  }}>
                    {/* Watermark/borders */}
                    <div style={{ position: 'absolute', inset: 8, border: '1px solid var(--card-border)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -30, right: -30, opacity: 0.05, transform: 'rotate(-25deg)', pointerEvents: 'none' }}>
                      <Award size={180} color="#34d399" />
                    </div>
  
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>NEXORA ACADEMY</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>
                      {earnedCert.title}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 auto 16px', maxWidth: 440, lineHeight: 1.6 }}>
                      {earnedCert.description}
                    </p>
  
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, padding: '0 12px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CERTIFICATE ID</div>
                        <div style={{ fontSize: 10, color: 'var(--text-color)', fontFamily: 'monospace', fontWeight: 600 }}>{earnedCert.certificate_id}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATE ISSUED</div>
                        <div style={{ fontSize: 10, color: 'var(--text-color)', fontWeight: 600 }}>{new Date(earnedCert.issued_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => navigate('/progress')}
                      style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#34d399)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                      Go to Certificates Hub
                    </button>
                    <button onClick={() => setShowCertModal(false)}
                      style={{ padding: '14px 20px', borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.4s ease' }}>
                      Close
                    </button>
                  </div>
  
                </div>
  
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  )
}
