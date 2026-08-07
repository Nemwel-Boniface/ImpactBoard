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
  kpiIds?: string[]        // IDs of KPIs this accomplishment contributes to
  objectiveIds?: string[]  // derived from kpiIds — which company objectives this surfaces to
  createdAt: string        // ISO timestamp
  updatedAt: string        // ISO timestamp
}

export type CreateAccomplishment = Omit<
  Accomplishment,
  'id' | 'createdAt' | 'updatedAt' | 'source'
> & { source?: 'manual' | 'import'; week?: string; kpiIds?: string[]; objectiveIds?: string[] }

export type UpdateAccomplishment = Partial<CreateAccomplishment>

// ── Company Objective ──────────────────────────────────────────
export interface CompanyObjective {
  id: string
  name: string
  description: string
  targetLabel: string
  balanceScoreCard: 'Financial' | 'Customer' | 'Internal Business Processes' | 'Learning and Growth' | string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

// ── Personal KPI ──────────────────────────────────────────────
export interface KPI {
  id: string
  objectiveId: string
  title: string
  description: string
  weight: number
  balanceScoreCard: 'Financial' | 'Customer' | 'Internal Business Processes' | 'Learning and Growth' | string
  keyMetrics: string
  quarter: string
  active: boolean
  createdAt: string
  updatedAt: string
}

// ── 1:1 Meeting ───────────────────────────────────────────────
export interface FollowUpItem {
  id: string
  text: string
  dueDate?: string
  completed: boolean
  completedAt?: string
}

export interface OneOnOne {
  id: string
  scheduledDate: string
  scheduledTime: string
  withName: string
  withRole?: string
  agenda?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  followUpItems: FollowUpItem[]
  linkedKpiIds: string[]
  linkedAccomplishmentIds: string[]
  createdAt: string
  updatedAt: string
}

// ── Performance Review ────────────────────────────────────────
export interface ImprovementArea {
  id: string
  area: string
  description?: string
  targetDate?: string
  resolved: boolean
}

export interface PerformanceReview {
  id: string
  title: string
  scheduledDate: string
  status: 'upcoming' | 'completed'
  completedDate?: string
  attendees: string[]
  notes?: string
  improvementAreas: ImprovementArea[]
  linkedKpiIds: string[]
  linkedAccomplishmentIds: string[]
  createdAt: string
  updatedAt: string
}

// ── Team Member (handover contact) ─────────────────────────────
export interface Member {
  id: string
  name: string
  role?: string
  email?: string
  createdAt: string
  updatedAt: string
}

export type CreateMember = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>

// ── Handover ────────────────────────────────────────────────────
export type HandoverItemPriority = 'high' | 'medium' | 'low'
export type HandoverItemStatus = 'pending' | 'in_progress' | 'done'
export type HandoverStatus = 'active' | 'ended'

export interface HandoverItem {
  id: string
  title: string
  context: string              // background/notes the successor needs
  priority: HandoverItemPriority
  status: HandoverItemStatus
  assigneeMemberId: string | null  // null = with me
  linkedKpiIds?: string[]
  linkedAccomplishmentIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface Handover {
  id: string
  title: string
  reason?: string
  startDate: string
  endDate: string
  status: HandoverStatus
  memberIds: string[]
  items: HandoverItem[]
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export type CreateHandover = {
  title: string
  reason?: string
  startDate: string
  endDate: string
  memberIds?: string[]
  items?: HandoverItem[]
}

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
