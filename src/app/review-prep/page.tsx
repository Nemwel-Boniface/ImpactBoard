import { getAllAccomplishments, getDashboardStats } from '@/lib/kv'
import { generateOpeningStatement, CATEGORIES } from '@/lib/categories'
import { Card } from '@/components/ui'
import { CategoryBadge, ImpactIndicator } from '@/components/ui'
import CopyButton from './CopyButton'
import PrintButton from './PrintButton'
import Link from 'next/link'

export const revalidate = 60

export default async function ReviewPrepPage() {
  let items, stats
  try {
    ;[items, stats] = await Promise.all([
      getAllAccomplishments(),
      getDashboardStats(),
    ])
  } catch {
    return (
      <div className="p-9 max-w-[800px]">
        <div className="bg-red-50 border border-red-200 rounded-card p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-syne font-bold text-[18px] text-red-700 mb-2">Could not load review data</h2>
          <p className="text-[13px] text-red-500">Check that your Redis credentials are configured, then refresh.</p>
        </div>
      </div>
    )
  }

  const userName  = process.env.NEXT_PUBLIC_USER_NAME  ?? 'You'
  const statement = generateOpeningStatement(items, userName)

  const topItems = [
    ...items.filter(i => i.featured),
    ...items.filter(i => !i.featured),
  ]
    .sort((a, b) => {
      const w = { high: 3, medium: 2, low: 1 }
      return w[b.impact] - w[a.impact]
    })
    .slice(0, 3)

  const statsGrid = [
    { label: 'Logged Wins',         value: String(stats.total),                     color: 'green' as const },
    { label: 'High-Impact Items',   value: String(stats.byImpact.high),             color: 'green' as const },
    { label: 'Meetings Led',        value: String(stats.meetingsLed),               color: 'orange' as const },
    { label: 'Side Quests',         value: String(stats.byCategory['side'] ?? 0),   color: 'orange' as const },
    { label: 'Integrations Built',  value: String(stats.byCategory['integration'] ?? 0), color: 'green' as const },
    { label: 'Impact Score /100',   value: String(stats.impactScore),               color: 'green' as const },
  ]

  if (items.length === 0) {
    return (
      <div className="p-9 max-w-[800px]">
        <div className="bg-gradient-to-br from-eden-green to-eden-dark rounded-card p-7 mb-6 text-white">
          <h1 className="font-syne font-extrabold text-[26px] mb-2">📋 Performance Review Prep</h1>
          <p className="text-[14px] opacity-80">Your structured narrative will appear here once you log accomplishments.</p>
        </div>
        <Card className="p-10 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="font-syne font-bold text-[20px] text-eden-dark mb-2">Nothing to prep yet</h2>
          <p className="text-[14px] text-eden-grey mb-6 max-w-[380px] mx-auto">
            Add your wins to the accomplishments log and your review narrative will be auto-generated here.
          </p>
          <Link
            href="/accomplishments"
            className="inline-flex items-center gap-2 bg-eden-green text-white font-syne font-semibold text-[13px] px-5 py-2.5 rounded-lg hover:bg-eden-green-light transition-all"
          >
            + Log your first accomplishment
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-9 max-w-[800px]">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-eden-green to-eden-dark rounded-card p-7 mb-6 text-white">
        <h1 className="font-syne font-extrabold text-[26px] mb-2">📋 Performance Review Prep</h1>
        <p className="text-[14px] opacity-80 mb-5">
          Your structured narrative for the meeting. Everything auto-generated from your logged accomplishments.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white/15 rounded-lg px-4 py-2 text-[13px]">📅 Review in {stats.daysUntilReview} days</div>
          <div className="bg-white/15 rounded-lg px-4 py-2 text-[13px]">🏆 {stats.total} accomplishments logged</div>
          <div className="bg-white/15 rounded-lg px-4 py-2 text-[13px]">⭐ {stats.impactScore}/100 impact score</div>
        </div>
      </div>

      {/* Opening statement */}
      <Card className="p-6 mb-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-syne font-bold text-[16px] text-eden-green">🎯 Opening Statement</h2>
            <p className="text-[12px] text-eden-grey mt-0.5">30-second intro — memorise or read directly</p>
          </div>
          <CopyButton text={statement} />
        </div>
        <div className="bg-eden-green-pale border-l-[3px] border-eden-green px-5 py-4 rounded-lg text-[14px] text-eden-dark leading-relaxed">
          {statement}
        </div>
      </Card>

      {/* Top 3 */}
      <Card className="p-6 mb-5">
        <div className="mb-5">
          <h2 className="font-syne font-bold text-[16px]">🔑 Top 3 Talking Points</h2>
          <p className="text-[12px] text-eden-grey mt-0.5">
            Auto-selected from your featured + highest-impact items
          </p>
        </div>
        <div className="space-y-3">
          {topItems.length === 0 && (
            <p className="text-[13px] text-eden-grey py-4 text-center">No items yet — add accomplishments to populate this section.</p>
          )}
          {topItems.map((item, i) => (
            <div
              key={item.id}
              className={`border-[1.5px] rounded-xl p-4 ${
                i === 0 ? 'border-eden-green bg-eden-green-pale/30'
                : i === 1 ? 'border-eden-orange bg-eden-orange-pale/30'
                : 'border-eden-green/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-bold text-white px-3 py-0.5 rounded-full ${
                  i === 0 ? 'bg-eden-green' : i === 1 ? 'bg-eden-orange' : 'bg-eden-grey'
                }`}>
                  {['1st', '2nd', '3rd'][i]}
                </span>
                <span className="font-syne font-bold text-[14px]">{item.title}</span>
              </div>
              <p className="text-[13px] text-eden-grey leading-relaxed">{item.description}</p>
              {item.metrics.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {item.metrics.map((m, j) => (
                    <span key={j} className="text-[11px] bg-white/70 border border-eden-green/15 rounded-lg px-2.5 py-1 font-semibold text-eden-green">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Stats grid */}
      <Card className="p-6 mb-5">
        <h2 className="font-syne font-bold text-[16px] mb-5">📊 Numbers At A Glance</h2>
        <div className="grid grid-cols-3 gap-3">
          {statsGrid.map(s => (
            <div
              key={s.label}
              className={`text-center p-4 rounded-xl ${
                s.color === 'orange' ? 'bg-eden-orange-pale' : 'bg-eden-green-pale'
              }`}
            >
              <div className={`font-syne font-extrabold text-[28px] ${
                s.color === 'orange' ? 'text-eden-orange' : 'text-eden-green'
              }`}>
                {s.value}
              </div>
              <div className="text-[11px] text-eden-grey mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <a
            href="/api/export?format=csv"
            className="flex-1 flex items-center justify-center gap-2 bg-eden-green text-white font-syne font-semibold text-[13px] py-2.5 rounded-lg hover:bg-eden-green-light transition-all hover:-translate-y-0.5"
          >
            ↗ Export CSV
          </a>
          <a
            href="/api/export?format=json"
            className="flex-1 flex items-center justify-center gap-2 border-[1.5px] border-eden-green text-eden-green font-syne font-semibold text-[13px] py-2.5 rounded-lg hover:bg-eden-green-pale transition-all"
          >
            ↗ Export JSON
          </a>
          <PrintButton />
        </div>
      </Card>

    </div>
  )
}
