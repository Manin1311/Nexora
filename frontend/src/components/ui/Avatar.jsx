import { motion } from 'framer-motion'

const RANK_GRADIENT = {
  explorer:  'linear-gradient(135deg,#475569,#64748b)',
  builder:   'linear-gradient(135deg,#059669,#34d399)',
  creator:   'linear-gradient(135deg,#2563eb,#60a5fa)',
  architect: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
  legend:    'linear-gradient(135deg,#d97706,#fbbf24)',
}

const RANK_RING = {
  explorer:  '2px solid rgba(148,163,184,0.4)',
  builder:   '2px solid rgba(52,211,153,0.5)',
  creator:   '2px solid rgba(96,165,250,0.5)',
  architect: '2px solid rgba(167,139,250,0.6)',
  legend:    '2px solid rgba(251,191,36,0.7)',
}

const SIZE_MAP = {
  xs: { wh:24,  font:10, ring:1 },
  sm: { wh:32,  font:13, ring:1 },
  md: { wh:40,  font:15, ring:2 },
  lg: { wh:52,  font:20, ring:2 },
  xl: { wh:64,  font:24, ring:3 },
  '2xl':{ wh:80,font:30, ring:3 },
}

function getInitials(name = '') {
  return name.trim().split(' ').slice(0,2).map(n => n[0]?.toUpperCase()).join('') || '?'
}

export default function Avatar({ src, name, rank = 'explorer', size = 'md', className = '' }) {
  const s = SIZE_MAP[size] || SIZE_MAP.md
  const bg = RANK_GRADIENT[rank] || RANK_GRADIENT.explorer
  const ring = RANK_RING[rank] || RANK_RING.explorer

  return (
    <motion.div
      whileHover={{ scale:1.07 }}
      className={`rounded-full overflow-hidden shrink-0 ${className}`}
      style={{
        width: s.wh, height: s.wh,
        border: ring,
        boxShadow: rank === 'legend' ? '0 0 14px rgba(251,191,36,0.4)' : undefined,
      }}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-bold"
          style={{ background: bg, fontSize: s.font, color:'#fff', letterSpacing:'0.02em' }}
        >
          {getInitials(name)}
        </div>
      )}
    </motion.div>
  )
}
