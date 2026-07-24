import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export default function AnimatedCounter({ value = 0, duration = 1.5, prefix = '', suffix = '', className = '' }) {
  const [display, setDisplay] = useState(0)
  const previousValue = useRef(0)

  useEffect(() => {
    const start = previousValue.current
    const end = value
    const startTime = performance.now()

    const update = (now) => {
      const elapsed = (now - startTime) / (duration * 1000)
      const progress = Math.min(elapsed, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplay(current)
      if (progress < 1) requestAnimationFrame(update)
      else previousValue.current = end
    }

    requestAnimationFrame(update)
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  )
}
