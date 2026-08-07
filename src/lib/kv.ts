/**
 * lib/kv.ts
 * All Upstash Redis operations for BragBoard.
 *
 * Key schema:
 *   accomplishments:list          → string[]   (ordered list of IDs)
 *   accomplishments:item:{id}     → Accomplishment
 *   meta:stats                    → cached DashboardStats (TTL 60s)
 */

import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'
import type {
  Accomplishment,
  CreateAccomplishment,
  UpdateAccomplishment,
  DashboardStats,
  CategorySlug,
  CompanyObjective,
  KPI,
  OneOnOne,
  PerformanceReview,
  Member,
  CreateMember,
  Handover,
  CreateHandover,
} from '@/types'
import { CATEGORIES, calcImpactScore } from './categories'

// Vercel KV uses KV_REST_API_URL / KV_REST_API_TOKEN (auto-injected when linked).
// Fall back to UPSTASH_* names for self-hosted setups.
const kvUrl   = process.env.KV_REST_API_URL   ?? process.env.UPSTASH_REDIS_REST_URL   ?? ''
const kvToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

const isConfigured =
  kvUrl.startsWith('https://') && kvToken.length > 0

const kv = isConfigured
  ? new Redis({ url: kvUrl, token: kvToken })
  : null as unknown as Redis

const LIST_KEY = 'accomplishments:list'
const itemKey = (id: string) => `accomplishments:item:${id}`
const STATS_KEY = 'meta:stats'

// ── READ ──────────────────────────────────────────────────────

export async function getAllAccomplishments(): Promise<Accomplishment[]> {
  if (!isConfigured) return []
  const ids = await kv.lrange<string>(LIST_KEY, 0, -1)
  if (!ids || ids.length === 0) return []

  const pipeline = kv.pipeline()
  ids.forEach(id => pipeline.get(itemKey(id)))
  const results = await pipeline.exec()

  return (results as (Accomplishment | null)[])
    .filter((r): r is Accomplishment => r !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getAccomplishment(id: string): Promise<Accomplishment | null> {
  if (!isConfigured) return null
  return kv.get<Accomplishment>(itemKey(id))
}

export async function getAccomplishmentsByCategory(
  category: CategorySlug
): Promise<Accomplishment[]> {
  const all = await getAllAccomplishments()
  return all.filter(a => a.category === category)
}

// ── WRITE ─────────────────────────────────────────────────────

export async function createAccomplishment(
  data: CreateAccomplishment
): Promise<Accomplishment> {
  if (!isConfigured) throw new Error('Redis not configured')
  const now = new Date().toISOString()
  const item: Accomplishment = {
    ...data,
    id: uuidv4(),
    source: data.source ?? 'manual',
    metrics: data.metrics.slice(0, 3),
    createdAt: now,
    updatedAt: now,
  }

  await kv.pipeline()
    .set(itemKey(item.id), item)
    .lpush(LIST_KEY, item.id)
    .del(STATS_KEY)
    .exec()

  return item
}

export async function updateAccomplishment(
  id: string,
  data: UpdateAccomplishment
): Promise<Accomplishment | null> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getAccomplishment(id)
  if (!existing) return null

  const updated: Accomplishment = {
    ...existing,
    ...data,
    metrics: (data.metrics ?? existing.metrics).slice(0, 3),
    id,
    updatedAt: new Date().toISOString(),
  }

  await kv.pipeline()
    .set(itemKey(id), updated)
    .del(STATS_KEY)
    .exec()

  return updated
}

export async function deleteAccomplishment(id: string): Promise<boolean> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getAccomplishment(id)
  if (!existing) return false

  await kv.pipeline()
    .del(itemKey(id))
    .lrem(LIST_KEY, 0, id)
    .del(STATS_KEY)
    .exec()

  return true
}

export async function toggleFeatured(id: string): Promise<Accomplishment | null> {
  const item = await getAccomplishment(id)
  if (!item) return null
  return updateAccomplishment(id, { featured: !item.featured })
}

// ── BULK IMPORT ───────────────────────────────────────────────

export async function bulkCreateAccomplishments(
  items: CreateAccomplishment[]
): Promise<{ created: number; skipped: number }> {
  if (!isConfigured) throw new Error('Redis not configured')
  const all = await getAllAccomplishments()
  const existingTitles = new Set(all.map(a => a.title.toLowerCase().trim()))

  let created = 0
  let skipped = 0

  for (const item of items) {
    const key = item.title.toLowerCase().trim()
    if (existingTitles.has(key)) {
      skipped++
      continue
    }
    await createAccomplishment({ ...item, source: 'import' })
    existingTitles.add(key)
    created++
  }

  return { created, skipped }
}

// ── STATS ─────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  // Try cache first
  const cached = isConfigured ? await kv.get<DashboardStats>(STATS_KEY) : null
  if (cached) return cached

  const all = await getAllAccomplishments()

  const byCategory: Record<string, number> = {}
  const byImpact = { high: 0, medium: 0, low: 0 }
  let featured = 0

  for (const item of all) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1
    byImpact[item.impact] = (byImpact[item.impact] ?? 0) + 1
    if (item.featured) featured++
  }

  const reviewDate = new Date(process.env.NEXT_PUBLIC_REVIEW_DATE ?? '2026-06-16')
  const daysUntilReview = Math.max(
    0,
    Math.ceil((reviewDate.getTime() - Date.now()) / 86400000)
  )

  const stats: DashboardStats = {
    total: all.length,
    byCategory,
    byImpact,
    featured,
    impactScore: calcImpactScore(all),
    meetingsTotal: 14,
    meetingsLed: 6,
    daysUntilReview,
  }

  if (isConfigured) await kv.set(STATS_KEY, stats, { ex: 60 })
  return stats
}

// ── EXPORT ────────────────────────────────────────────────────

export async function exportAllAsJSON(): Promise<string> {
  const all = await getAllAccomplishments()
  return JSON.stringify(all, null, 2)
}

export async function exportAllAsCSV(): Promise<string> {
  const all = await getAllAccomplishments()
  const header = 'id,title,category,description,impact,metric_1,metric_2,metric_3,date,featured,createdAt'
  const rows = all.map(a =>
    [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      a.category,
      `"${(a.description ?? '').replace(/"/g, '""')}"`,
      a.impact,
      `"${a.metrics[0] ?? ''}"`,
      `"${a.metrics[1] ?? ''}"`,
      `"${a.metrics[2] ?? ''}"`,
      a.date,
      a.featured,
      a.createdAt,
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

// ── COMPANY OBJECTIVES ────────────────────────────────────────

const OBJ_LIST = 'company-objectives:list'
const objKey   = (id: string) => `company-objectives:item:${id}`

export async function getAllObjectives(): Promise<CompanyObjective[]> {
  if (!isConfigured) return []
  const ids = await kv.lrange<string>(OBJ_LIST, 0, -1)
  if (!ids || ids.length === 0) return []
  const pipeline = kv.pipeline()
  ids.forEach(id => pipeline.get(objKey(id)))
  const results = await pipeline.exec()
  return (results as (CompanyObjective | null)[])
    .filter((r): r is CompanyObjective => r !== null)
    .sort((a, b) => a.order - b.order)
}

export async function getObjective(id: string): Promise<CompanyObjective | null> {
  if (!isConfigured) return null
  return kv.get<CompanyObjective>(objKey(id))
}

export async function createObjective(
  data: Omit<CompanyObjective, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CompanyObjective> {
  if (!isConfigured) throw new Error('Redis not configured')
  const now = new Date().toISOString()
  const item: CompanyObjective = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
  await kv.pipeline().set(objKey(item.id), item).lpush(OBJ_LIST, item.id).exec()
  return item
}

export async function updateObjective(
  id: string,
  data: Partial<CompanyObjective>
): Promise<CompanyObjective | null> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getObjective(id)
  if (!existing) return null
  const updated: CompanyObjective = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  await kv.set(objKey(id), updated)
  return updated
}

export async function deleteObjective(id: string): Promise<boolean> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getObjective(id)
  if (!existing) return false
  await kv.pipeline().del(objKey(id)).lrem(OBJ_LIST, 0, id).exec()
  return true
}

// ── KPIs ──────────────────────────────────────────────────────

const KPI_LIST = 'kpis:list'
const kpiKey   = (id: string) => `kpis:item:${id}`

export async function getAllKPIs(): Promise<KPI[]> {
  if (!isConfigured) return []
  const ids = await kv.lrange<string>(KPI_LIST, 0, -1)
  if (!ids || ids.length === 0) return []
  const pipeline = kv.pipeline()
  ids.forEach(id => pipeline.get(kpiKey(id)))
  const results = await pipeline.exec()
  return (results as (KPI | null)[])
    .filter((r): r is KPI => r !== null)
    .sort((a, b) => b.weight - a.weight)
}

export async function getKPI(id: string): Promise<KPI | null> {
  if (!isConfigured) return null
  return kv.get<KPI>(kpiKey(id))
}

export async function getKPIsByObjective(objectiveId: string): Promise<KPI[]> {
  const all = await getAllKPIs()
  return all.filter(k => k.objectiveId === objectiveId)
}

export async function createKPI(
  data: Omit<KPI, 'id' | 'createdAt' | 'updatedAt'>
): Promise<KPI> {
  if (!isConfigured) throw new Error('Redis not configured')
  const now = new Date().toISOString()
  const item: KPI = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
  await kv.pipeline().set(kpiKey(item.id), item).lpush(KPI_LIST, item.id).exec()
  return item
}

export async function updateKPI(id: string, data: Partial<KPI>): Promise<KPI | null> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getKPI(id)
  if (!existing) return null
  const updated: KPI = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  await kv.set(kpiKey(id), updated)
  return updated
}

export async function deleteKPI(id: string): Promise<boolean> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getKPI(id)
  if (!existing) return false
  await kv.pipeline().del(kpiKey(id)).lrem(KPI_LIST, 0, id).exec()
  return true
}

// ── 1:1 MEETINGS ─────────────────────────────────────────────

const OOO_LIST = 'one-on-ones:list'
const oooKey   = (id: string) => `one-on-ones:item:${id}`

export async function getAllOneOnOnes(): Promise<OneOnOne[]> {
  if (!isConfigured) return []
  const ids = await kv.lrange<string>(OOO_LIST, 0, -1)
  if (!ids || ids.length === 0) return []
  const pipeline = kv.pipeline()
  ids.forEach(id => pipeline.get(oooKey(id)))
  const results = await pipeline.exec()
  return (results as (OneOnOne | null)[])
    .filter((r): r is OneOnOne => r !== null)
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
}

export async function getOneOnOne(id: string): Promise<OneOnOne | null> {
  if (!isConfigured) return null
  return kv.get<OneOnOne>(oooKey(id))
}

export async function createOneOnOne(
  data: Omit<OneOnOne, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OneOnOne> {
  if (!isConfigured) throw new Error('Redis not configured')
  const now = new Date().toISOString()
  const item: OneOnOne = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
  await kv.pipeline().set(oooKey(item.id), item).lpush(OOO_LIST, item.id).exec()
  return item
}

export async function updateOneOnOne(id: string, data: Partial<OneOnOne>): Promise<OneOnOne | null> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getOneOnOne(id)
  if (!existing) return null
  const updated: OneOnOne = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  await kv.set(oooKey(id), updated)
  return updated
}

export async function deleteOneOnOne(id: string): Promise<boolean> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getOneOnOne(id)
  if (!existing) return false
  await kv.pipeline().del(oooKey(id)).lrem(OOO_LIST, 0, id).exec()
  return true
}

// ── PERFORMANCE REVIEWS ───────────────────────────────────────

const REV_LIST = 'reviews:list'
const revKey   = (id: string) => `reviews:item:${id}`

export async function getAllReviews(): Promise<PerformanceReview[]> {
  if (!isConfigured) return []
  const ids = await kv.lrange<string>(REV_LIST, 0, -1)
  if (!ids || ids.length === 0) return []
  const pipeline = kv.pipeline()
  ids.forEach(id => pipeline.get(revKey(id)))
  const results = await pipeline.exec()
  return (results as (PerformanceReview | null)[])
    .filter((r): r is PerformanceReview => r !== null)
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
}

export async function getReview(id: string): Promise<PerformanceReview | null> {
  if (!isConfigured) return null
  return kv.get<PerformanceReview>(revKey(id))
}

export async function createReview(
  data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PerformanceReview> {
  if (!isConfigured) throw new Error('Redis not configured')
  const now = new Date().toISOString()
  const item: PerformanceReview = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
  await kv.pipeline().set(revKey(item.id), item).lpush(REV_LIST, item.id).exec()
  return item
}

export async function updateReview(
  id: string,
  data: Partial<PerformanceReview>
): Promise<PerformanceReview | null> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getReview(id)
  if (!existing) return null
  const updated: PerformanceReview = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  await kv.set(revKey(id), updated)
  return updated
}

export async function deleteReview(id: string): Promise<boolean> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getReview(id)
  if (!existing) return false
  await kv.pipeline().del(revKey(id)).lrem(REV_LIST, 0, id).exec()
  return true
}

// ── MEMBERS (handover contacts) ───────────────────────────────

const MEMBER_LIST = 'members:list'
const memberKey    = (id: string) => `members:item:${id}`

export async function getAllMembers(): Promise<Member[]> {
  if (!isConfigured) return []
  const ids = await kv.lrange<string>(MEMBER_LIST, 0, -1)
  if (!ids || ids.length === 0) return []
  const pipeline = kv.pipeline()
  ids.forEach(id => pipeline.get(memberKey(id)))
  const results = await pipeline.exec()
  return (results as (Member | null)[])
    .filter((r): r is Member => r !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getMember(id: string): Promise<Member | null> {
  if (!isConfigured) return null
  return kv.get<Member>(memberKey(id))
}

export async function createMember(data: CreateMember): Promise<Member> {
  if (!isConfigured) throw new Error('Redis not configured')
  const now = new Date().toISOString()
  const item: Member = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
  await kv.pipeline().set(memberKey(item.id), item).lpush(MEMBER_LIST, item.id).exec()
  return item
}

export async function updateMember(id: string, data: Partial<CreateMember>): Promise<Member | null> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getMember(id)
  if (!existing) return null
  const updated: Member = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  await kv.set(memberKey(id), updated)
  return updated
}

// Deleting a member reassigns any handover items still on them back to me,
// across every handover — not just the one currently open.
export async function deleteMember(id: string): Promise<boolean> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getMember(id)
  if (!existing) return false

  const handovers = await getAllHandovers()
  const affected = handovers.filter(
    h => h.memberIds.includes(id) || h.items.some(i => i.assigneeMemberId === id)
  )
  for (const h of affected) {
    await updateHandover(h.id, {
      memberIds: h.memberIds.filter(m => m !== id),
      items: h.items.map(i =>
        i.assigneeMemberId === id ? { ...i, assigneeMemberId: null, updatedAt: new Date().toISOString() } : i
      ),
    })
  }

  await kv.pipeline().del(memberKey(id)).lrem(MEMBER_LIST, 0, id).exec()
  return true
}

// ── HANDOVERS ─────────────────────────────────────────────────

const HANDOVER_LIST = 'handovers:list'
const handoverKey    = (id: string) => `handovers:item:${id}`

export async function getAllHandovers(): Promise<Handover[]> {
  if (!isConfigured) return []
  const ids = await kv.lrange<string>(HANDOVER_LIST, 0, -1)
  if (!ids || ids.length === 0) return []
  const pipeline = kv.pipeline()
  ids.forEach(id => pipeline.get(handoverKey(id)))
  const results = await pipeline.exec()
  return (results as (Handover | null)[])
    .filter((r): r is Handover => r !== null)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
}

export async function getHandover(id: string): Promise<Handover | null> {
  if (!isConfigured) return null
  return kv.get<Handover>(handoverKey(id))
}

export async function createHandover(data: CreateHandover): Promise<Handover> {
  if (!isConfigured) throw new Error('Redis not configured')
  const now = new Date().toISOString()
  const item: Handover = {
    id: uuidv4(),
    title: data.title,
    reason: data.reason,
    startDate: data.startDate,
    endDate: data.endDate,
    status: 'active',
    memberIds: data.memberIds ?? [],
    items: data.items ?? [],
    createdAt: now,
    updatedAt: now,
  }
  await kv.pipeline().set(handoverKey(item.id), item).lpush(HANDOVER_LIST, item.id).exec()
  return item
}

export async function updateHandover(id: string, data: Partial<Handover>): Promise<Handover | null> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getHandover(id)
  if (!existing) return null
  const updated: Handover = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  await kv.set(handoverKey(id), updated)
  return updated
}

export async function deleteHandover(id: string): Promise<boolean> {
  if (!isConfigured) throw new Error('Redis not configured')
  const existing = await getHandover(id)
  if (!existing) return false
  await kv.pipeline().del(handoverKey(id)).lrem(HANDOVER_LIST, 0, id).exec()
  return true
}

// Manual close-out: reassign every item back to me and mark the handover ended.
export async function endHandover(id: string): Promise<Handover | null> {
  const existing = await getHandover(id)
  if (!existing) return null
  const now = new Date().toISOString()
  return updateHandover(id, {
    status: 'ended',
    endedAt: now,
    items: existing.items.map(i => ({ ...i, assigneeMemberId: null, updatedAt: now })),
  })
}

// Remove one member from a single handover (not a global delete): unassigns
// their items in that handover back to me and drops them from memberIds.
export async function removeMemberFromHandover(
  handoverId: string,
  memberId: string
): Promise<Handover | null> {
  const existing = await getHandover(handoverId)
  if (!existing) return null
  const now = new Date().toISOString()
  return updateHandover(handoverId, {
    memberIds: existing.memberIds.filter(m => m !== memberId),
    items: existing.items.map(i =>
      i.assigneeMemberId === memberId ? { ...i, assigneeMemberId: null, updatedAt: now } : i
    ),
  })
}
