import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: {
    style: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
      border: 'none',
      color: '#ffffff',
    },
    hover: { boxShadow: '0 6px 28px rgba(99,102,241,0.5)' },
    className: '',
  },
  secondary: {
    style: {
      background: 'rgba(99,102,241,0.1)',
      border: '1px solid rgba(99,102,241,0.35)',
      color: '#818cf8',
    },
    hover: {},
    className: 'hover:bg-indigo-500/20',
  },
  ghost: {
    style: {
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.08)',
      color: '#94a3b8',
    },
    hover: {},
    className: 'hover:bg-white/5 hover:text-white hover:border-white/15',
  },
  danger: {
    style: {
      background: 'rgba(251,113,133,0.1)',
      border: '1px solid rgba(251,113,133,0.3)',
      color: '#fb7185',
    },
    hover: {},
    className: 'hover:bg-rose-500/20',
  },
  cyan: {
    style: {
      background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
      border: 'none',
      color: '#ffffff',
    },
    hover: {},
    className: '',
  },
  success: {
    style: {
      background: 'rgba(52,211,153,0.1)',
      border: '1px solid rgba(52,211,153,0.3)',
      color: '#34d399',
    },
    hover: {},
    className: 'hover:bg-emerald-500/20',
  },
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2',
  xl: 'px-9 py-4 text-lg rounded-2xl gap-3',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  className = '',
  onClick,
  type = 'button',
  style: externalStyle = {},
  ...props
}) {
  const v = VARIANTS[variant] || VARIANTS.primary

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.03, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ ...v.style, ...externalStyle }}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${v.className}
        ${SIZES[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </motion.button>
  )
}
