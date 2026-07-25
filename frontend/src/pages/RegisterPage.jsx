import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const S = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '40px 24px',
    background: 'var(--bg-color)',
    transition: 'background-color 0.4s ease, color 0.4s ease',
  },
  card: {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--card-border)',
    borderRadius: '20px',
    padding: '36px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background-color 0.4s ease, border-color 0.4s ease',
  },
  inputGroup: {
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '11px 14px 11px 40px',
    borderRadius: '10px',
    fontSize: '14px',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-color)',
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.4s, color 0.4s',
  },
  icon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
  },
  error: {
    fontSize: '12px',
    color: '#fb7185',
    marginTop: '4px',
  },
  btn: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '24px',
  }
}

function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (password.length >= 12) score++
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][score], pct: (score / 5) * 100 }
}

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', password_confirm: '' })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const initGoogle = () => {
      /* global google */
      if (window.google) {
        try {
          google.accounts.id.initialize({
            client_id: (import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID.trim())
              ? import.meta.env.VITE_GOOGLE_CLIENT_ID.trim()
              : '262401890252-9rvc6los0skfju4i5om4jqvqnnlj606p.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse,
          })
          const btn = document.getElementById('google-signup-btn')
          if (btn) {
            google.accounts.id.renderButton(
              btn,
              { theme: 'outline', size: 'large', width: 348, text: 'signup_with' }
            )
          }
        } catch (e) {
          console.error("Google Auth initialization error:", e)
        }
      }
    }

    if (window.google) {
      initGoogle()
    } else {
      const timer = setInterval(() => {
        if (window.google) {
          initGoogle()
          clearInterval(timer)
        }
      }, 200)
      return () => clearInterval(timer)
    }
  }, [])

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true)
    try {
      await loginWithGoogle(response.credential)
      navigate('/challenges')
    } catch (err) {
      const msg = err.response?.data?.error || 'Google signup failed. Please try again.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength(form.password)

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) {
      e.password = 'Password is required'
    } else if (form.password.length < 8) {
      e.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      e.password = 'Password must contain uppercase, lowercase & a number'
    }
    if (form.password !== form.password_confirm) e.password_confirm = 'Passwords do not match'
    if (!agreedToTerms) e.terms = 'You must agree to the Terms & Privacy Policy'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/challenges')
    } catch (err) {
      const data = err.response?.data || {}
      const errs = {}
      Object.keys(data).forEach(k => { errs[k] = Array.isArray(data[k]) ? data[k][0] : data[k] })
      if (!Object.keys(errs).length) errs.general = 'Registration failed. Please try again.'
      setErrors(errs)
    } finally {
      setLoading(false)
    }
  }

  const strengthColors = { 1: '#fb7185', 2: '#fbbf24', 3: '#fbbf24', 4: '#34d399', 5: '#34d399' }

  return (
    <div style={S.container}>
      {/* Background patterns */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08, background: 'radial-gradient(circle, #6366f1, transparent)', top: '10%', left: '10%' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08, background: 'radial-gradient(circle, #8b5cf6, transparent)', bottom: '10%', right: '10%' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
              <Zap size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="gradient-text" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Nexora</span>
          </Link>
        </div>

        {/* Card */}
        <div style={S.card}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />
          
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 6 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Start your journey as an Explorer</p>

          {errors.general && (
            <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: '10px', fontSize: '13px', color: '#fb7185' }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={S.inputGroup}>
              <label style={S.label}>Full Name</label>
              <div style={S.inputWrapper}>
                <User size={16} style={S.icon} />
                <input
                  type="text"
                  placeholder="Alex Chen"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  style={S.input}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
                />
              </div>
              {errors.full_name && <span style={S.error}>{errors.full_name}</span>}
            </div>

            {/* Email */}
            <div style={S.inputGroup}>
              <label style={S.label}>Email</label>
              <div style={S.inputWrapper}>
                <Mail size={16} style={S.icon} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={S.input}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
                />
              </div>
              {errors.email && <span style={S.error}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div style={S.inputGroup}>
              <label style={S.label}>Password</label>
              <div style={S.inputWrapper}>
                <Lock size={16} style={S.icon} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...S.input, paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    zIndex: 2
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span style={S.error}>{errors.password}</span>}

              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: 'var(--scrollbar-track)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strengthColors[strength.score] || '#fb7185', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Strength: <span style={{ color: strength.score >= 3 ? '#34d399' : '#fbbf24', fontWeight: 600 }}>{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={S.inputGroup}>
              <label style={S.label}>Confirm Password</label>
              <div style={S.inputWrapper}>
                <Lock size={16} style={S.icon} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={form.password_confirm}
                  onChange={e => setForm({ ...form, password_confirm: e.target.value })}
                  style={{ ...S.input, paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    zIndex: 2
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password_confirm && <span style={S.error}>{errors.password_confirm}</span>}
            </div>

            {/* Terms & Privacy Agreement Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16 }}>
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={e => { setAgreedToTerms(e.target.checked); if (errors.terms) setErrors({ ...errors, terms: null }) }}
                style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#6366f1' }}
              />
              <label htmlFor="terms" style={{ fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1.4 }}>
                I agree to the{' '}
                <Link to="/terms" target="_blank" style={{ color: '#818cf8', textDecoration: 'underline', fontWeight: 600 }}>
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" style={{ color: '#818cf8', textDecoration: 'underline', fontWeight: 600 }}>
                  Privacy Policy
                </Link>{' '}
                <span style={{ color: '#fb7185' }}>*</span>
              </label>
            </div>
            {errors.terms && <span style={S.error}>{errors.terms}</span>}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ ...S.btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <ArrowRight size={15} />}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
          </div>

          {/* Google Signup Button */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div id="google-signup-btn" style={{ width: '100%' }} />
          </div>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={e => e.target.style.color = '#a5b4fc'}
              onMouseLeave={e => e.target.style.color = '#818cf8'}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
