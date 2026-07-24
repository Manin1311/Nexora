import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Eye, FileText, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-color)',
      color: 'var(--text-color)',
      padding: '120px 24px 80px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.4s ease, color 0.4s ease'
    }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', filter:'blur(150px)', opacity:0.1, background:'radial-gradient(circle, #6366f1, transparent 70%)', top:-100, right:-100 }} />
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', filter:'blur(150px)', opacity:0.1, background:'radial-gradient(circle, #8b5cf6, transparent 70%)', bottom:-100, left:-100 }} />

      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          
          {/* Header */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShieldCheck size={28} style={{ color: '#6366f1' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              Last Updated: July 10, 2026. Your privacy matters to the Nexora ecosystem.
            </p>
          </motion.div>

          {/* Intro Card */}
          <motion.div variants={fadeUp} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: 32, marginBottom: 40, boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Lock size={22} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 4 }} />
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>Our Privacy Commitment</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                  At Nexora, we secure your GitHub repositories and personal growth analytics. We never read private source code without your explicit authentication, and we do not sell your personal data. We are designed to evaluate engineering skills securely and help you grow.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Sections */}
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 56 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#6366f1' }}>1.</span> Data We Collect
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                We collect information directly from you when you register, connect your GitHub profile, or complete mock interviews. This includes:
              </p>
              <ul style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, paddingLeft: 20, marginTop: 8 }}>
                <li>Account profile information (Name, Email, Rank Tag).</li>
                <li>GitHub metadata (Language stats, public commit frequencies, and repository metrics).</li>
                <li>Academy learning records, quiz scores, and certificate logs.</li>
                <li>Audio transcripts or typed responses from the Mock Interview Labs for AI feedback evaluation.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#6366f1' }}>2.</span> How We Use Your Data
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                Nexora leverages your data to power the skill analysis model:
              </p>
              <ul style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, paddingLeft: 20, marginTop: 8 }}>
                <li>Generating custom week-by-week learning syllabus roadmaps.</li>
                <li>Scoring repository structure quality under 1.5 seconds.</li>
                <li>Evaluating conversational responses against professional rubrics in real-time.</li>
                <li>Printing secure Platform Verifiable Certificate credentials.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#6366f1' }}>3.</span> Security and AI Processing
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                Interview logs and code metadata are securely processed using encrypted APIs connected to our AI models (powered by Groq LLaMA and Gemini). They are temporarily buffered to score performance, and are protected under standard security architectures.
              </p>
            </div>
          </motion.div>

          {/* Footer controls */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: 40, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (window.history.length > 1) navigate(-1)
                else navigate('/register')
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 9999, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
            >
              Accept Policy & Return to Form <ArrowRight size={15} />
            </motion.button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
