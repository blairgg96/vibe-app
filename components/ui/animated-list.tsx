'use client'

import { Children, type ReactNode, useEffect, useMemo, useState } from 'react'

type AnimatedListProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedList({
  children,
  className = '',
  delay = 140,
}: AnimatedListProps) {
  const items = useMemo(() => Children.toArray(children), [children])
  const [visibleCount, setVisibleCount] = useState(1)

  useEffect(() => {
    if (items.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= items.length) {
          window.clearInterval(timer)
          return current
        }

        return current + 1
      })
    }, delay)

    return () => window.clearInterval(timer)
  }, [delay, items.length])

  return (
    <div className={['flex flex-col gap-3', className].join(' ')}>
      {items.slice(0, Math.min(visibleCount, items.length)).map((item, index) => (
        <div
          key={index}
          className="animate-[card-rise_440ms_cubic-bezier(.22,1,.36,1)_both]"
        >
          {item}
        </div>
      ))}
    </div>
  )
}
