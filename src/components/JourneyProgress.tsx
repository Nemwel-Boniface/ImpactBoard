'use client'

import { useState } from 'react'

const START  = new Date('2026-03-16')
const REVIEW = new Date('2026-06-16')
const TOTAL_DAYS = Math.round((REVIEW.getTime() - START.getTime()) / 86400000) // 92 days

const MILESTONES = [
  { label: 'Month 1',  date: new Date('2026-04-16'), shortDate: 'Apr 16' },
  { label: 'Month 2',  date: new Date('2026-05-16'), shortDate: 'May 16' },
]

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export default function JourneyProgress() {
  const [tooltip, setTooltip] = useState<{ day: number; pct: number } | null>(null)

  const today    = new Date()
  const elapsed  = Math.min(Math.max(daysBetween(START, today), 0), TOTAL_DAYS)
  const isPost   = today > REVIEW
  const progress = isPost ? 100 : Math.round((elapsed / TOTAL_DAYS) * 100)
  const daysLeft = Math.ceil(daysBetween(today, REVIEW))
  const daysSince = isPost ? daysBetween(REVIEW, today) : 0

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setTooltip({ day: Math.round(pct * TOTAL_DAYS), pct: pct * 100 })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-syne font-bold text-[16px]">🗓 90-Day Journey</h2>
        {isPost ? (
          <span className="text-[12px] font-semibold text-eden-green-mid bg-eden-green-pale border border-eden-green/20 px-2.5 py-1 rounded-full">
            ✅ Review Complete · +{daysSince}d post-review
          </span>
        ) : (
          <span className="text-[12px] text-eden-grey">
            Day {elapsed} of {TOTAL_DAYS} · <span className="text-eden-orange font-semibold">{daysLeft}d to review</span>
          </span>
        )}
      </div>

      {/* Track */}
      <div
        className="relative h-3 bg-eden-light rounded-full cursor-crosshair select-none"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Fill */}
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isPost
              ? 'bg-gradient-to-r from-eden-green to-eden-green-mid'
              : 'bg-gradient-to-r from-eden-green to-eden-green-mid'
          }`}
          style={{ width: `${progress}%` }}
        />

        {/* Milestone markers */}
        {MILESTONES.map(m => {
          const pct    = (daysBetween(START, m.date) / TOTAL_DAYS) * 100
          const passed = today >= m.date
          return (
            <div
              key={m.label}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-eden-light z-10 ${
                passed ? 'bg-eden-green-mid' : 'bg-white'
              }`}
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          )
        })}

        {/* Today cursor — only before review */}
        {!isPost && progress > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-eden-green shadow-md z-20 transition-all duration-1000"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        )}

        {/* Hover tooltip */}
        {tooltip && (
          <div
            className="absolute -top-9 bg-eden-dark text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap -translate-x-1/2 z-30"
            style={{ left: `${tooltip.pct}%` }}
          >
            Day {tooltip.day} of {TOTAL_DAYS}
          </div>
        )}
      </div>

      {/* Date labels */}
      <div className="flex justify-between text-[11px] text-eden-grey">
        <span>Mar 16 — Day 1</span>
        {MILESTONES.map(m => (
          <span
            key={m.label}
            className={today >= m.date ? 'text-eden-green font-medium' : ''}
          >
            {m.shortDate} — {m.label} {today >= m.date ? '✓' : ''}
          </span>
        ))}
        <span className={isPost ? 'text-eden-green font-semibold' : 'text-eden-orange font-medium'}>
          {isPost ? '✅ Jun 16 — Reviewed' : 'Jun 16 ← Review'}
        </span>
      </div>
    </div>
  )
}
