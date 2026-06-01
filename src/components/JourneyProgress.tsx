'use client'

import { useState } from 'react'

// ── Phase 1: 90-Day Review ─────────────────────────────────────
const P1_START  = new Date('2026-03-16')
const P1_END    = new Date('2026-06-16')
const P1_DAYS   = Math.ceil((P1_END.getTime() - P1_START.getTime()) / 86400000) // 92

// ── Phase 2: Month 5 Contract Conversation ────────────────────
const P2_END    = new Date('2026-08-15')
const P2_DAYS   = Math.ceil((P2_END.getTime() - P1_END.getTime()) / 86400000)   // 60

const P1_MILESTONES = [
  { label: 'Month 1', date: new Date('2026-04-16'), shortDate: 'Apr 16' },
  { label: 'Month 2', date: new Date('2026-05-16'), shortDate: 'May 16' },
]

const P2_MILESTONES = [
  { label: 'Month 4', date: new Date('2026-07-16'), shortDate: 'Jul 16' },
]

function daysUntil(target: Date) {
  return Math.ceil((target.getTime() - Date.now()) / 86400000)
}

function daysSince(from: Date) {
  return Math.floor((Date.now() - from.getTime()) / 86400000)
}

function pctThrough(start: Date, end: Date) {
  const total   = end.getTime() - start.getTime()
  const elapsed = Date.now() - start.getTime()
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

export default function JourneyProgress() {
  const [tooltip, setTooltip] = useState<{ label: string; pct: number } | null>(null)

  const today        = new Date()
  const inPhase1     = today <= P1_END
  const inPhase2     = !inPhase1 && today <= P2_END
  const bothComplete = today > P2_END

  // Phase 1 values
  const p1Progress  = inPhase1 ? pctThrough(P1_START, P1_END) : 100
  const p1DaysLeft  = daysUntil(P1_END)
  const p1Elapsed   = Math.min(daysSince(P1_START), P1_DAYS)

  // Phase 2 values
  const p2Progress  = inPhase2 ? pctThrough(P1_END, P2_END) : bothComplete ? 100 : 0
  const p2DaysLeft  = daysUntil(P2_END)
  const p2Elapsed   = inPhase2 ? daysSince(P1_END) : 0

  function makeMouseMove(totalDays: number, labelFn: (day: number) => string) {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      setTooltip({ label: labelFn(Math.round(pct * totalDays)), pct: pct * 100 })
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Phase 1: 90-Day Journey ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-syne font-bold text-[16px]">🗓 90-Day Journey</h2>
          {inPhase1 ? (
            <span className="text-[12px] text-eden-grey">
              Day {p1Elapsed} of {P1_DAYS} · <span className="text-eden-orange font-semibold">{p1DaysLeft}d to review</span>
            </span>
          ) : (
            <span className="text-[12px] font-semibold text-eden-green-mid bg-eden-green-pale border border-eden-green/20 px-2.5 py-1 rounded-full">
              ✅ 90-Day Review Complete
            </span>
          )}
        </div>

        <div
          className="relative h-3 bg-eden-light rounded-full cursor-crosshair select-none"
          onMouseMove={makeMouseMove(P1_DAYS, d => `Day ${d} of ${P1_DAYS}`)}
          onMouseLeave={() => setTooltip(null)}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-eden-green to-eden-green-mid transition-all duration-1000"
            style={{ width: `${p1Progress}%` }}
          />
          {P1_MILESTONES.map(m => {
            const pct    = ((m.date.getTime() - P1_START.getTime()) / (P1_END.getTime() - P1_START.getTime())) * 100
            const passed = today >= m.date
            return (
              <div key={m.label}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-eden-light z-10 ${passed ? 'bg-eden-green-mid' : 'bg-white'}`}
                style={{ left: `calc(${pct}% - 6px)` }}
              />
            )
          })}
          {inPhase1 && p1Progress > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-eden-green shadow-md z-20 transition-all duration-1000"
              style={{ left: `calc(${p1Progress}% - 8px)` }}
            />
          )}
          {tooltip && (
            <div
              className="absolute -top-9 bg-eden-dark text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap -translate-x-1/2 z-30"
              style={{ left: `${tooltip.pct}%` }}
            >
              {tooltip.label}
            </div>
          )}
        </div>

        <div className="flex justify-between text-[11px] text-eden-grey">
          <span>Mar 16 — Day 1</span>
          {P1_MILESTONES.map(m => (
            <span key={m.label} className={today >= m.date ? 'text-eden-green font-medium' : ''}>
              {m.shortDate} — {m.label} {today >= m.date ? '✓' : ''}
            </span>
          ))}
          <span className={!inPhase1 ? 'text-eden-green font-semibold' : 'text-eden-orange font-medium'}>
            {!inPhase1 ? '✅ Jun 16 — Reviewed' : 'Jun 16 ← Review'}
          </span>
        </div>
      </div>

      {/* ── Phase 2: Contract Extension (shown always once P1 is close or done) ── */}
      <div className={`space-y-3 pt-4 border-t border-eden-green/10 ${inPhase1 ? 'opacity-40' : ''}`}>
        <div className="flex justify-between items-center">
          <h2 className="font-syne font-bold text-[16px]">🤝 Month 5 — Contract Extension</h2>
          {bothComplete ? (
            <span className="text-[12px] font-semibold text-eden-green-mid bg-eden-green-pale border border-eden-green/20 px-2.5 py-1 rounded-full">
              ✅ Conversation done
            </span>
          ) : inPhase2 ? (
            <span className="text-[12px] text-eden-grey">
              Day {p2Elapsed} of {P2_DAYS} · <span className="text-eden-orange font-semibold">{p2DaysLeft}d to talk</span>
            </span>
          ) : (
            <span className="text-[12px] text-eden-grey/60">Unlocks after Jun 16 review</span>
          )}
        </div>

        <div
          className="relative h-3 bg-eden-light rounded-full cursor-crosshair select-none"
          onMouseMove={makeMouseMove(P2_DAYS, d => `Day ${d} of ${P2_DAYS}`)}
          onMouseLeave={() => setTooltip(null)}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-eden-orange to-eden-orange-light transition-all duration-1000"
            style={{ width: `${p2Progress}%` }}
          />
          {P2_MILESTONES.map(m => {
            const pct    = ((m.date.getTime() - P1_END.getTime()) / (P2_END.getTime() - P1_END.getTime())) * 100
            const passed = today >= m.date
            return (
              <div key={m.label}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-eden-light z-10 ${passed ? 'bg-eden-orange' : 'bg-white'}`}
                style={{ left: `calc(${pct}% - 6px)` }}
              />
            )
          })}
          {inPhase2 && p2Progress > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-eden-orange shadow-md z-20 transition-all duration-1000"
              style={{ left: `calc(${p2Progress}% - 8px)` }}
            />
          )}
          {tooltip && (
            <div
              className="absolute -top-9 bg-eden-dark text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap -translate-x-1/2 z-30"
              style={{ left: `${tooltip.pct}%` }}
            >
              {tooltip.label}
            </div>
          )}
        </div>

        <div className="flex justify-between text-[11px] text-eden-grey">
          <span className={!inPhase1 ? 'text-eden-green font-medium' : ''}>Jun 16 — Review ✅</span>
          {P2_MILESTONES.map(m => (
            <span key={m.label} className={today >= m.date ? 'text-eden-orange font-medium' : ''}>
              {m.shortDate} — {m.label} {today >= m.date ? '✓' : ''}
            </span>
          ))}
          <span className={bothComplete ? 'text-eden-green font-semibold' : (inPhase2 ? 'text-eden-orange font-medium' : '')}>
            {bothComplete ? '✅ Aug 15 — Done' : 'Aug 15 ← Contract talk'}
          </span>
        </div>
      </div>

    </div>
  )
}
