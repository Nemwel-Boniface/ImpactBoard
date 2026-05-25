import type { Category, Accomplishment } from '@/types'

export const CATEGORIES: Category[] = [
  { slug: 'core',        name: 'Core Backend',  icon: '⚙️',  color: 'green',  weight: 2.0, builtIn: true },
  { slug: 'integration', name: 'Integrations',  icon: '🔗',  color: 'blue',   weight: 1.5, builtIn: true },
  { slug: 'side',        name: 'Side Quests',   icon: '🚀',  color: 'orange', weight: 1.2, builtIn: true },
  { slug: 'leadership',  name: 'Leadership',    icon: '👥',  color: 'purple', weight: 1.8, builtIn: true },
  { slug: 'infra',       name: 'Infra / DevOps',icon: '🛠',  color: 'amber',  weight: 1.0, builtIn: true },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.slug, c])
) as Record<string, Category>

export const IMPACT_WEIGHTS: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Weighted impact score 0–100.
 * Score = Σ(impactWeight × categoryWeight) / maxPossible × 100
 */
export function calcImpactScore(items: Accomplishment[]): number {
  if (!items.length) return 0

  const score = items.reduce((sum, item) => {
    const catWeight = CATEGORY_MAP[item.category]?.weight ?? 1.0
    const impactWeight = IMPACT_WEIGHTS[item.impact] ?? 1
    return sum + impactWeight * catWeight
  }, 0)

  // Max possible: every item is high impact in highest-weight category (core = 2.0)
  const maxScore = items.length * IMPACT_WEIGHTS.high * 2.0

  return Math.min(100, Math.round((score / maxScore) * 100))
}

/**
 * Auto-generate the opening review statement from real data.
 */
export function generateOpeningStatement(
  items: Accomplishment[],
  userName: string
): string {
  const total = items.length
  const core = items.filter(i => i.category === 'core').length
  const integrations = items.filter(i => i.category === 'integration').length
  const sideQuests = items.filter(i => i.category === 'side').length
  const score = calcImpactScore(items)

  const topItem = items
    .filter(i => i.featured)
    .sort((a, b) => IMPACT_WEIGHTS[b.impact] - IMPACT_WEIGHTS[a.impact])[0]
    ?? items[0]

  const topMetric = topItem?.metrics?.[0] ?? ''
  const topTitle = topItem?.title ?? 'key deliverables'

  return `In my first 3 months at Eden Care, I shipped ${core} core backend feature${core !== 1 ? 's' : ''}, ` +
    `integrated ${integrations} external API${integrations !== 1 ? 's' : ''}, ` +
    `and took on ${sideQuests} side quest${sideQuests !== 1 ? 's' : ''} beyond my defined scope — ` +
    (topMetric ? `including ${topTitle} which delivered ${topMetric}. ` : `including ${topTitle}. `) +
    `Across ${total} logged accomplishments, my weighted impact score is ${score}/100.`
}
