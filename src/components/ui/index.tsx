import clsx from 'clsx'

// ── Card ──────────────────────────────────────────────────────
export function Card({
  children,
  className,
  accent = 'green',
}: {
  children: React.ReactNode
  className?: string
  accent?: 'green' | 'orange' | 'none'
}) {
  return (
    <div
      className={clsx(
        'bg-white rounded-card shadow-card border border-eden-green/[0.07] relative overflow-hidden card-lift',
        className
      )}
    >
      {accent !== 'none' && (
        <div
          className={clsx(
            'absolute bottom-0 left-0 right-0 h-[3px]',
            accent === 'green'
              ? 'bg-gradient-to-r from-eden-green to-eden-green-mid'
              : 'bg-gradient-to-r from-eden-orange to-eden-orange-light'
          )}
        />
      )}
      {children}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  trend,
  accent = 'green',
}: {
  label: string
  value: string | number
  sub?: string
  trend?: string
  accent?: 'green' | 'orange'
}) {
  return (
    <Card accent={accent} className="p-5">
      <p className="text-[11px] uppercase tracking-[1px] text-eden-grey font-medium mb-2">
        {label}
      </p>
      <p
        className={clsx(
          'font-syne font-extrabold text-[32px] leading-none',
          accent === 'orange' ? 'text-eden-orange' : 'text-eden-dark'
        )}
      >
        {value}
      </p>
      {sub   && <p className="text-[11px] text-eden-grey mt-1">{sub}</p>}
      {trend && (
        <span
          className={clsx(
            'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1.5',
            accent === 'orange'
              ? 'bg-eden-orange-pale text-eden-orange'
              : 'bg-eden-green-pale text-eden-green'
          )}
        >
          {trend}
        </span>
      )}
    </Card>
  )
}

// ── Category Badge ────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  core:        'bg-eden-green-pale text-eden-green',
  integration: 'bg-blue-50 text-blue-700',
  side:        'bg-eden-orange-pale text-eden-orange',
  leadership:  'bg-purple-50 text-purple-700',
  infra:       'bg-amber-50 text-amber-700',
}

const CAT_LABELS: Record<string, string> = {
  core: '⚙️ Core Backend',
  integration: '🔗 Integration',
  side: '🚀 Side Quest',
  leadership: '👥 Leadership',
  infra: '🛠 Infra',
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={clsx(
        'text-[10px] font-bold tracking-[1px] uppercase px-2.5 py-1 rounded-full',
        BADGE_STYLES[category] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {CAT_LABELS[category] ?? category}
    </span>
  )
}

// ── Impact Dot ────────────────────────────────────────────────
export function ImpactIndicator({ impact }: { impact: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    high:   { dot: 'bg-eden-green',  label: 'High Impact' },
    medium: { dot: 'bg-eden-orange', label: 'Medium' },
    low:    { dot: 'bg-slate-300',   label: 'Steady' },
  }
  const { dot, label } = map[impact] ?? map.low
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-eden-grey">
      <div className={clsx('w-2 h-2 rounded-full', dot)} />
      {label}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: {
  children: React.ReactNode
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'font-syne font-semibold rounded-lg flex items-center gap-1.5 transition-all',
        size === 'sm' ? 'text-[12px] px-3 py-1.5' : 'text-[13px] px-4 py-2.5',
        variant === 'primary'  && 'bg-eden-green text-white hover:bg-eden-green-light hover:-translate-y-0.5 hover:shadow-card',
        variant === 'outline'  && 'border-[1.5px] border-eden-green text-eden-green hover:bg-eden-green-pale',
        variant === 'ghost'    && 'text-eden-grey hover:bg-eden-light hover:text-eden-dark',
        variant === 'danger'   && 'text-red-500 hover:bg-red-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Section Header ────────────────────────────────────────────
export function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-syne font-bold text-[18px] text-eden-dark">{title}</h2>
      {action}
    </div>
  )
}
