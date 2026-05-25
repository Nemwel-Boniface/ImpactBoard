/**
 * lib/kv.ts
 * All Vercel KV (Redis) operations for BragBoard.
 *
 * Key schema:
 *   accomplishments:list          → string[]   (ordered list of IDs)
 *   accomplishments:item:{id}     → Accomplishment
 *   meta:stats                    → cached DashboardStats (TTL 60s)
 */

import { kv as vercelKV } from '@vercel/kv'
import { localKV } from './kv-local'

const isVercelKVConfigured =
  !!process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_URL !== 'your_kv_rest_api_url_here' &&
  !!process.env.KV_REST_API_TOKEN &&
  process.env.KV_REST_API_TOKEN !== 'your_kv_rest_api_token_here'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const kv: any = isVercelKVConfigured ? vercelKV : localKV
import { v4 as uuidv4 } from 'uuid'
import type {
  Accomplishment,
  CreateAccomplishment,
  UpdateAccomplishment,
  DashboardStats,
  CategorySlug,
} from '@/types'
import { CATEGORIES, calcImpactScore } from './categories'

const LIST_KEY = 'accomplishments:list'
const itemKey = (id: string) => `accomplishments:item:${id}`
const STATS_KEY = 'meta:stats'

// ── READ ──────────────────────────────────────────────────────

export async function getAllAccomplishments(): Promise<Accomplishment[]> {
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
    .del(STATS_KEY)           // bust stats cache
    .exec()

  return item
}

export async function updateAccomplishment(
  id: string,
  data: UpdateAccomplishment
): Promise<Accomplishment | null> {
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
  const cached = await kv.get<DashboardStats>(STATS_KEY)
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

  const reviewDate = new Date(process.env.NEXT_PUBLIC_REVIEW_DATE ?? '2025-06-15')
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
    meetingsTotal: 14,   // update via env or a separate KV key later
    meetingsLed: 6,
    daysUntilReview,
  }

  // Cache for 60 seconds
  await kv.set(STATS_KEY, stats, { ex: 60 })
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
