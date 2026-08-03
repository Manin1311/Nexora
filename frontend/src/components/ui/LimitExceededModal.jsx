import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ShieldCheck, Zap, ArrowRight, CheckCircle, CreditCard } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function LimitExceededModal({ featureName = 'AI Mock Interviews', isOpen, onClose, onUpgrade }) {
  const { isPro, activatePro } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [method, setMethod] = useState('card')
  const [name, setName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handlePay = (e) => {
    e.preventDefault()
    setStatus('processing')
    setTimeout(() => {
      setStatus('success')
      activatePro()
      setTimeout(() => {
        setShowCheckout(false)
        setStatus('idle')
        onClose()
        if (onUpgrade) onUpgrade()
      }, 1500)
    }, 1800)
  }

  return createPortal(
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }} onClick={onClose}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 460,
            background: 'var(--card-bg, #0f0f1c)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 24, padding: 32,
            boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(239, 68, 68, 0.15)',
            position: 'relative', overflow: 'hidden'
          }}
        >
          {/* Top warning line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #ef4444, #f59e0b, #6366f1)' }} />

          {/* Close button */}
          <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>

          {showCheckout ? (
            status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.1 }} transition={{ type: 'spring' }}>
                  <CheckCircle size={64} style={{ color: '#34d399', margin: '0 auto 16px', display: 'block' }} />
                </motion.div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>🎉 Pro Unlocked!</h3>
                <p style={{ fontSize: 14, color: '#34d399', fontWeight: 600, marginBottom: 4 }}>Unlimited Access Activated</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Resuming your session...</p>
              </div>
            ) : status === 'processing' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Processing Secure Payment...</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Communicating with Payment Gateway</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <ShieldCheck size={16} style={{ color: '#34d399' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure 256-Bit SSL Checkout</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>Upgrade to Pro Acceleration</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Amount due: <strong style={{ color: '#818cf8', fontSize: 16 }}>$19/month</strong>
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <button type="button" onClick={() => setMethod('card')} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: method === 'card' ? '#6366f1' : 'transparent', color: method === 'card' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CreditCard size={14} /> Credit Card
                  </button>
                  <button type="button" onClick={() => setMethod('upi')} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: method === 'upi' ? '#6366f1' : 'transparent', color: method === 'upi' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    ⚡ UPI / GPay
                  </button>
                </div>

                <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {method === 'card' ? (
                    <>
                      <input type="text" required placeholder="Cardholder Name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      <input type="text" required placeholder="Enter your card number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input type="text" required placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                        <input type="password" required maxLength={4} placeholder="CVV" value={cvv} onChange={e => setCvv(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </>
                  ) : (
                    <input type="text" required placeholder="username@upi or phone@gpay" value={upiId} onChange={e => setUpiId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  )}
                  <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #111111, #1f1f2e)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                    <Lock size={15} /> Pay $19.00 & Unlock Pro
                  </button>
                </form>
              </div>
            )
          ) : (
            <div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Lock size={26} style={{ color: '#ef4444' }} />
              </div>

              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px' }}>
                Weekly Limit Reached (3/3 Used)
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                You have reached your <strong>Free Tier limit of 3 {featureName}</strong> for this week. Upgrade to Pro Acceleration for unlimited access and instant execution!
              </p>

              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#818cf8', fontWeight: 700, fontSize: 13 }}>
                  <Zap size={15} /> Pro Acceleration Includes:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-color)' }}>
                  <li>✓ Unlimited AI Mock Interviews & Feedback</li>
                  <li>✓ Unlimited Deep Repository Code Health Scans</li>
                  <li>✓ Custom AI Syllabus & Verifiable Certificates</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setShowCheckout(true)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                    border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(99,102,241,0.4)'
                  }}
                >
                  🚀 Upgrade to Pro ($19/mo) <ArrowRight size={16} />
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 10,
                    background: 'transparent', color: 'var(--text-muted)',
                    border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
