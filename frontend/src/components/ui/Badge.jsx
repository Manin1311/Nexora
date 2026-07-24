const VARIANTS = {
  default:  { color: '#64748b', background: 'rgba(15,15,35,0.6)',    border: '1px solid rgba(255,255,255,0.1)' },
  primary:  { color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' },
  success:  { color: '#34d399', background: 'rgba(52,211,153,0.1)',  border: '1px solid rgba(52,211,153,0.3)' },
  warning:  { color: '#fbbf24', background: 'rgba(251,191,36,0.1)',  border: '1px solid rgba(251,191,36,0.3)' },
  danger:   { color: '#fb7185', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)' },
  info:     { color: '#22d3ee', background: 'rgba(6,182,212,0.1)',   border: '1px solid rgba(6,182,212,0.3)' },
  violet:   { color: '#a78bfa', background: 'rgba(139,92,246,0.1)',  border: '1px solid rgba(139,92,246,0.3)' },
  xp:       { color: '#818cf8', background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.35)' },
  easy:     { color: '#34d399', background: 'rgba(52,211,153,0.1)',  border: '1px solid rgba(52,211,153,0.25)' },
  medium:   { color: '#fbbf24', background: 'rgba(251,191,36,0.1)',  border: '1px solid rgba(251,191,36,0.25)' },
  hard:     { color: '#fb7185', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)' },
}

const SIZES = {
  sm: { padding: '2px 8px',  fontSize: '11px', borderRadius: '6px' },
  md: { padding: '3px 10px', fontSize: '12px', borderRadius: '8px' },
  lg: { padding: '5px 12px', fontSize: '13px', borderRadius: '8px' },
}

export default function Badge({ children, variant = 'default', size = 'md', icon, className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.default
  const s = SIZES[size] || SIZES.md
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap ${className}`}
      style={{ ...v, ...s }}
    >
      {icon && <span style={{ fontSize: '10px' }}>{icon}</span>}
      {children}
    </span>
  )
}
