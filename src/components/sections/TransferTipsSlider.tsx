'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  children: React.ReactNode
  count: number
}

export default function TransferTipsSlider({ children, count }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || count === 0) return
    const cardWidth = el.scrollWidth / count
    setActiveIndex(Math.min(count - 1, Math.round(el.scrollLeft / cardWidth)))
  }, [count])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div>
      <div ref={containerRef} className="transfertips-grid mt-10">
        {children}
      </div>

      {/* Scroll-indicator dots — verborgen op desktop via CSS */}
      {count > 1 && (
        <div className="transfertips-dots">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeIndex ? '#00FA61' : 'rgba(31,14,132,0.25)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
