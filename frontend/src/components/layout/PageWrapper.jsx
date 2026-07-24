import { motion } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4,0,0.2,1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

/**
 * PageWrapper — wraps authenticated/inner pages with:
 * - Page enter animation
 * - 64px top padding (below Navbar)
 * - Optional max-width container centering
 */
export default function PageWrapper({ children, className = '', noPadding = false }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: '100vh', paddingTop: 64, position: 'relative' }}
    >
      {/* Subtle static page background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.055), transparent)' }} />
      <div className="grid-bg" style={{ position:'fixed', inset:0, zIndex:0, opacity:0.6, pointerEvents:'none' }} />

      {/* Page content */}
      <div style={{ position:'relative', zIndex:1, paddingBottom: noPadding ? 0 : 48 }}
        className={className}>
        {noPadding ? children : (
          <div className="container" style={{ paddingTop: 32 }}>
            {children}
          </div>
        )}
      </div>
    </motion.div>
  )
}
