import { getDashboardStats, getAllAccomplishments } from '@/lib/kv'
import { generateOpeningStatement, CATEGORIES, calcImpactScore } from '@/lib/categories'
import { StatCard, Card, SectionHeader } from '@/components/ui'
import Link from 'next/link'

export const revalidate = 60  // ISR: revalidate every 60s

export default async function DashboardPage() {
  const [stats, items] = await Promise.all([
    getDashboardStats(),
    getAllAccomplishments(),
  ])

  const userName   = process.env.NEXT_PUBLIC_USER_NAME   ?? 'You'
  const reviewDate = process.env.NEXT_PUBLIC_REVIEW_DATE ?? '2025-06-15'
  const startDate  = new Date(Date.now() - 70 * 86400000) // ~10 weeks ago
  const totalDays  = Math.ceil((new Date(reviewDate).getTime() - startDate.getTime()) / 86400000)
  const elapsedDays = totalDays - stats.daysUntilReview
  const progress   = Math.round((elapsedDays / totalDays) * 100)

  const statement  = generateOpeningStatement(items, userName)

  const catCounts = CATEGORIES.map(c => ({
    ...c,
    count: stats.byCategory[c.slug] ?? 0,
  }))

  const maxCatCount = Math.max(...catCounts.map(c => c.count), 1)

  return (
    <div className="p-9">

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4 mb-7">
        <StatCard
          label="Total Accomplishments"
          value={stats.total}
          sub={`Across ${CATEGORIES.length} categories`}
          trend="↑ Growing"
        />
        <StatCard
          label="Meetings Led"
          value={stats.meetingsLed}
          sub={`of ${stats.meetingsTotal} total`}
          trend={`${Math.round((stats.meetingsLed / stats.meetingsTotal) * 100)}% rate`}
        />
        <StatCard
          label="Side Quests"
          value={stats.byCategory['side'] ?? 0}
          sub="Beyond job description"
          trend="↑ High impact"
          accent="orange"
        />
        <StatCard
          label="Integrations Built"
          value={stats.byCategory['integration'] ?? 0}
          sub="APIs connected"
          trend="100% functional"
        />
        <StatCard
          label="Impact Score"
          value={stats.impactScore}
          sub="Weighted score /100"
          trend="↑ Top quartile"
        />
      </div>

      {/* 90-day progress */}
      <Card className="p-6 mb-7">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-syne font-bold text-[16px]">🗓 90-Day Journey</h2>
          <span className="text-[12px] text-eden-grey">Review in {stats.daysUntilReview} days</span>
        </div>
        <div className="h-2 bg-eden-light rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-eden-green to-eden-green-mid rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-eden-grey">
          <span>Day 1 — Joined</span>
          <span>Month 1 ✓</span>
          <span>Month 2 ✓</span>
          <span>← Review</span>
        </div>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5 mb-7">

        {/* Category bar chart */}
        <Card className="p-6">
          <SectionHeader title="Category Breakdown" />
          <div className="flex items-end gap-3 h-[130px] mt-5">
            {catCounts.map(c => (
              <div key={c.slug} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ${
                    c.slug === 'side' || c.slug === 'infra'
                      ? 'bg-gradient-to-b from-eden-orange-light to-eden-orange'
                      : 'bg-gradient-to-b from-eden-green-mid to-eden-green'
                  }`}
                  style={{ height: `${Math.max((c.count / maxCatCount) * 110, 8)}px` }}
                  title={`${c.count} items`}
                />
                <span className="text-[10px] text-eden-grey text-center leading-tight">
                  {c.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Impact distribution */}
        <Card className="p-6">
          <SectionHeader title="Impact Distribution" />
          <div className="space-y-4 mt-5">
            {[
              { label: '🟢 High Impact',  count: stats.byImpact.high,   color: 'bg-eden-green',  textColor: 'text-eden-green' },
              { label: '🟠 Medium',        count: stats.byImpact.medium, color: 'bg-eden-orange', textColor: 'text-eden-orange' },
              { label: '⚪ Steady Work',   count: stats.byImpact.low,    color: 'bg-slate-300',   textColor: 'text-slate-500' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className={`font-semibold ${row.textColor}`}>{row.label}</span>
                  <span className="font-bold text-eden-dark">
                    {row.count} items — {stats.total ? Math.round((row.count / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2.5 bg-eden-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.color} transition-all duration-700`}
                    style={{ width: `${stats.total ? (row.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-4 p-3.5 bg-eden-green-pale rounded-xl border-l-[3px] border-eden-green">
              <p className="font-syne font-bold text-[13px] text-eden-green">
                ⭐ Weighted Score: {stats.impactScore}/100
              </p>
              <p className="text-[11px] text-eden-grey mt-0.5">
                Core ×2 · Leadership ×1.8 · Integrations ×1.5 · Side ×1.2
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Opening statement preview */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-syne font-bold text-[16px]">🎯 Auto-Generated Opening Statement</h2>
          <Link
            href="/review-prep"
            className="text-[12px] text-eden-green font-semibold hover:underline"
          >
            Full Review Prep →
          </Link>
        </div>
        <div className="bg-eden-green-pale border-l-[3px] border-eden-green px-4 py-3.5 rounded-lg text-[14px] text-eden-dark leading-relaxed">
          {statement || 'Add your first accomplishment to generate your opening statement.'}
        </div>
      </Card>

    </div>
  )
}
