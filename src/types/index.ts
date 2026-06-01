// ─── Accomplishment ────────────────────────────────────────
export type ImpactLevel = 'high' | 'medium' | 'low'

export type CategorySlug =
  | 'core'
  | 'integration'
  | 'side'
  | 'leadership'
  | 'infra'
  | string // custom categories

export interface Accomplishment {
  id: string
  title: string
  category: CategorySlug
  description: string
  impact: ImpactLevel
  metrics: string[]        // up to 3 key numbers / phrases
  date: string             // ISO date string e.g. "2026-05-15"
  featured: boolean
  week?: string            // e.g. "Week 14" — optional, populated from Excel import or manual entry
  source: 'manual' | 'import'
  createdAt: string        // ISO timestamp
  updatedAt: string        // ISO timestamp
}

export type CreateAccomplishment = Omit<
  Accomplishment,
  'id' | 'createdAt' | 'updatedAt' | 'source'
> & { source?: 'manual' | 'import'; week?: string }

export type UpdateAccomplishment = Partial<CreateAccomplishment>

// ─── Category ──────────────────────────────────────────────
export interface Category {
  slug: CategorySlug
  name: string
  icon: string
  color: string            // tailwind color class suffix
  weight: number           // for impact score calculation
  builtIn: boolean
}

// ─── Dashboard ─────────────────────────────────────────────
export interface DashboardStats {
  total: number
  byCategory: Record<CategorySlug, number>
  byImpact: { high: number; medium: number; low: number }
  featured: number
  impactScore: number      // 0–100 weighted score
  meetingsTotal: number
  meetingsLed: number
  daysUntilReview: number
}

export interface ReviewPrep {
  openingStatement: string
  topItems: Accomplishment[]
  statsGrid: StatCell[]
}

export interface StatCell {
  label: string
  value: string
  color: 'green' | 'orange'
}

// ─── API Responses ─────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
}
