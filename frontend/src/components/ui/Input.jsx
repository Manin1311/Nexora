import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

const inputStyle = {
  background: 'rgba(13,13,34,0.7)',
  border: '1px solid rgba(99,102,241,0.18)',
  color: '#f1f5f9',
  width: '100%',
  borderRadius: '12px',
  padding: '11px 16px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  backdropFilter: 'blur(12px)',
}

const inputFocusStyle = {
  borderColor: 'rgba(99,102,241,0.5)',
  boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
}

const inputErrorStyle = {
  borderColor: 'rgba(251,113,133,0.5)',
  boxShadow: '0 0 0 3px rgba(251,113,133,0.1)',
}

const Input = forwardRef(({
  label, error, icon, type = 'text', className = '', hint, ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [focused,      setFocused]      = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type

  const combinedStyle = {
    ...inputStyle,
    ...(focused && !error ? inputFocusStyle : {}),
    ...(error            ? inputErrorStyle  : {}),
    paddingLeft: icon ? '40px' : '16px',
    paddingRight: isPassword ? '40px' : '16px',
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium" style={{ color:'#cbd5e1' }}>{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#475569' }}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          style={combinedStyle}
          placeholder={props.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color:'#475569', background:'none', border:'none', cursor:'pointer' }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }}
            className="text-xs flex items-center gap-1"
            style={{ color:'#fb7185' }}
          >
            ⚠ {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="text-xs" style={{ color:'#475569' }}>{hint}</p>
        )}
      </AnimatePresence>
    </div>
  )
})

Input.displayName = 'Input'
export default Input
