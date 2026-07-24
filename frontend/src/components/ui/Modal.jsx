import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const SIZE_MAP = { sm:'480px', md:'540px', lg:'720px', xl:'900px', full:'95vw' }

const backdropStyle = {
  position: 'fixed', inset: 0, zIndex: 60,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
}

const panelStyle = {
  position: 'relative', width: '100%',
  background: 'rgba(5,5,16,0.95)',
  backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
  border: '1px solid rgba(99,102,241,0.25)',
  borderRadius: '20px',
  boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
  overflow: 'hidden',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.2 }}
          style={{ ...backdropStyle, background:'rgba(0,0,0,0.65)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
        >
          {/* Backdrop blur overlay */}
          <div style={{ position:'absolute', inset:0, backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)' }} />

          <motion.div
            initial={{ opacity:0, scale:0.92, y:24 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.92, y:24 }}
            transition={{ type:'spring', stiffness:360, damping:30 }}
            style={{ ...panelStyle, maxWidth: SIZE_MAP[size] || SIZE_MAP.md }}
            className={className}
          >
            {/* Top shimmer line */}
            <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)' }} />

            {title && (
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom:'1px solid rgba(99,102,241,0.12)' }}
              >
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <motion.button
                  whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg transition-colors"
                  style={{ width:32, height:32, color:'#64748b', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
                >
                  <X size={16} />
                </motion.button>
              </div>
            )}

            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
