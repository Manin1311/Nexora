import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function NotFoundPage() {
  const { theme } = useTheme()
  const [animState, setAnimState] = useState('idle') // 'idle' | 'biting' | 'shock' | 'dazed'
  const [smokePuffs, setSmokePuffs] = useState([])

  // State machine loop
  useEffect(() => {
    const loop = () => {
      // 0s - 3s: Idle
      setAnimState('idle')
      
      // 3s - 4.5s: Biting
      const t1 = setTimeout(() => {
        setAnimState('biting')
      }, 3000)

      // 4.5s - 6.5s: Shock
      const t2 = setTimeout(() => {
        setAnimState('shock')
      }, 4500)

      // 6.5s - 9.5s: Dazed
      const t3 = setTimeout(() => {
        setAnimState('dazed')
      }, 6500)

      return [t1, t2, t3]
    };

    let timers = loop()
    const interval = setInterval(() => {
      timers.forEach(t => clearTimeout(t))
      timers = loop()
    }, 9500)

    return () => {
      timers.forEach(t => clearTimeout(t))
      clearInterval(interval)
    }
  }, [])

  // Generate smoke puffs while dazed
  useEffect(() => {
    if (animState !== 'dazed') {
      setSmokePuffs([])
      return
    }

    const interval = setInterval(() => {
      setSmokePuffs(prev => [
        ...prev.slice(-3), // Keep max 4 puffs
        { id: Math.random(), x: 200 + (Math.random() * 20 - 10), y: 100 }
      ])
    }, 800)

    return () => clearInterval(interval)
  }, [animState])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
      color: 'var(--text-color)',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.4s ease, color 0.4s ease'
    }}>
      {/* Styles for Shaking and Sparks */}
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(2px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shock-shake {
          animation: shake 0.1s infinite;
        }
        @keyframes float-smoke {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          20% { opacity: 0.6; }
          100% { transform: translateY(-60px) scale(1.4); opacity: 0; }
        }
        .smoke-puff {
          animation: float-smoke 1.8s ease-out forwards;
        }
        @keyframes spark-flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .spark {
          animation: spark-flash 0.15s infinite;
        }
        @keyframes body-flash {
          0%, 100% { fill: #fbc4b2; }
          50% { fill: #ffffff; }
        }
        .body-electric-flash {
          animation: body-flash 0.1s infinite;
        }
      `}</style>

      <div style={{ textAlign: 'center', zIndex: 1, maxWidth: 640 }}>
        {/* Error Code */}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            fontSize: '120px', 
            fontWeight: 900, 
            lineHeight: 1, 
            marginBottom: 8, 
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          404
        </motion.h1>
        
        {/* Error Message */}
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ 
            fontSize: '24px', 
            fontWeight: 800, 
            color: 'var(--text-heading)', 
            marginBottom: 12 
          }}
        >
          Page Not Found
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ 
            fontSize: '15px', 
            color: 'var(--text-muted)', 
            marginBottom: 40, 
            lineHeight: 1.6 
          }}
        >
          {animState === 'idle' && "Hmm, our prehistoric developer is thinking about trying something..."}
          {animState === 'biting' && "Wait! He is going to bite the power cable...!"}
          {animState === 'shock' && "Bzzt! High voltage code error detected!"}
          {animState === 'dazed' && "Oops! That's a shocking way to discover this page doesn't exist."}
        </motion.p>
      </div>

      {/* Animation Area */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '700px', 
        height: '320px', 
        marginBottom: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* SVG Drawing Canvas */}
        <svg 
          viewBox="0 0 600 300" 
          width="100%" 
          height="100%" 
          style={{ overflow: 'visible' }}
          className={animState === 'shock' ? 'shock-shake' : ''}
        >
          {/* Ground Line */}
          <line x1="50" y1="260" x2="550" y2="260" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} strokeWidth="4" strokeLinecap="round" />

          {/* LEFT STONE PILE */}
          <g>
            {/* Base rock */}
            <path d="M 120,260 C 120,220 180,220 180,260 Z" fill={theme === 'dark' ? '#334155' : '#d1d5db'} />
            {/* Top stone balance */}
            <path d="M 135,225 C 135,210 165,210 165,225 Z" fill={theme === 'dark' ? '#475569' : '#e5e7eb'} />
            {/* Tiny pebble */}
            <ellipse cx="150" cy="205" rx="8" ry="6" fill={theme === 'dark' ? '#64748b' : '#9ca3af'} />
            {/* Shrub leaves */}
            <path d="M 100,260 C 100,240 120,240 120,260 M 110,260 C 110,230 135,230 135,260" fill="#22c55e" />
          </g>

          {/* RIGHT MONOLITH STONE */}
          <g>
            <path d="M 420,260 L 420,150 C 420,110 470,110 470,150 L 470,260 Z" fill={theme === 'dark' ? '#334155' : '#d1d5db'} />
            {/* Shrub leaves base */}
            <path d="M 405,260 C 405,245 425,245 425,260 M 460,260 C 460,245 480,245 480,260" fill="#22c55e" />
          </g>

          {/* THE WIRE/PLUG */}
          <g>
            {/* Cord path */}
            <path 
              d={
                animState === 'biting' || animState === 'shock'
                  ? "M 445,240 Q 320,320 280,180" // pulled up close to hand/mouth
                  : "M 445,240 Q 350,280 290,205" // idle hang
              } 
              fill="none" 
              stroke="#1e293b" 
              strokeWidth="5" 
              strokeLinecap="round"
              style={{ transition: 'd 0.5s ease-in-out' }}
            />
            {/* Plug Tip */}
            {animState !== 'shock' && (
              <rect 
                x={animState === 'biting' ? 275 : 285} 
                y={animState === 'biting' ? 172 : 200} 
                width="10" 
                height="8" 
                rx="2" 
                fill="#ffba08" 
                style={{ 
                  transition: 'all 0.5s ease-in-out', 
                  transform: animState === 'biting' ? 'rotate(-30deg)' : 'none' 
                }} 
              />
            )}
          </g>

          {/* CAVEMAN CHARACTER */}
          <g transform="translate(100, 10)">
            {/* Left Leg */}
            <path d="M 180,210 L 170,250 L 160,250" stroke="#fbc4b2" strokeWidth="12" strokeLinecap="round" fill="none" />
            {/* Right Leg */}
            <path d="M 210,210 L 220,245 L 235,240" stroke="#fbc4b2" strokeWidth="12" strokeLinecap="round" fill="none" />

            {/* Left Arm */}
            <path 
              d={
                animState === 'biting' || animState === 'shock'
                  ? "M 160,160 Q 150,170 182,175" // grabbing wire up close
                  : "M 160,160 Q 130,165 135,185" // hand hanging loose
              }
              stroke="#fbc4b2" 
              strokeWidth="12" 
              strokeLinecap="round" 
              fill="none" 
              style={{ transition: 'd 0.5s ease' }}
            />

            {/* Right Arm */}
            <path d="M 225,160 Q 255,165 250,185" stroke="#fbc4b2" strokeWidth="12" strokeLinecap="round" fill="none" />

            {/* Tunic (Orange Leopard Print Toga) */}
            <path d="M 165,150 L 220,150 L 225,215 L 160,215 Z" fill="#f97316" />
            {/* Leopard Spots */}
            <circle cx="175" cy="165" r="4" fill="#7c2d12" />
            <circle cx="210" cy="170" r="3.5" fill="#7c2d12" />
            <circle cx="190" cy="185" r="5" fill="#7c2d12" />
            <circle cx="170" cy="195" r="4.5" fill="#7c2d12" />
            <circle cx="215" cy="200" r="4" fill="#7c2d12" />

            {/* Neck */}
            <rect x="187" y="132" width="16" height="15" fill="#fbc4b2" />

            {/* Head Base */}
            <circle 
              cx="195" 
              cy="120" 
              r="24" 
              className={animState === 'shock' ? 'body-electric-flash' : ''} 
              fill={animState === 'dazed' ? '#475569' : '#fbc4b2'} 
            />

            {/* Beard */}
            <path 
              d="M 175,120 Q 195,155 215,120 Z" 
              fill={animState === 'dazed' ? '#1e293b' : '#451a03'} 
            />

            {/* Nose */}
            <ellipse cx="195" cy="120" rx="5" ry="4" fill={animState === 'dazed' ? '#334155' : '#fca5a5'} />

            {/* Eyes */}
            {animState === 'shock' ? (
              // Shock X-Eyes
              <g stroke="#000" strokeWidth="2.5">
                <line x1="184" y1="113" x2="190" y2="119" />
                <line x1="190" y1="113" x2="184" y2="119" />
                <line x1="200" y1="113" x2="206" y2="119" />
                <line x1="206" y1="113" x2="200" y2="119" />
              </g>
            ) : animState === 'dazed' ? (
              // Swirly/Dazed Eyes
              <g stroke="#fff" strokeWidth="1.5" fill="none">
                <circle cx="187" cy="115" r="4" stroke="#000" />
                <circle cx="203" cy="115" r="4" stroke="#000" />
                <line x1="183" y1="108" x2="191" y2="110" stroke="#000" strokeWidth="2" />
                <line x1="207" y1="108" x2="199" y2="110" stroke="#000" strokeWidth="2" />
              </g>
            ) : (
              // Normal Eyes
              <g>
                <circle cx="187" cy="115" r="3.5" fill="#000" />
                <circle cx="203" cy="115" r="3.5" fill="#000" />
                {/* Eyebrows */}
                <path d="M 182,108 Q 187,105 192,109" stroke="#451a03" strokeWidth="2.5" fill="none" />
                <path d="M 198,109 Q 203,105 208,108" stroke="#451a03" strokeWidth="2.5" fill="none" />
              </g>
            )}

            {/* Mouth */}
            {animState === 'biting' ? (
              <circle cx="195" cy="129" r="5" fill="#000" />
            ) : animState === 'shock' ? (
              <ellipse cx="195" cy="130" rx="9" ry="4" fill="#ef4444" />
            ) : animState === 'dazed' ? (
              <line x1="190" y1="130" x2="200" y2="130" stroke="#000" strokeWidth="2.5" />
            ) : (
              <circle cx="195" cy="128" r="2.5" fill="#000" />
            )}

            {/* Hair */}
            {animState === 'shock' ? (
              // Electric Hair (Flashing yellow spiky paths)
              <path 
                d="M 170,110 L 160,85 L 180,95 L 185,65 L 195,95 L 205,60 L 210,95 L 225,80 L 220,110 Z" 
                fill="#facc15" 
                stroke="#eab308" 
                strokeWidth="2"
              />
            ) : animState === 'dazed' ? (
              // Burnt charred hair
              <path 
                d="M 172,110 Q 160,85 180,95 Q 185,75 195,95 Q 208,70 212,95 Q 225,85 218,110 Z" 
                fill="#0f172a" 
              />
            ) : (
              // Normal Brown Hair
              <path 
                d="M 172,110 Q 162,88 181,96 Q 186,78 196,96 Q 206,75 211,96 Q 224,88 218,110 Z" 
                fill="#451a03" 
              />
            )}

            {/* Ears */}
            <circle cx="170" cy="120" r="5" fill={animState === 'dazed' ? '#475569' : '#fbc4b2'} />
            <circle cx="220" cy="120" r="5" fill={animState === 'dazed' ? '#475569' : '#fbc4b2'} />
          </g>

          {/* ANIMATED EFFECTS CHUNKS */}

          {/* Thinking / Meat Bubble (Only visible during idle state) */}
          <AnimatePresence>
            {animState === 'idle' && (
              <g>
                {/* Bubble stem */}
                <circle cx="282" cy="70" r="4" fill={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <circle cx="274" cy="82" r="6" fill={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                
                {/* Main bubble */}
                <rect x="250" y="10" width="80" height="46" rx="14" fill={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                
                {/* Question mark or meat logo */}
                <text x="290" y="38" fontSize="22" fontWeight="800" fill="#6366f1" textAnchor="middle">🍖</text>
              </g>
            )}
          </AnimatePresence>

          {/* Shock Lightning Sparks (Only visible during shock state) */}
          {animState === 'shock' && (
            <g className="spark">
              {/* Lightning path left */}
              <path d="M 230,80 L 210,100 L 225,102 L 205,130" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
              {/* Lightning path right */}
              <path d="M 330,130 L 350,110 L 340,105 L 360,85" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
              {/* Electric circles */}
              <circle cx="295" cy="190" r="40" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5,10" />
              <circle cx="295" cy="190" r="60" fill="none" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="3,15" />
            </g>
          )}

          {/* Dazed smoke puffs */}
          {animState === 'dazed' && smokePuffs.map(puff => (
            <circle 
              key={puff.id} 
              cx={puff.x} 
              cy={puff.y} 
              r="10" 
              fill="#94a3b8" 
              className="smoke-puff" 
            />
          ))}
        </svg>
      </div>

      {/* Control / Navigation Links */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <Link to="/">
          <motion.div 
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '14px 28px', 
              borderRadius: 12, 
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
              color: '#fff', 
              fontWeight: 700, 
              fontSize: 14, 
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)' 
            }}
          >
            <Home size={15} /> Return Home
          </motion.div>
        </Link>
        <button 
          onClick={() => window.history.back()}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '14px 28px', 
            borderRadius: 12, 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            color: 'var(--text-heading)', 
            fontWeight: 600, 
            fontSize: 14, 
            cursor: 'pointer',
            backdropFilter: 'blur(12px)'
          }}
        >
          <ArrowLeft size={15} /> Go Back
        </button>
      </motion.div>
    </div>
  )
}
