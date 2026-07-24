import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Tabs({ tabs = [], defaultTab, onChange, className = '' }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  const handleChange = (id) => {
    setActive(id)
    onChange?.(id)
  }

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl ${className}`}
      style={{ background:'rgba(13,13,34,0.7)', border:'1px solid rgba(99,102,241,0.15)', backdropFilter:'blur(12px)' }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center"
            style={{ color: isActive ? '#ffffff' : '#64748b', border:'none', cursor:'pointer', background:'transparent' }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg"
                style={{ background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.35)' }}
                transition={{ type:'spring', stiffness:380, damping:32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{
                    background: isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#818cf8' : '#475569',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
