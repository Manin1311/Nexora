import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Heart, Users, MessageSquare, Code2, Award,
  BookOpen, Target, Sparkles, ArrowRight, ShieldCheck, Flame
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

export default function AboutPage() {
  const { theme } = useTheme()
  const [steamOffset, setSteamOffset] = useState(0)

  // Subtle steam animation loop for the mug
  useEffect(() => {
    const timer = setInterval(() => {
      setSteamOffset(s => (s + 1) % 4)
    }, 1200)
    return () => clearInterval(timer)
  }, [])

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
      {/* Background Glow Blobs */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', filter:'blur(160px)', opacity:0.12, background:'radial-gradient(circle, #6366f1, transparent 70%)', top:-150, left:-100 }} />
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', filter:'blur(140px)', opacity:0.1, background:'radial-gradient(circle, #8b5cf6, transparent 70%)', bottom:200, right:-100 }} />

      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* ══════════════════════════════════════
            SECTION 1: HERO & FLAT ARTWORK
        ══════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center', marginBottom: 120 }}>
          
          {/* Mission & Stats */}
          <motion.div initial="hidden" animate="show" variants={staggerContainer}>
            <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', marginBottom: 20 }}>
              <Zap size={13} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>About Nexora</span>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-display)', lineHeight: 1.05, marginBottom: 20 }}>
              Accelerating developer growth with <span className="gradient-text">intelligent mentoring</span>.
            </motion.h1>

            <motion.p variants={fadeUp} style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
              Nexora was built to bridge the gap between static learning and active repository engineering. By connecting deep GitHub audits, real-time interactive challenges, AI mock interview modules, and verifiable certifications, Nexora empowers developers to map out their progress and shape their career targets on a unified platform.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, borderTop: '1px solid var(--glass-border)', paddingTop: 28, marginBottom: 36 }}>
              <div>
                <h4 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-heading)', lineHeight: 1 }}>15k+</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Developers</p>
              </div>
              <div>
                <h4 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-heading)', lineHeight: 1 }}>1.5s</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>GitHub Scan</p>
              </div>
              <div>
                <h4 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-heading)', lineHeight: 1 }}>98.4%</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Pass Rate</p>
              </div>
            </motion.div>
          </motion.div>

          {/* SVG Developer Sitting Cross-Legged (Image 1 Style) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div style={{
              width: '100%',
              maxWidth: '480px',
              aspectRatio: '1/1',
              background: '#ffffff', // Clean white background for character contrast
              border: '1px solid #e2e8f0',
              borderRadius: '32px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <svg viewBox="0 0 420 420" width="100%" height="100%" style={{ overflow: 'visible' }}>
                
                {/* 1. BACKGROUND WALL BOOKSHELF */}
                <g>
                  {/* Main Shelf Plank */}
                  <rect x="20" y="68" width="380" height="6" fill="#d1d8e0" />
                  {/* Left Bracket */}
                  <rect x="40" y="20" width="6" height="48" fill="#d1d8e0" />
                  {/* Right Bracket */}
                  <rect x="374" y="20" width="6" height="48" fill="#d1d8e0" />

                  {/* Books on shelf */}
                  {/* Left Pack */}
                  <rect x="70" y="32" width="14" height="36" fill="#fed330" />
                  <rect x="88" y="44" width="12" height="24" fill="#4b7bec" />
                  {/* Left Pack inner stripe */}
                  <rect x="92" y="48" width="4" height="16" fill="#fff" opacity="0.3" />
                  <rect x="104" y="36" width="10" height="32" fill="#26de81" />
                  <rect x="118" y="24" width="16" height="44" fill="#ff8d85" />

                  {/* Right Pack */}
                  <rect x="250" y="32" width="15" height="36" fill="#fed330" />
                  <rect x="270" y="40" width="12" height="28" fill="#3867d6" />
                  <rect x="286" y="16" width="22" height="52" fill="#ff6b35" />
                  {/* Book stripes */}
                  <line x1="286" y1="28" x2="308" y2="28" stroke="#fff" strokeWidth="2" />
                  <line x1="286" y1="36" x2="308" y2="36" stroke="#fff" strokeWidth="2" />
                </g>

                {/* 2. COFFEE TABLE (LEFT SIDE) */}
                <g>
                  {/* Floor Shadow for Table */}
                  <ellipse cx="110" cy="338" rx="70" ry="10" fill="#e2e8f0" />
                  
                  {/* Table Base & Legs */}
                  <rect x="35" y="295" width="150" height="12" fill="#2d3436" rx="2" />
                  <rect x="58" y="307" width="14" height="32" fill="#2d3436" />
                  <rect x="138" y="307" width="14" height="32" fill="#2d3436" />

                  {/* Books on Table */}
                  <rect x="34" y="256" width="76" height="14" fill="#20bf6b" rx="2" />
                  <rect x="42" y="260" width="60" height="6" fill="#fff" opacity="0.25" />

                  <rect x="38" y="274" width="90" height="14" fill="#fed330" rx="2" />
                  <rect x="46" y="278" width="74" height="6" fill="#fff" opacity="0.25" />

                  {/* Blue Coffee Mug */}
                  <path d="M 136,264 A 18,18 0 0,0 172,264 Z" fill="#3867d6" />
                  <rect x="136" y="264" width="36" height="8" fill="#3867d6" />
                  {/* Handle */}
                  <path d="M 168,266 C 178,266 178,276 168,276" fill="none" stroke="#3867d6" strokeWidth="3.5" />
                  {/* Tea bag tag */}
                  <rect x="146" y="272" width="10" height="10" rx="1" fill="#fff" />
                  <circle cx="151" cy="277" r="2" fill="#20bf6b" />

                  {/* Steam Waves */}
                  <path d="M 144,248 C 142,242 148,238 146,230" fill="none" stroke="#a5b1c2" strokeWidth="2.5" strokeLinecap="round" opacity={steamOffset === 0 || steamOffset === 2 ? 0.8 : 0.2} style={{ transition: 'opacity 0.4s' }} />
                  <path d="M 154,248 C 152,238 158,234 156,224" fill="none" stroke="#a5b1c2" strokeWidth="2.5" strokeLinecap="round" opacity={steamOffset === 1 || steamOffset === 3 ? 0.8 : 0.2} style={{ transition: 'opacity 0.4s' }} />
                </g>

                {/* 3. DEVELOPER CHARACTER */}
                <g>
                  {/* Floor Shadow for Developer */}
                  <ellipse cx="270" cy="360" rx="110" ry="15" fill="#e2e8f0" />

                  {/* Crossed Legs (Blue Trousers) */}
                  {/* Left thigh curved */}
                  <path d="M 205,310 C 175,290 190,360 380,358" fill="#4b7bec" stroke="#3867d6" strokeWidth="1.5" />
                  {/* Right thigh curved */}
                  <path d="M 375,310 C 405,290 390,360 200,358" fill="#4b7bec" stroke="#3867d6" strokeWidth="1.5" />

                  {/* Slippers/Feet (Yellow/Orange with dark stripes) */}
                  {/* Left Foot */}
                  <g>
                    <ellipse cx="230" cy="358" rx="26" ry="15" fill="#fed330" />
                    <path d="M 210,352 Q 220,362 250,356" fill="none" stroke="#2d3436" strokeWidth="2" />
                    <line x1="220" y1="358" x2="235" y2="362" stroke="#2d3436" strokeWidth="1.5" />
                  </g>
                  {/* Right Foot */}
                  <g>
                    <ellipse cx="350" cy="358" rx="26" ry="15" fill="#fed330" />
                    <path d="M 370,352 Q 360,362 330,356" fill="none" stroke="#2d3436" strokeWidth="2" />
                    <line x1="360" y1="358" x2="345" y2="362" stroke="#2d3436" strokeWidth="1.5" />
                  </g>

                  {/* Torso (Orange Sweater) */}
                  <path d="M 238,212 Q 290,198 342,212 L 358,318 C 300,332 280,332 222,318 Z" fill="#ff6b35" />
                  
                  {/* Neck collar strip */}
                  <path d="M 276,214 A 14,14 0 0,0 304,214" fill="none" stroke="#e056fd" strokeWidth="3" />

                  {/* Arms typing */}
                  <motion.g
                    animate={{ y: [-0.8, 0.8, -0.8] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    {/* Left Arm sleeve */}
                    <path d="M 238,212 L 264,285 L 282,275 L 254,210 Z" fill="#ff6b35" />
                    {/* Right Arm sleeve */}
                    <path d="M 342,212 L 316,285 L 298,275 L 326,210 Z" fill="#ff6b35" />
                    {/* Hands (Skin color) */}
                    <circle cx="266" cy="285" r="7" fill="#fed8c3" />
                    <circle cx="314" cy="285" r="7" fill="#fed8c3" />
                  </motion.g>

                  {/* Head Neck */}
                  <rect x="283" y="172" width="14" height="20" fill="#fed8c3" />

                  {/* Head Face */}
                  <circle cx="290" cy="162" r="22" fill="#fed8c3" />
                  {/* Facial Details */}
                  {/* Eyes */}
                  <circle cx="284" cy="158" r="2" fill="#2d3436" />
                  <circle cx="296" cy="158" r="2" fill="#2d3436" />
                  {/* Smile */}
                  <path d="M 287,170 Q 290,172 293,170" fill="none" stroke="#2d3436" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Tufted Hair (Dark gray/black tufts) */}
                  <path d="M 268,154 C 262,120 318,120 312,154 C 304,142 278,142 268,154 Z" fill="#2d3436" />
                  <circle cx="282" cy="134" r="10" fill="#2d3436" />
                  <circle cx="296" cy="134" r="12" fill="#2d3436" />

                  {/* 4. LAPTOP */}
                  <g>
                    {/* Screen/lid */}
                    <rect x="236" y="278" width="108" height="66" rx="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                    {/* Screen Display inside */}
                    <rect x="242" y="284" width="96" height="54" fill="#a1c4fd" opacity="0.85" rx="3" />
                    {/* Keyboard base flat */}
                    <polygon points="230,344 350,344 336,354 244,354" fill="#64748b" />
                    {/* Yellow Sticky Note on laptop lid */}
                    <rect x="250" y="292" width="22" height="22" fill="#fed330" />
                    {/* Sticky Note detail lines */}
                    <line x1="254" y1="298" x2="268" y2="298" stroke="#f39c12" strokeWidth="1.5" />
                    <line x1="254" y1="304" x2="268" y2="304" stroke="#f39c12" strokeWidth="1.5" />
                  </g>
                </g>

                {/* Sparkle decorative */}
                <motion.g
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ transformOrigin: '360px 80px' }}
                >
                  <polygon points="360,70 363,77 370,80 363,83 360,90 357,83 350,80 357,77" fill="#f8a5c2" />
                </motion.g>

              </svg>
            </div>
          </motion.div>

        </div>

        {/* ══════════════════════════════════════
            SECTION 2: CORE PLATFORM PILLARS
        ══════════════════════════════════════ */}
        <div style={{ marginBottom: 120 }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ color: '#6366f1', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 12 }}>Core Ecosystem</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
              The Pillars of Developer Acceleration
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 620, margin: '0 auto' }}>
              We combined six essential feedback systems to create a unified developer platform that grows with you.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { icon: Code2, title: 'AI GitHub Scanner', desc: 'Queries language ratios, testing configurations, and structural complexity concurrently in under 1.5 seconds.' },
              { icon: Target, title: 'Dynamic Syllabus', desc: 'Analyzes your scan reports and mock interview profiles to construct a dynamic, week-by-week roadmap.' },
              { icon: BookOpen, title: 'Academy Courses', desc: 'Studies interactive learning modules verified with graded quizzes, saving progress metrics directly to your rank.' },
              { icon: MessageSquare, title: 'Interview Lab', desc: 'Runs real-time conversational interview simulations evaluated against professional FAANG rubrics.' },
              { icon: Award, title: 'Verifiable Certificates', desc: 'Generates report credentials storing unique platforms IDs (e.g. NXR-A8B9C10D) to display accomplishments.' },
              { icon: Flame, title: 'Gamified Growth Index', desc: 'Grants XP rewards and tags from Explorer to Legend, encouraging continuous daily learning streaks.' }
            ].map((p, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: 'var(--glass-shadow)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <p.icon size={20} style={{ color: '#6366f1' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 3: HOW IT WORKS PIPELINE
        ══════════════════════════════════════ */}
        <div style={{ marginBottom: 120 }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ color: '#06b6d4', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 12 }}>Methodology</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
              The Engineering Journey
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: '800px', margin: '0 auto' }}>
            {[
              { title: '1. OAuth Hook & Repository Scan', desc: 'Securely link GitHub. Our backend concurrently scans commits, documentation ratios, and linting patterns in under 1.5 seconds.' },
              { title: '2. Skills Matrix Diagnosis', desc: 'Identifies systemic gaps in system design, concurrent programming, algorithms, database optimization, or frontend styling.' },
              { title: '3. Customized Curriculum syllabus', desc: 'Spawns a week-by-week learning roadmap customized to your level, pulling concepts, quizzes, and arena coding sandboxes.' },
              { title: '4. Verifiable PDF Credentialing', desc: 'Complete final exams and mock interviews to earn unique verifiable certificates and rank tags to showcase your skills.' }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                style={{
                  display: 'flex',
                  gap: 20,
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--glass-shadow)'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: '#06b6d4', flexShrink: 0 }}>Step {idx + 1}</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 4 }}>{step.title.split('. ')[1]}</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 4: CORE COMPANY VALUES
        ══════════════════════════════════════ */}
        <div style={{ marginBottom: 120 }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ color: '#d946ef', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 12 }}>Our Principles</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-display)' }}>
              Values that Drive Us
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { title: 'Brutal Honesty', desc: 'We deliver objective, metrics-driven feedback. If code complexity is high, our AI tells you exactly how to refactor it.' },
              { title: 'Privacy First', desc: 'We never store private codebase code lines. All reviews happen in-memory and are cleared immediately.' },
              { title: 'Actionable Paths', desc: 'No generic suggestions. Every recommended roadmap item is directly linked to an interactive quiz or sandbox challenge.' }
            ].map((v, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--glass-shadow)'
                }}
              >
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d946ef' }} />
                  {v.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 5: CALL TO ACTION
        ══════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px',
            padding: '64px 32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
            border: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1), transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, fontFamily: 'var(--font-display)' }}>
              Accelerate your engineering journey
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Join thousands of developers using Nexora to audits codebases, solve challenges, and construct premium careers.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/register">
                <motion.div 
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 28px',
                    borderRadius: 9999,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
                  }}
                >
                  Get Started Free <ArrowRight size={15} />
                </motion.div>
              </Link>
              <Link to="/challenges">
                <button
                  style={{
                    padding: '12px 28px',
                    borderRadius: 9999,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-heading)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  Explore Challenges
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
