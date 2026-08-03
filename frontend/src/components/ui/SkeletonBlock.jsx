/**
 * SkeletonBlock — animated shimmer placeholder
 * Renders a pulsing grey bar that matches the expected content size.
 * Use instead of full-page spinners so the page structure shows immediately.
 *
 * Usage:
 *   <SkeletonBlock w="100%" h={24} radius={8} />
 *   <SkeletonBlock w={120} h={14} />
 */
export default function SkeletonBlock({ w = '100%', h = 20, radius = 8, mb = 0, style = {} }) {
  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: radius,
      marginBottom: mb,
      background: 'linear-gradient(90deg, var(--glass-bg) 25%, rgba(99,102,241,0.08) 50%, var(--glass-bg) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  )
}

// Inject the keyframe once globally
if (typeof document !== 'undefined' && !document.getElementById('skeleton-style')) {
  const s = document.createElement('style')
  s.id = 'skeleton-style'
  s.textContent = `@keyframes skeleton-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`
  document.head.appendChild(s)
}
