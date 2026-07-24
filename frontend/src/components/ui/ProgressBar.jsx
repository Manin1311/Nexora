import { motion } from 'framer-motion'

const GRADIENTS = {
  default: 'linear-gradient(90deg, #6366f1, #8b5cf6, #22d3ee)',
  success: 'linear-gradient(90deg, #10b981, #34d399)',
  warning: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
  danger:  'linear-gradient(90deg, #f43f5e, #fb7185)',
  xp:      'linear-gradient(90deg, #6366f1, #8b5cf6, #22d3ee)',
}

const HEIGHTS = { sm: 4, md: 6, lg: 8, xl: 10 }

export default function ProgressBar({ value = 0, max = 100, label, showPercent = false, variant = 'default', size = 'md', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const h   = HEIGHTS[size] || 6

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label    && <span className="text-xs text-slate-400 font-medium">{label}</span>}
          {showPercent && <span className="text-xs font-bold tabular-nums" style={{ color:'#818cf8' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: h, background: 'rgba(99,102,241,0.12)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.4,0,0.2,1], delay: 0.15 }}
          className="h-full rounded-full"
          style={{ background: GRADIENTS[variant] || GRADIENTS.default, backgroundSize:'200% 100%' }}
        />
      </div>
    </div>
  )
}
