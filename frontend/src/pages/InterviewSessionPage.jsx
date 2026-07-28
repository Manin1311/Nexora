import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Zap,
  Send,
  RotateCcw,
  Trophy,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Keyboard,
  Sparkles,
  Activity,
  Smile,
  Info
} from 'lucide-react'
import { interviewService } from '@/services/interviewService'
import { useAuth } from '@/context/AuthContext'
import PageWrapper from '@/components/layout/PageWrapper'
import AnimatedCounter from '@/components/ui/AnimatedCounter'

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

const scoreColor = s => s >= 8 ? '#34d399' : s >= 5 ? '#fbbf24' : '#fb7185'

// Reusable SVG circular gauge for eye-contact and posture scores
const GaugeCircle = ({ value, label, color }) => {
  const radius = 45
  const stroke = 8
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            stroke="var(--glass-border)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--text-heading)',
        }}>
          {value}%
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  )
}

export default function InterviewSessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  // Base state
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)

  // Live Coaching states
  const [onboarded, setOnboarded] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [speechMode, setSpeechMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  // Real-time analysis metrics
  const [fillerWords, setFillerWords] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)

  // Boardroom custom states
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const [speakingSpeaker, setSpeakingSpeaker] = useState('Tech Lead')
  const [speakingId, setSpeakingId] = useState(null)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [cameraMuted, setCameraMuted] = useState(false)
  const [micMuted, setMicMuted] = useState(false)

  // Refs for audio, speech, video, and screen
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const textareaRef = useRef(null)
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const drawAnimRef = useRef(null)
  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)
  const answerRef = useRef('')
  const committedTextRef = useRef('') // tracks finalized speech (to avoid interim duplicates)
  const screenStreamRef = useRef(null)
  const screenVideoRef = useRef(null)

  // Handle active question variables
  const currentQuestion = session?.questions[currentIdx]
  const answered = currentQuestion?.user_answer
  const totalAnswered = session?.questions.filter(q => q.user_answer).length || 0
  const allAnswered = totalAnswered === (session?.total_questions || 0)
  const progress = (totalAnswered / (session?.total_questions || 1)) * 100

  // Sync answerRef with latest answer state to avoid interval closure capture bugs
  useEffect(() => {
    answerRef.current = answer
  }, [answer])

  // Check speech synthesis & recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
    }
  }, [])

  // Load Session details
  useEffect(() => {
    interviewService.getSession(sessionId)
      .then(r => {
        setSession(r.data)
        const firstUnanswered = r.data.questions.findIndex(q => !q.user_answer)
        setCurrentIdx(firstUnanswered >= 0 ? firstUnanswered : 0)
      })
      .catch(() => navigate('/interview'))
      .finally(() => setLoading(false))
  }, [sessionId])

  // Monitor live speech typing/speaking to compute filler words and WPM
  useEffect(() => {
    if (answer.trim()) {
      // Calculate filler word occurrences
      const fillers = ['um', 'like', 'uh', 'uhh', 'ah', 'basically', 'actually', 'so', 'hmm', 'mmm', 'err', 'yup', 'yeah']
      const words = answer.toLowerCase().split(/\s+/)
      let fillerCount = 0
      words.forEach(w => {
        const cleanW = w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        if (fillers.includes(cleanW)) {
          fillerCount++
        }
      })
      setFillerWords(fillerCount)

      // Calculate words-per-minute
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }
      const elapsedMin = (Date.now() - startTimeRef.current) / 60000
      if (elapsedMin > 0.02) {
        setWpm(Math.round(words.length / elapsedMin))
      } else {
        setWpm(Math.round(words.length / 0.02))
      }
    } else {
      setFillerWords(0)
      setWpm(0)
    }
  }, [answer])

  // Countdown timer for Rapid Fire mode
  useEffect(() => {
    if (session?.mode !== 'rapid_fire' || answered || submitting || completing) {
      setTimeLeft(null)
      return
    }

    setTimeLeft(45)

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitAnswer(answerRef.current || 'No response provided (Time limit exceeded).')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIdx, answered, session?.mode, submitting, completing])

  // Stop media & recognition on unmount
  useEffect(() => {
    return () => {
      cleanupMedia()
      cleanupSpeech()
    }
  }, [])

  const cleanupMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }
    setScreenStream(null)
    setIsScreenSharing(false)
    if (drawAnimRef.current) {
      cancelAnimationFrame(drawAnimRef.current)
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setCameraActive(false)
  }

  const cleanupSpeech = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }

  const cleanTextForSpeech = (text) => {
    if (!text) return ''
    let clean = text.replace(/\*\*|__|\*|_/g, '')
    clean = clean.replace(/#+\s+/g, '')
    clean = clean.replace(/```[\s\S]*?```/g, '')
    clean = clean.replace(/`([^`]+)`/g, '$1')
    clean = clean.replace(/^\s*[\-\*\+]\s+/gm, '')
    return clean
  }

  const speakInterviewerText = (text, speaker) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    setTimeout(() => {
      const cleaned = cleanTextForSpeech(text)
      const utterance = new SpeechSynthesisUtterance(cleaned)
      
      utterance.onstart = () => setSpeakingId(speaker)
      utterance.onend = () => setSpeakingId(null)
      utterance.onerror = () => setSpeakingId(null)

      const voices = window.speechSynthesis.getVoices()
      
      if (speaker === 'Tech Lead') {
        const maleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google US English')))
        if (maleVoice) utterance.voice = maleVoice
        utterance.rate = 1.05
        utterance.pitch = 0.85
      } else if (speaker === 'System Architect') {
        const femaleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google UK English Female') || v.name.includes('Google UK English')))
        if (femaleVoice) utterance.voice = femaleVoice
        utterance.rate = 0.95
        utterance.pitch = 1.1
      } else {
        const neutralVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Mark') || v.name.includes('Microsoft') || v.name.includes('Natural')))
        if (neutralVoice) utterance.voice = neutralVoice
        utterance.rate = 0.9
        utterance.pitch = 1.0
      }

      window.speechSynthesis.speak(utterance)
    }, 50)
  }

  const parseDebateTranscript = (feedback) => {
    if (!feedback) return []
    try {
      const parsed = JSON.parse(feedback)
      const transcript = parsed.debate_transcript || ''
      return transcript.split('\n').filter(line => line.trim()).map(line => {
        const idxOfColon = line.indexOf(':')
        const speaker = idxOfColon >= 0 ? line.substring(0, idxOfColon).trim() : 'Panelist'
        const text = idxOfColon >= 0 ? line.substring(idxOfColon + 1).trim() : line.trim()
        return { speaker, text }
      })
    } catch (e) {
      return [{ speaker: 'Panelist', text: feedback }]
    }
  }

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })
      screenStreamRef.current = stream
      setScreenStream(stream)
      setIsScreenSharing(true)

      setTimeout(() => {
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream
        }
      }, 200)

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }
    } catch (e) {
      console.warn("Screen share failed or cancelled:", e)
    }
  }

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }
    setScreenStream(null)
    setIsScreenSharing(false)
  }

  // Trigger speech synthesis when moving to next question in boardroom mode
  useEffect(() => {
    if (session?.mode === 'boardroom' && currentQuestion && !currentQuestion.user_answer) {
      let speaker = 'Tech Lead'
      if (currentIdx > 0) {
        const prevQ = session.questions[currentIdx - 1]
        if (prevQ?.behavioral_feedback) {
          try {
            const parsed = JSON.parse(prevQ.behavioral_feedback)
            speaker = parsed.next_speaker || 'Tech Lead'
          } catch (e) {}
        }
      }
      setSpeakingSpeaker(speaker)
      speakInterviewerText(currentQuestion.question_text, speaker)
    }
  }, [currentIdx, session?.id])




  // Start Camera Stream
  const startCamera = async () => {
    cleanupMedia()
    try {
      // Try to get both video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: { ideal: 15 } },
        audio: true
      })
      streamRef.current = stream
      setCameraActive(true)

      // Attach stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 200)

      // Initialize Audio Visualizer
      startAudioVisualizer(stream)
    } catch (err) {
      console.warn('Full camera + audio access failed, trying audio-only fallback:', err)
      try {
        // Fallback: Try to get audio-only (in case webcam is missing, disabled, or occupied by Zoom/OBS/etc)
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        })
        streamRef.current = audioStream
        setCameraActive(false) // No camera, but mic works!
        startAudioVisualizer(audioStream)
      } catch (audioErr) {
        console.warn('Audio-only fallback also failed:', audioErr)
        alert('Could not access camera or microphone. Continuing in text-only mode.')
        setCameraActive(false)
      }
    }
  }

  // Audio Spectrum Visualizer
  const startAudioVisualizer = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      
      const audioCtx = new AudioCtx()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      audioCtxRef.current = audioCtx
      analyserRef.current = analyser

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const draw = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height

        drawAnimRef.current = requestAnimationFrame(draw)
        analyser.getByteFrequencyData(dataArray)

        ctx.clearRect(0, 0, width, height)

        const barWidth = (width / bufferLength) * 1.5
        let barHeight
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height * 0.9

          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight)
          grad.addColorStop(0, '#6366f1')
          grad.addColorStop(0.5, '#8b5cf6')
          grad.addColorStop(1, '#06b6d4')

          ctx.fillStyle = grad
          ctx.fillRect(x, height - barHeight, barWidth, barHeight)

          x += barWidth + 3
        }
      }

      draw()
    } catch (e) {
      console.error('Audio visualizer failed to load:', e)
    }
  }

  // Speech Recognition Start/Stop
  const toggleListening = () => {
    if (!speechSupported) return

    if (isListening) {
      cleanupSpeech()
    } else {
      cleanupSpeech()
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }

      rec.onstart = () => setIsListening(true)
      rec.onresult = (event) => {
        let newFinalText = ''
        let interimText = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinalText += event.results[i][0].transcript
          } else {
            interimText += event.results[i][0].transcript
          }
        }
        if (newFinalText) {
          // Commit finalized text once
          committedTextRef.current = (
            committedTextRef.current
              ? committedTextRef.current + ' ' + newFinalText.trim()
              : newFinalText.trim()
          )
          setAnswer(committedTextRef.current)
        } else if (interimText) {
          // Show interim preview on top of already-committed text (no duplication)
          const preview = committedTextRef.current
            ? committedTextRef.current + ' ' + interimText
            : interimText
          setAnswer(preview)
        }
      }
      rec.onerror = (err) => {
        console.error('Speech recognition error code:', err.error, err)
        setIsListening(false)
        if (err.error === 'network') {
          console.warn('Network-based Speech Recognition error. Switching to keyboard mode.')
          setSpeechMode(false)
        }
      }
      rec.onend = () => setIsListening(false)

      try {
        rec.start()
        recognitionRef.current = rec
      } catch (err) {
        console.error('Speech recognition start failed:', err)
        setIsListening(false)
        setSpeechMode(false)
      }
    }
  }

  // Capture low-res webcam snapshot frame on submission
  const captureSnapshot = () => {
    if (!videoRef.current || !cameraActive) return null
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      const ctx = canvas.getContext('2d')
      // Draw reversed/mirror snapshot to align with visual view
      ctx.translate(320, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(videoRef.current, 0, 0, 320, 240)
      return canvas.toDataURL('image/jpeg', 0.6)
    } catch (e) {
      console.warn('Snapshot capture failed:', e)
      return null
    }
  }

  const handleSubmitAnswer = async (forcedAnswer = null) => {
    const isForced = typeof forcedAnswer === 'string'
    const finalAnswerText = (isForced ? forcedAnswer : answer).trim()
    if (!finalAnswerText && !isForced || !currentQuestion) return
    setSubmitting(true)
    cleanupSpeech()

    const imageFrame = captureSnapshot()

    try {
      const payload = {
        answer: finalAnswerText || 'No response provided (Time limit exceeded).',
        image_frame: imageFrame,
        filler_words_count: fillerWords,
        speaking_pace: wpm
      }

      const { data } = await interviewService.submitAnswer(session.id, currentQuestion.id, payload)
      
      setSession(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === currentQuestion.id ? data : q)
      }))
      setFeedbackVisible(true)

      if (session.mode === 'boardroom' && data.behavioral_feedback) {
        try {
          const parsed = JSON.parse(data.behavioral_feedback)
          const nextSpeakerName = parsed.next_speaker || 'Tech Lead'
          const transitionText = parsed.next_question_intro || 'Let us move to the next question.'
          setSpeakingSpeaker(nextSpeakerName)
          speakInterviewerText(transitionText, nextSpeakerName)
        } catch (e) {
          speakInterviewerText(data.ai_feedback || 'Thank you for your answer.', 'Tech Lead')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    setFeedbackVisible(false)
    setAnswer('')
    committedTextRef.current = '' // reset committed speech for new question
    setFillerWords(0)
    setWpm(0)
    startTimeRef.current = null
    cleanupSpeech()

    if (currentIdx < (session?.questions.length || 0) - 1) {
      setCurrentIdx(currentIdx + 1)
      if (speechMode) {
        // Automatically restart speech listen after transitions
        setTimeout(() => {
          toggleListening()
        }, 300)
      }
    }
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleComplete = async () => {
    setCompleting(true)
    cleanupMedia()
    cleanupSpeech()
    try {
      const { data } = await interviewService.completeSession(session.id)
      setSession(data)
      refreshUser()
    } catch (err) {
      console.error(err)
      alert('Failed to complete session.')
    } finally {
      setCompleting(false)
    }
  }

  const handleStartOnboarding = async (enableCoach) => {
    setOnboarded(true)
    if (enableCoach) {
      setSpeechMode(true)
      await startCamera()
      if (speechSupported) {
        setTimeout(() => {
          toggleListening()
        }, 500)
      }
    } else {
      setSpeechMode(false)
    }
  }

  if (loading) return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '128px 0' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </PageWrapper>
  )

  if (!session) return null

  /* ─────────────────────────────────────────────────────────────────────────
     Completed View (AI Posture/Eye-contact/Pacing Analytics Dashboard)
     ───────────────────────────────────────────────────────────────────────── */
  if (session.status === 'completed') {
    const score = session.score || 0
    const sColor = scoreColor(score)
    const scoreLabel = score >= 8 ? 'Excellent!' : score >= 6 ? 'Good Job!' : 'Keep Practicing!'

    // Calculations of average indicators
    const validQuestions = session.questions || []
    const totalWordsCount = validQuestions.reduce((sum, q) => sum + (q.filler_words_count || 0), 0)
    const avgEyeContact = validQuestions.length ? Math.round(validQuestions.reduce((sum, q) => sum + (q.eye_contact_score ?? 100), 0) / validQuestions.length) : 100
    const avgPosture = validQuestions.length ? Math.round(validQuestions.reduce((sum, q) => sum + (q.posture_score ?? 100), 0) / validQuestions.length) : 100
    
    const paceQuestions = validQuestions.filter(q => (q.speaking_pace || 0) > 0)
    const avgPaceWpm = paceQuestions.length ? Math.round(paceQuestions.reduce((sum, q) => sum + q.speaking_pace, 0) / paceQuestions.length) : 0

    // Pace description
    const getPaceStatus = (wpm) => {
      if (wpm === 0) return { label: 'N/A', color: 'var(--text-muted)', desc: 'No speech pacing recorded.' }
      if (wpm < 110) return { label: 'Slow Pace', color: '#60a5fa', desc: 'Speaking slowly allows clarity, but aim to sound slightly more dynamic.' }
      if (wpm <= 150) return { label: 'Ideal Pace', color: '#34d399', desc: 'Perfect interview rhythm (110 - 150 WPM). Keeps recruiters highly engaged.' }
      return { label: 'Fast Pace', color: '#fb7185', desc: 'Pacing is slightly rushed. Remember to pause and breathe to let complex technical details land.' }
    }
    const paceDetails = getPaceStatus(avgPaceWpm)

    // Gather AI coaching suggestions
    const visualSuggestions = validQuestions
      .map(q => q.behavioral_feedback)
      .filter(f => f && f.trim() !== '' && !f.includes('No visual feedback'))

    return (
      <PageWrapper noPadding>
        <div className="container" style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 840 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>{score >= 8 ? '🏆' : score >= 6 ? '🎯' : '💪'}</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-heading)', marginBottom: 8, letterSpacing: '-0.02em' }}>Session Results</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>{scoreLabel}</p>
          </motion.div>

          {/* Performance Dashboard GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 32 }}>
            
            {/* Primary Scores Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Main Score & XP Card */}
              <div style={{ ...S.card, padding: 24, background: 'var(--card-bg)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: sColor, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                      <AnimatedCounter value={score * 10} /><span style={{ fontSize: 18 }}>/100</span>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Overall Score</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#818cf8', marginBottom: 4 }}>
                      +<AnimatedCounter value={session.xp_earned || 0} />
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>XP Earned</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-heading)', marginBottom: 4 }}>{session.total_questions}</div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Questions</p>
                  </div>
                </div>
              </div>

              {/* Speech Metrics Analyzer Card */}
              <div style={{ ...S.card, padding: 24, background: 'var(--card-bg)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} color="#8b5cf6" /> Live Voice Coaching Report
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ padding: 14, borderRadius: 12, background: 'rgba(99,102,241,0.05)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Speaking Rhythm</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: paceDetails.color }}>{avgPaceWpm || 'N/A'} <span style={{ fontSize: 12, fontWeight: 500 }}>WPM</span></div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: paceDetails.color, marginTop: 4 }}>{paceDetails.label}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 12, background: 'rgba(251,191,36,0.05)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Filler Words Used</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: totalWordsCount > 8 ? '#fb7185' : totalWordsCount > 3 ? '#fbbf24' : '#34d399' }}>{totalWordsCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>um, uh, like, so, basically, hmm, mmm, yeah</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {paceDetails.desc} {totalWordsCount > 4 ? 'Try practicing structural pauses instead of using vocalized fillers.' : 'Your verbal presentation was clean and concise!'}
                </p>
              </div>
            </div>

            {/* Behavioral visual indicators (Eye Contact & Posture) */}
            <div style={{ ...S.card, padding: 24, background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smile size={16} color="#06b6d4" /> Visual Behavioral Coaching
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: 16, marginBottom: 20 }}>
                <GaugeCircle value={avgEyeContact} label="Eye Contact" color="#34d399" />
                <GaugeCircle value={avgPosture} label="Posture" color="#06b6d4" />
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Info size={14} color="#a78bfa" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    Visual tracking rates posture alignment and focus centering. Perfect posture helps project confidence during video evaluations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Coaching Suggestions (Unified AI behavioral logs) */}
          {visualSuggestions.length > 0 && (
            <div style={{ ...S.card, padding: 24, marginBottom: 24, background: 'var(--card-bg)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#a78bfa" /> Live Coach Suggestions
              </h3>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visualSuggestions.map((suggestion, idx) => (
                  <li key={idx} style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Per-question breakdown */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 16 }}>Question-by-Question Scorecard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
            {session.questions.map((q, i) => {
              const qs = q.score || 0
              const qc = scoreColor(qs)
              return (
                <div key={i} style={{ ...S.card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: qc, background: `${qc}15`, border: `1px solid ${qc}30`, flexShrink: 0 }}>
                      {qs}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Q{i+1}: {q.question_text}</p>
                      {q.ai_feedback && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>{q.ai_feedback}</p>}
                    </div>
                  </div>
                  
                  {/* Behavioral Subscore details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Eye Contact</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor((q.eye_contact_score ?? 100) / 10) }}>{q.eye_contact_score ?? 100}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Posture</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor((q.posture_score ?? 100) / 10) }}>{q.posture_score ?? 100}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pace</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{q.speaking_pace || 0} WPM</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fillers</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{q.filler_words_count || 0} used</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/interview')}
              style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, outline: 'none' }}>
              <RotateCcw size={15} /> New Session
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/progress')}
              style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, outline: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
              View Progress <ArrowRight size={15} />
            </motion.button>
          </div>
        </div>
      </PageWrapper>
    )
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Active Session View
     ───────────────────────────────────────────────────────────────────────── */
  return (
    <PageWrapper noPadding>
      <div className="container" style={{ paddingTop: 28, paddingBottom: 64, maxWidth: onboarded ? 920 : 720 }}>

        {/* Exit Session Navbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => { cleanupMedia(); cleanupSpeech(); navigate('/interview') }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', outline: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-heading)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={15} /> Exit Session
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {timeLeft !== null && (
              <span style={{
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                background: timeLeft <= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.1)',
                color: timeLeft <= 10 ? '#f87171' : '#818cf8',
                border: timeLeft <= 10 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                ⏱️ {timeLeft}s
              </span>
            )}
            <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', textTransform: 'capitalize' }}>
              {session.mode?.replace('_', ' ')}
            </span>
            <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', textTransform: 'capitalize' }}>
              {session.difficulty}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {totalAnswered}/{session.total_questions}
          </span>
        </div>

        {/* Onboarding Prep Checklist (Optional) */}
        {!onboarded ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...S.card, padding: 36, maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12 }}>AI Interview Lab Live Coach</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
               Nexora will track eye contact, sitting posture, speaking pace, and filler words using your camera and microphone in real time. All analytical computations run safely in your browser.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleStartOnboarding(true)}
                style={{ padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', background: '#111111', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <Video size={16} /> Enable Live Camera & Mic Coach
              </motion.button>
              <button
                onClick={() => handleStartOnboarding(false)}
                style={{ padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--glass-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Keyboard size={15} /> Continue with Keyboard Only
              </button>
            </div>
          </motion.div>
        ) : (
          /* ONBOARDED ACTIVE SCREEN (Side-by-side or standard responsive split) */
          <div>
            {session.mode === 'boardroom' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: '80vh', position: 'relative' }}>
                
                {/* Captions / Active Question Bar at Top */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', padding: '16px 24px', borderRadius: 12, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    Q
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {speakingSpeaker || 'Hiring Panel'} is speaking...
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>
                      {currentQuestion?.question_text}
                    </div>
                  </div>
                </div>

                {/* Stage Layout (Grid or Screen Share Stage) */}
                <div style={{ display: 'grid', gridTemplateColumns: isScreenSharing ? '1fr 300px' : 'repeat(2, 1fr)', gap: 20, flex: 1, minHeight: 460 }}>
                  
                  {/* Central Large Presentation Stage (if screen sharing is active) */}
                  {isScreenSharing && (
                    <div style={{ ...S.card, padding: 0, overflow: 'hidden', border: '2px solid #8b5cf6', boxShadow: '0 0 20px rgba(139,92,246,0.3)', background: '#070714', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.7)', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={12} color="#34d399" /> Presenting your screen
                      </div>
                    </div>
                  )}

                  {/* Grid of interviewers (and webcam/screen tiles) */}
                  <div style={{ 
                    display: isScreenSharing ? 'flex' : 'grid', 
                    flexDirection: isScreenSharing ? 'column' : undefined,
                    gridTemplateColumns: isScreenSharing ? undefined : '1fr 1fr', 
                    gap: 16 
                  }}>
                    
                    {/* Aravind Card */}
                    <div style={{ 
                      ...S.card,
                      padding: 16, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 12, 
                      border: speakingId === 'Tech Lead' ? '2px solid #6366f1' : '1px solid var(--glass-border)',
                      boxShadow: speakingId === 'Tech Lead' ? '0 0 15px rgba(99,102,241,0.4)' : 'none',
                      position: 'relative'
                    }}>
                      <img src="/aravind_tech_lead.png" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #6366f1', objectFit: 'cover' }} alt="Aravind" />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-heading)' }}>Aravind</div>
                        <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>Tech Lead (Algorithms & Big-O)</div>
                      </div>
                      {speakingId === 'Tech Lead' && <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />}
                    </div>

                    {/* Sofia Card */}
                    <div style={{ 
                      ...S.card,
                      padding: 16, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 12, 
                      border: speakingId === 'System Architect' ? '2px solid #10b981' : '1px solid var(--glass-border)',
                      boxShadow: speakingId === 'System Architect' ? '0 0 15px rgba(16,185,129,0.4)' : 'none',
                      position: 'relative'
                    }}>
                      <img src="/sofia_architect.png" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #10b981', objectFit: 'cover' }} alt="Sofia" />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-heading)' }}>Sofia</div>
                        <div style={{ fontSize: 11, color: '#a7f3d0', fontWeight: 600 }}>System Architect (Scale & Cache)</div>
                      </div>
                      {speakingId === 'System Architect' && <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />}
                    </div>

                    {/* Marcus Card */}
                    <div style={{ 
                      ...S.card,
                      padding: 16, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 12, 
                      border: speakingId === 'HR Lead' ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
                      boxShadow: speakingId === 'HR Lead' ? '0 0 15px rgba(245,158,11,0.4)' : 'none',
                      position: 'relative'
                    }}>
                      <img src="/marcus_hr.png" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #f59e0b', objectFit: 'cover' }} alt="Marcus" />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-heading)' }}>Marcus</div>
                        <div style={{ fontSize: 11, color: '#fde68a', fontWeight: 600 }}>Marcus (HR & Soft Skills)</div>
                      </div>
                      {speakingId === 'HR Lead' && <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />}
                    </div>

                    {/* User Local Feed Card */}
                    <div style={{ 
                      ...S.card,
                      padding: 0, 
                      overflow: 'hidden', 
                      background: '#070714', 
                      position: 'relative', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minHeight: 180
                    }}>
                      {cameraActive && !cameraMuted ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          <VideoOff size={32} style={{ color: '#ef4444', marginBottom: 8 }} />
                          <div style={{ fontSize: 12, fontWeight: 700 }}>Webcam Offline</div>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        You (Candidate)
                      </div>
                    </div>

                  </div>

                </div>

                {/* Live Debate overlay subtitle (if speaking or debate transcript is active) */}
                {currentQuestion?.user_answer && (
                  <div style={{ ...S.card, padding: '16px 20px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Sparkles size={14} color="#818cf8" />
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#818cf8', letterSpacing: 0.5 }}>Boardroom Panel Discussion</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {parseDebateTranscript(currentQuestion.behavioral_feedback).map((line, idx) => (
                        <div key={idx} style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-color)' }}>
                          <strong style={{ color: '#a5b4fc' }}>{line.speaker}:</strong> {line.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Control Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10,10,20,0.8)', border: '1px solid var(--glass-border)', padding: '16px 24px', borderRadius: 16, backdropFilter: 'blur(12px)', marginTop: 10 }}>
                  
                  {/* Left controls: Info / Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Activity size={12} /> Mode: FAANG Boardroom
                    </span>
                  </div>

                  {/* Center controls: Google Meet controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    
                    {/* Mic control */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setMicMuted(!micMuted)}
                      style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: micMuted ? '#ef4444' : 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </motion.button>

                    {/* Camera control */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (cameraMuted) {
                          startCamera()
                          setCameraMuted(false)
                        } else {
                          cleanupMedia()
                          setCameraMuted(true)
                        }
                      }}
                      style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: cameraMuted ? '#ef4444' : 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cameraMuted ? <VideoOff size={18} /> : <Video size={18} />}
                    </motion.button>

                    {/* Screen share control */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                      style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: isScreenSharing ? '#10b981' : 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={18} />
                    </motion.button>

                    {/* End interview */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleComplete}
                      style={{ padding: '0 20px', height: 44, borderRadius: 22, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      End Call
                    </motion.button>

                  </div>

                  {/* Right controls: Chat panel & submit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    
                    {!answered && (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={toggleListening}
                          style={{ padding: '0 16px', height: 40, borderRadius: 10, border: 'none', background: isListening ? '#ef4444' : '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isListening ? <><MicOff size={13} /> Speak Off</> : <><Mic size={13} /> Speak On</>}
                        </motion.button>
                        
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setShowChatPanel(!showChatPanel)}
                          style={{ padding: '0 16px', height: 40, borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Keyboard size={13} /> Chat ({showChatPanel ? 'Hide' : 'Show'})
                        </motion.button>
                      </>
                    )}

                    {answered && currentIdx < session.questions.length - 1 && (
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={handleNext}
                        className="btn-primary"
                        style={{ padding: '0 20px', height: 40, borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        Next Round <ArrowRight size={13} />
                      </motion.button>
                    )}

                  </div>

                </div>

                {/* Chat Panel / Keyboard Input drawer */}
                <AnimatePresence>
                  {showChatPanel && !answered && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)', textTransform: 'uppercase', margin: 0 }}>Meet Answer Input Chat</h4>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{answer.length} chars</span>
                      </div>
                      <textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your verbal response here or verify speech transcript..."
                        rows={4}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-color)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                        <button onClick={() => setShowChatPanel(false)} style={{ padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            handleSubmitAnswer()
                            setShowChatPanel(false)
                          }}
                          disabled={!answer.trim() || submitting}
                          className="btn-primary"
                          style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: !answer.trim() ? 0.5 : 1 }}>
                          {submitting ? 'Sending...' : 'Send Message'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            ) : (
              // Original Solo Interview View
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: speechMode ? '1.8fr 1fr' : '1fr', gap: 24 }}>
                  
                  {/* LEFT COLUMN: Question and Input Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <div style={{ ...S.card, padding: 28 }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent)' }} />
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', flexShrink: 0 }}>
                              Q{currentIdx + 1}
                            </div>
                            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.5, margin: 0 }}>{currentQuestion?.question_text}</h2>
                          </div>

                          {!answered ? (
                            <div>
                              <textarea
                                ref={textareaRef}
                                value={answer}
                                onChange={e => setAnswer(e.target.value)}
                                placeholder={speechMode ? "Click the microphone below to talk, or type here to start answering..." : "Type your answer here. Be specific and thorough..."}
                                style={{ width: '100%', minHeight: 180, padding: '14px 16px', borderRadius: 12, fontSize: 14, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', outline: 'none', resize: 'vertical', lineHeight: 1.7, fontFamily: 'inherit', transition: 'all 0.4s ease' }}
                                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.2)'}
                              />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{answer.length} characters</span>
                                
                                {/* Live Action Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {speechMode && speechSupported && (
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                      type="button"
                                      onClick={toggleListening}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 16px',
                                        borderRadius: 10,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: 'none',
                                        color: '#fff',
                                        background: isListening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(139,92,246,0.15)',
                                        border: isListening ? 'none' : '1px solid rgba(139,92,246,0.3)',
                                        color: isListening ? '#fff' : '#a78bfa',
                                        boxShadow: isListening ? '0 0 12px rgba(239,68,68,0.5)' : 'none'
                                      }}>
                                      {isListening ? (
                                        <><MicOff size={14} /> Stop Voice</>
                                      ) : (
                                        <><Mic size={14} /> Speak Answer</>
                                      )}
                                    </motion.button>
                                  )}

                                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={handleSubmitAnswer} disabled={!answer.trim() || submitting}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', cursor: 'pointer', outline: 'none', opacity: !answer.trim() || submitting ? 0.55 : 1, boxShadow: '0 3px 14px rgba(99,102,241,0.3)' }}>
                                    {submitting ? 'Evaluating…' : <><Send size={13} /> Submit Answer</>}
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--card-border)' }}>
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Answer</p>
                              <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.7, margin: 0 }}>{currentQuestion.user_answer}</p>
                            </div>
                          )}
                        </div>

                        {/* AI Feedback */}
                        <AnimatePresence>
                          {(answered || feedbackVisible) && currentQuestion?.ai_feedback && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
                              <div style={{ ...S.card, padding: 20, border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.05)' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.4),transparent)' }} />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 18 }}>🤖</span>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>AI Evaluation</span>
                                    </div>
                                    {currentQuestion.score !== null && (
                                      <span style={{ fontSize: 22, fontWeight: 900, color: scoreColor(currentQuestion.score), fontVariantNumeric: 'tabular-nums' }}>
                                        {currentQuestion.score}/10
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: 13, color: 'var(--text-color)', lineHeight: 1.8 }}>{currentQuestion.ai_feedback}</p>
                                  
                                  {/* Behavioral feedback for this question */}
                                  {currentQuestion.behavioral_feedback && !currentQuestion.behavioral_feedback.includes('No visual feedback') && (
                                    <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(6,182,212,0.06)', borderLeft: '3px solid #06b6d4' }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', marginBottom: 4 }}>Visual & Pacing Coach</div>
                                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{currentQuestion.behavioral_feedback}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation Panel */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      {currentIdx > 0 && (
                        <button onClick={() => { setCurrentIdx(currentIdx - 1); setFeedbackVisible(false); setAnswer('') }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', outline: 'none' }}>
                          <ArrowLeft size={14} /> Previous
                        </button>
                      )}
                      {(feedbackVisible || answered || currentQuestion?.user_answer) && currentIdx < session.questions.length - 1 && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleNext}
                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', cursor: 'pointer', outline: 'none', boxShadow: '0 4px 15px rgba(99,102,241,0.2)' }}>
                          Next Question <ArrowRight size={14} />
                        </motion.button>
                      )}
                      {allAnswered && session.status === 'active' && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleComplete} disabled={completing}
                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', cursor: 'pointer', outline: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)', opacity: completing ? 0.7 : 1 }}>
                          <Trophy size={14} /> {completing ? 'Completing…' : 'Complete & Get Score'}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Webcam Stream and Web Audio Visualizer */}
                  {speechMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      
                      {/* Camera Frame */}
                      <div style={{ ...S.card, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '75%',
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '2px solid #8b5cf6',
                          boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)',
                          background: '#0a0a16',
                        }}>
                          {cameraActive ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scaleX(-1)'
                              }}
                            />
                          ) : (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)'
                            }}>
                              <VideoOff size={32} style={{ marginBottom: 8, color: '#fb7185' }} />
                              <p style={{ fontSize: 12, margin: 0 }}>Webcam Offline</p>
                            </div>
                          )}
                        </div>

                        {/* GPU-Accelerated Audio Spectrum bar visualizer */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Audio Wave Visualizer
                          </span>
                          <canvas
                            ref={canvasRef}
                            height={50}
                            style={{
                              width: '100%',
                              height: 50,
                              borderRadius: 8,
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid var(--glass-border)'
                            }}
                          />
                        </div>

                        {/* Live Communication metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
                          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#818cf8', fontVariantNumeric: 'tabular-nums' }}>{wpm}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Est. WPM</div>
                          </div>
                          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{fillerWords}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Filler words</div>
                          </div>
                        </div>

                        {/* Mode fallback button */}
                        <button
                          onClick={() => {
                            cleanupMedia()
                            cleanupSpeech()
                            setSpeechMode(false)
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: 'transparent',
                            border: '1px dashed var(--glass-border)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}>
                          <Keyboard size={14} /> Switch to Keyboard Mode
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
