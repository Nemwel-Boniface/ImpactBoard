'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV = [
  { label: 'Dashboard',      href: '/',              icon: '📊' },
  { label: 'Accomplishments',href: '/accomplishments',icon: '🏆' },
  { label: 'Import',         href: '/import',        icon: '📥' },
]

const TRACK_NAV = [
  { label: 'Company Objectives', href: '/objectives',   icon: '🎯' },
  { label: 'My KPIs',            href: '/kpis',         icon: '📈' },
  { label: '1:1 Meetings',       href: '/one-on-ones',  icon: '🤝' },
  { label: 'Reviews',            href: '/reviews',      icon: '📋' },
  { label: 'Handover',           href: '/handover',     icon: '🧳' },
]

const CATS = [
  { label: 'Core Backend',  href: '/accomplishments?cat=core',        icon: '⚙️',  badge: 'green' },
  { label: 'Integrations',  href: '/accomplishments?cat=integration',  icon: '🔗',  badge: 'blue' },
  { label: 'Side Quests',   href: '/accomplishments?cat=side',         icon: '🚀',  badge: 'orange' },
  { label: 'Leadership',    href: '/accomplishments?cat=leadership',   icon: '👥',  badge: 'purple' },
  { label: 'Infra',         href: '/accomplishments?cat=infra',        icon: '🛠',  badge: 'amber' },
]

const userName      = process.env.NEXT_PUBLIC_USER_NAME   ?? 'Nemwel Boniface'
const userRole      = process.env.NEXT_PUBLIC_USER_ROLE   ?? 'Backend Engineer'
const REVIEW_DATE   = new Date(process.env.NEXT_PUBLIC_REVIEW_DATE ?? '2026-06-16')
const CONTRACT_DATE = new Date('2026-08-15')

function daysUntil(target: Date) {
  return Math.ceil((target.getTime() - Date.now()) / 86400000)
}

export default function Sidebar() {
  const path            = usePathname()
  const daysToReview    = daysUntil(REVIEW_DATE)
  const daysToContract  = daysUntil(CONTRACT_DATE)
  const isPostReview    = daysToReview <= 0
  const isPostContract  = daysToContract <= 0

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-eden-dark flex flex-col z-50">

      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-eden-green-light to-eden-green flex items-center justify-center font-syne font-extrabold text-white text-base">
            B
          </div>
          <div>
            <div className="font-syne font-bold text-white text-[17px] leading-none">
              Impact<span className="text-eden-orange">Board</span>
            </div>
            <div className="text-[10px] text-eden-grey tracking-[1.5px] uppercase mt-0.5">
              Eden Care
            </div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-6 py-4 border-b border-white/[0.07]">
        <div className="font-syne font-semibold text-white text-sm">{userName}</div>
        <div className="text-[11px] text-eden-grey mt-0.5">{userRole} at Eden Care Medical</div>
        {!isPostReview ? (
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-eden-orange/15 border border-eden-orange/30 rounded-full px-2.5 py-1 text-[11px] text-eden-orange-light font-medium">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-eden-orange inline-block" />
            Review in {daysToReview} days
          </div>
        ) : isPostContract ? (
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-eden-green/15 border border-eden-green/30 rounded-full px-2.5 py-1 text-[11px] text-eden-green-mid font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-eden-green-mid inline-block" />
            Contract talk complete ✅
          </div>
        ) : (
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-eden-orange/15 border border-eden-orange/30 rounded-full px-2.5 py-1 text-[11px] text-eden-orange-light font-medium">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-eden-orange inline-block" />
            Contract talk in {daysToContract}d
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10px] tracking-[1.5px] uppercase text-eden-grey/70 font-medium px-3 py-2">
          Workspace
        </p>
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] transition-all',
              path === n.href
                ? 'bg-eden-green/20 text-eden-green-mid font-medium'
                : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
            )}
          >
            <span className="w-5 text-center">{n.icon}</span>
            {n.label}
          </Link>
        ))}

        <p className="text-[10px] tracking-[1.5px] uppercase text-eden-grey/70 font-medium px-3 pt-5 pb-2">
          Track
        </p>
        {TRACK_NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] transition-all',
              path === n.href
                ? 'bg-eden-green/20 text-eden-green-mid font-medium'
                : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
            )}
          >
            <span className="w-5 text-center">{n.icon}</span>
            {n.label}
          </Link>
        ))}

        <p className="text-[10px] tracking-[1.5px] uppercase text-eden-grey/70 font-medium px-3 pt-5 pb-2">
          Categories
        </p>
        {CATS.map(c => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-white/55 hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <span className="w-5 text-center">{c.icon}</span>
            {c.label}
          </Link>
        ))}
      </nav>

      {/* Export */}
      <div className="px-4 pb-6 pt-3 border-t border-white/[0.07]">
        <a
          href="/api/export?format=csv"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-eden-orange to-[#e06510] text-white font-syne font-semibold text-[13px] py-2.5 rounded-lg hover:shadow-[0_6px_20px_rgba(244,123,32,0.4)] hover:-translate-y-0.5 transition-all"
        >
          ↗ Export Report
        </a>
      </div>
    </aside>
  )
}
