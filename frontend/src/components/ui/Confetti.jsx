import { useState, useEffect } from 'react'

export default function Confetti({ active }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }

    const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#10b981', '#fbbf24', '#06b6d4']
    const shapes = ['circle', 'square', 'circle'] // Prefer rounded circles for smooth sways

    const newPieces = Array.from({ length: 100 }).map((_, i) => {
      const size = Math.random() * 8 + 6 // 6px to 14px
      const left = Math.random() * 100 // 0% to 100%
      const color = colors[Math.floor(Math.random() * colors.length)]
      const shape = shapes[Math.floor(Math.random() * shapes.length)]
      const delay = Math.random() * 1.2 // 0s to 1.2s
      const duration = Math.random() * 2 + 2.5 // 2.5s to 4.5s
      const sway = Math.random() * 120 - 60 // -60px to 60px
      const rotation = Math.random() * 720 - 360 // -360deg to 360deg

      return { id: i, size, left, color, shape, delay, duration, sway, rotation }
    })

    setPieces(newPieces)
  }, [active])

  if (!active) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 99999,
      overflow: 'hidden'
    }}>
      {/* Dynamic Keyframe Injection */}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0px);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(var(--rot)) translateX(var(--sway));
            opacity: 0;
          }
        }
      `}</style>

      {pieces.map(p => {
        let borderRadius = '0px'
        if (p.shape === 'circle') borderRadius = '50%'
        
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: -20,
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius,
              opacity: 1,
              animation: `confettiFall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              animationDelay: `${p.delay}s`,
              '--rot': `${p.rotation}deg`,
              '--sway': `${p.sway}px`
            }}
          />
        )
      })}
    </div>
  )
}
