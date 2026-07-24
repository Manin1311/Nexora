import { motion } from 'framer-motion'

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  gradient = false,
  onClick,
  padding = 'p-6',
  ...props
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: gradient
          ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06), rgba(6,182,212,0.04))'
          : 'rgba(13,13,34,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: gradient
          ? '1px solid rgba(99,102,241,0.3)'
          : '1px solid rgba(99,102,241,0.18)',
      }}
      className={`
        rounded-2xl relative overflow-hidden
        transition-all duration-300
        ${hover ? 'cursor-pointer' : ''}
        ${padding}
        ${className}
      `}
      {...props}
    >
      {/* Subtle top highlight line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
      />
      {/* Inner subtle glow on gradient cards */}
      {gradient && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(99,102,241,0.06), transparent 60%)' }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
