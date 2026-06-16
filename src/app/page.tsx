import { getDashboardStats, getAllAccomplishments, getAllKPIs, getAllOneOnOnes, getAllReviews } from '@/lib/kv'
import { generateOpeningStatement, CATEGORIES, calcImpactScore } from '@/lib/categories'
import { StatCard, Card, SectionHeader } from '@/components/ui'
import JourneyProgress from '@/components/JourneyProgress'
import Link from 'next/link'

export const revalidate = 60  // ISR: revalidate every 60s

export default async function DashboardPage() {
  const [stats, items, kpis, oneOnOnes, reviews] = await Promise.all([
    getDashboardStats(),
    getAllAccomplishments(),
    getAllKPIs(),
    getAllOneOnOnes(),
    getAllReviews(),
  ])

  const userName  = process.env.NEXT_PUBLIC_USER_NAME ?? 'Nemwel Boniface'
  const statement = generateOpeningStatement(items, userName)

  const catCounts = CATEGORIES.map(c => ({
    ...c,
    count: stats.byCategory[c.slug] ?? 0,
  }))

  const maxCatCount = Math.max(...catCounts.map(c => c.count), 1)

  // KPI progress — count accomplishments linked to each KPI
  const kpiProgress = kpis.map(kpi => ({
    ...kpi,
    accomplishmentCount: items.filter(a => a.kpiIds?.includes(kpi.id)).length,
  }))
  const maxKpiCount = Math.max(...kpiProgress.map(k => k.accomplishmentCount), 1)

  // Upcoming 1:1 within 7 days
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const upcomingMeeting = oneOnOnes
    .filter(m => m.status === 'scheduled')
    .map(m => {
      const target = new Date(m.scheduledDate)
      target.setHours(0, 0, 0, 0)
      const days = Math.ceil((target.getTime() - now.getTime()) / 86400000)
      return { ...m, days }
    })
    .filter(m => m.days >= 0 && m.days <= 7)
    .sort((a, b) => a.days - b.days)[0]

  // Next upcoming review
  const nextReview = reviews
    .filter(r => r.status === 'upcoming')
    .map(r => {
      const target = new Date(r.scheduledDate)
      target.setHours(0, 0, 0, 0)
      const days = Math.ceil((target.getTime() - now.getTime()) / 86400000)
      return { ...r, days }
    })
    .sort((a, b) => a.days - b.days)[0]

  return (
    <div className="p-9">

      {/* Upcoming 1:1 banner */}
      {upcomingMeeting && (
        <Link href="/one-on-ones">
          <div className="mb-5 flex items-center gap-3 bg-eden-orange-pale border border-eden-orange/30 rounded-xl px-5 py-3 hover:bg-eden-orange/10 transition-all cursor-pointer">
            <span className="text-xl">📅</span>
            <span className="text-[13px] font-semibold text-eden-orange">
              1:1 with {upcomingMeeting.withName}
              {upcomingMeeting.days === 0 ? ' — Today!' : ` in ${upcomingMeeting.days} day${upcomingMeeting.days !== 1 ? 's' : ''}`}
              {' · '}{upcomingMeeting.scheduledDate}
            </span>
            <span className="ml-auto text-[12px] text-eden-orange font-medium">View →</span>
          </div>
        </Link>
      )}

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
        <JourneyProgress />
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

      {/* KPI Progress + Review countdown side by side */}
      <div className="grid grid-cols-3 gap-5 mb-7">

        {/* KPI Progress Panel — spans 2 cols */}
        <Card className="p-6 col-span-2">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader title="📈 KPI Progress" />
            <Link href="/kpis" className="text-[12px] text-eden-green font-semibold hover:underline">
              View KPIs →
            </Link>
          </div>
          {kpiProgress.length === 0 ? (
            <p className="text-[13px] text-eden-grey">
              No KPIs yet. <Link href="/api/seed?key=bragboard-seed-2026" className="text-eden-green font-semibold hover:underline">Run seed</Link> to load them.
            </p>
          ) : (
            <div className="space-y-4">
              {kpiProgress.map(kpi => (
                <Link key={kpi.id} href="/kpis" className="block group">
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-eden-dark group-hover:text-eden-green transition-colors">
                      {kpi.title}
                      <span className="ml-2 font-normal text-eden-grey">({kpi.weight}%)</span>
                    </span>
                    <span className="text-eden-grey">
                      {kpi.accomplishmentCount} accomplishment{kpi.accomplishmentCount !== 1 ? 's' : ''} linked
                    </span>
                  </div>
                  <div className="h-2.5 bg-eden-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-eden-green to-eden-green-mid transition-all duration-700"
                      style={{ width: `${maxKpiCount > 0 ? (kpi.accomplishmentCount / maxKpiCount) * 100 : 0}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Next Review countdown */}
        <Card className="p-6" accent="orange">
          <h2 className="font-syne font-bold text-[15px] text-eden-dark mb-4">📋 Next Review</h2>
          {nextReview ? (
            <Link href="/reviews" className="block">
              <p className="font-syne font-bold text-[17px] text-eden-dark mb-1">{nextReview.title}</p>
              <p className="text-[13px] text-eden-grey mb-3">
                {new Date(nextReview.scheduledDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${
                nextReview.days <= 7
                  ? 'bg-eden-orange-pale text-eden-orange'
                  : 'bg-eden-light text-eden-grey'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                {nextReview.days === 0 ? 'Today!' : nextReview.days < 0 ? 'Overdue' : `${nextReview.days} days away`}
              </div>
              <p className="text-[12px] text-eden-green font-semibold mt-3 hover:underline">
                View Reviews →
              </p>
            </Link>
          ) : (
            <div className="text-center py-4">
              <p className="text-[13px] text-eden-grey mb-3">No upcoming reviews</p>
              <Link href="/reviews" className="text-[12px] text-eden-green font-semibold hover:underline">
                Add a review date →
              </Link>
            </div>
          )}
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
