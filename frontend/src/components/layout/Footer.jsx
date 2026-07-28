import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Globe, Mail, ArrowRight } from 'lucide-react'

const Github = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
)

const Twitter = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
)

const PLATFORM = [
  { to:'/#features', label:'Features'   },
  { to:'/roadmap',    label:'AI Roadmaps' },
  { to:'/challenges', label:'Coding Sandbox' },
  { to:'/interview',  label:'Interview Lab'     },
]
const COMPANY = [
  { to:'/about',   label:'About'    },
  { to:'/mentor',  label:'Careers'  },
  { to:'/privacy', label:'Privacy'  },
  { to:'/terms',   label:'Terms'    },
]
const SOCIAL = [
  { icon: Github, href:'https://github.com/PoreKrisha29/Nexora', label:'GitHub' },
]

export default function Footer() {
  const handleSubscribe = (e) => {
    e.preventDefault()
    alert('Thank you for subscribing to Nexora Updates!')
  }

  return (
    <footer style={{ background:'var(--section-alt-bg)', borderTop:'1px solid var(--nav-border)', paddingTop:80, paddingBottom:40, transition:'all 0.4s ease' }}>
      <div className="container">
        {/* Top */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:48, marginBottom:56 }}>

          {/* Brand */}
          <div style={{ minWidth: 260 }}>
            <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:20 }}>
              <div style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Zap size={15} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="gradient-text" style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', fontFamily: 'var(--font-display)' }}>Nexora</span>
            </Link>
            <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.75, marginBottom:24, maxWidth:280 }}>
              The developer growth ecosystem where you learn, practice, improve, and showcase your journey. Built for developers who ship.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              {SOCIAL.map(s => (
                <a key={s.label} href={s.href}
                  target="_blank" rel="noopener noreferrer"
                  style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--text-muted)', textDecoration:'none', transition:'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.color='var(--text-heading)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.3)'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--glass-border)'; e.currentTarget.style.transform='translateY(0)' }}
                  title={s.label}
                >
                  <s.icon width={16} height={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{ fontSize:12, fontWeight:700, color:'var(--text-heading)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:20 }}>Platform</h4>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:12 }}>
              {PLATFORM.map(l => (
                <li key={l.label}>
                  <Link to={l.to} style={{ fontSize:14, color:'var(--text-muted)', textDecoration:'none', transition:'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color='var(--text-heading)'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize:12, fontWeight:700, color:'var(--text-heading)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:20 }}>Company</h4>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:12 }}>
              {COMPANY.map(l => (
                <li key={l.label}>
                  <Link to={l.to} style={{ fontSize:14, color:'var(--text-muted)', textDecoration:'none', transition:'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color='var(--text-heading)'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div style={{ minWidth: 260 }}>
            <h4 style={{ fontSize:12, fontWeight:700, color:'var(--text-heading)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:20 }}>Contact Us</h4>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:16 }}>
              Have questions, feedback, or need assistance? Reach out to the Nexora team.
            </p>
            <Link to="/contact">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#111111',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                  textDecoration: 'none'
                }}
              >
                Send Message <ArrowRight size={14} />
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ paddingTop:24, borderTop:'1px solid var(--nav-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <p style={{ fontSize:13, color:'var(--text-muted)' }}>
            © {new Date().getFullYear()} Nexora. Built for developers who ship.
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#34d399', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
