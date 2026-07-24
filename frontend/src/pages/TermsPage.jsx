import { motion } from 'framer-motion'
import { FileText, Award, Shield, Key, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function TermsPage() {
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
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', filter:'blur(150px)', opacity:0.1, background:'radial-gradient(circle, #06b6d4, transparent 70%)', bottom:-100, left:-100 }} />

      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          
          {/* Header */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FileText size={28} style={{ color: '#06b6d4' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
              Terms of Service
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              Last Updated: July 10, 2026. Terms and conditions of the Nexora platform.
            </p>
          </motion.div>

          {/* Intro Card */}
          <motion.div variants={fadeUp} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: 32, marginBottom: 40, boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Shield size={22} style={{ color: '#6366f1', flexShrink: 0, marginTop: 4 }} />
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>Terms of Use</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                  By accessing or using Nexora, you agree to comply with our service terms. We provide developer assessment tools, AI roadmaps, interview simulation channels, and certificate verification rubrics. We expect code submissions to represent your own achievements.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Sections */}
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 56 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#06b6d4' }}>1.</span> User Accounts & GitHub Connection
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                To unlock certain features (such as scanning repositories or logging streak statistics), you must authorize Nexora via GitHub OAuth. You are responsible for maintaining the credentials of your account.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#06b6d4' }}>2.</span> Acceptable Use Policy
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                You agree not to utilize the Mock Interview Labs or Code Reviews to submit spam, malicious scripts, or copy paste code that bypasses our learning rubrics. You must not attempt to scrape or reverse engineer our Django backend endpoints.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#06b6d4' }}>3.</span> Verification Certifications & Credentials
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                Certificates generated by completed curriculum modules are verifiably linked to our platform database. If we detect fraudulent activity or script-based manipulation to bypass quizzes, we reserve the right to revoke those certificates and freeze account ranks.
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
              Accept Terms & Return to Form <ArrowRight size={15} />
            </motion.button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
