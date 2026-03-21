'use client'

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'

type MagicCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  spotlightClassName?: string
}

const HIDDEN_POSITION = '-240px'

export function MagicCard({
  children,
  className = '',
  spotlightClassName = '',
  ...props
}: MagicCardProps) {
  const [style, setStyle] = useState<CSSProperties>({
    '--magic-x': HIDDEN_POSITION,
    '--magic-y': HIDDEN_POSITION,
  } as CSSProperties)

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()

    setStyle({
      '--magic-x': `${event.clientX - bounds.left}px`,
      '--magic-y': `${event.clientY - bounds.top}px`,
    } as CSSProperties)
  }

  function handlePointerLeave() {
    setStyle({
      '--magic-x': HIDDEN_POSITION,
      '--magic-y': HIDDEN_POSITION,
    } as CSSProperties)
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
      style={style}
      className={[
        'group relative overflow-hidden rounded-[1.75rem] border border-white/55 bg-white/88 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className={[
          'pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100',
          '[background:radial-gradient(240px_circle_at_var(--magic-x)_var(--magic-y),rgba(45,212,191,0.2),transparent_60%)]',
          spotlightClassName,
        ].join(' ')}
      />
      <div className="pointer-events-none absolute inset-[1px] rounded-[calc(1.75rem-1px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,250,249,0.82))]" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
