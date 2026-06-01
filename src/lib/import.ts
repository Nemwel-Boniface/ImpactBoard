import * as XLSX from 'xlsx'
import type { CreateAccomplishment, ImpactLevel, CategorySlug } from '@/types'

// ── Column name mappings ──────────────────────────────────────
const TITLE_KEYS    = ['title', 'accomplishment', 'what i did', 'win', 'achievement']
const CAT_KEYS      = ['category', 'type', 'area', 'stream']
const DESC_KEYS     = ['description', 'desc', 'details', 'summary', 'what']
const IMPACT_KEYS   = ['impact', 'level', 'priority', 'importance']
const DATE_KEYS     = ['date', 'when', 'month', 'completed']
const M1_KEYS       = ['metric_1', 'metric 1', 'result 1', 'number', 'metric', 'result']
const M2_KEYS       = ['metric_2', 'metric 2', 'result 2', 'number 2']
const M3_KEYS       = ['metric_3', 'metric 3', 'result 3', 'number 3']
const WEEK_KEYS     = ['week', 'week number', 'sprint']
const FEATURED_KEYS = ['featured', 'feature', 'top', 'highlight']

function findValue(row: Record<string, unknown>, keys: string[]): string {
  // Normalise row keys to lowercase once so "Title", "TITLE", "title" all match
  const normalized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) normalized[k.toLowerCase()] = v

  for (const key of keys) {
    const val = normalized[key.toLowerCase()]
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim()
    }
  }
  return ''
}

function normalizeImpact(raw: string): ImpactLevel {
  // Strip emoji bullets: "● High" → "high", "○ Steady" → "low"
  const v = raw.replace(/[●○◉•▪■]/g, '').toLowerCase().trim()
  if (['high', 'h', '3', 'critical', 'major'].includes(v)) return 'high'
  if (['medium', 'med', 'm', '2', 'moderate'].includes(v)) return 'medium'
  if (['steady', 'low', 'l', '1', 'minor', 'normal'].includes(v)) return 'low'
  return 'medium'
}

function normalizeCategory(raw: string): CategorySlug {
  // Strip emoji prefixes: "⚙ Core Backend" → "core backend"
  const v = raw
    .replace(/[⚙⇄✦◈🔗🚀👥🛠]/g, '')
    .toLowerCase()
    .trim()

  if (['core', 'backend', 'core backend', 'be', 'development', 'dev'].includes(v)) return 'core'
  if (['integration', 'integrations', 'api', 'int'].includes(v)) return 'integration'
  if (['side', 'side quest', 'extra', 'bonus', 'side quests'].includes(v)) return 'side'
  if (['leadership', 'lead', 'management', 'mgmt'].includes(v)) return 'leadership'
  if (['infra', 'infrastructure', 'devops', 'ops'].includes(v)) return 'infra'
  // partial match fallback
  if (v.includes('core') || v.includes('backend')) return 'core'
  if (v.includes('integr')) return 'integration'
  if (v.includes('side')) return 'side'
  if (v.includes('lead')) return 'leadership'
  if (v.includes('infra') || v.includes('ops')) return 'infra'
  return 'core'
}

function normalizeFeatured(raw: string): boolean {
  const v = raw.toLowerCase().trim()
  // Handles: "★ Yes", "yes", "true", "1", "★", "featured"
  return ['yes', 'true', '1', '★', '★ yes', 'featured', 'y'].some(match => v.includes(match))
}

function normalizeWeek(raw: string): string {
  const v = raw.trim()
  if (!v || v === '—') return ''
  if (/^week\s/i.test(v)) return v.replace(/^week\s*/i, 'Week ')
  if (/^\d+$/.test(v)) return `Week ${v}`
  return v
}

export interface ParseResult {
  items: (CreateAccomplishment & { week?: string })[]
  errors: string[]
  total: number
}

export function parseExcelBuffer(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // ── Detect header row ────────────────────────────────────────
  // Row 1 may be a merged banner ("BragBoard — Eden Care | ...").
  // Scan the first 5 rows for one containing both "title" and "category".
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    defval: '',
    raw: false,
    header: 1,
  }) as unknown[][]

  let headerRowIndex = 0
  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const rowStr = (rawRows[i] as unknown[]).map(v => String(v ?? '').toLowerCase()).join(' ')
    if (rowStr.includes('title') && rowStr.includes('category')) {
      headerRowIndex = i
      break
    }
  }

  // Parse from the detected header row
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
    range: headerRowIndex,
  })

  const items: (CreateAccomplishment & { week?: string })[] = []
  const errors: string[] = []

  rows.forEach((row) => {
    const title = findValue(row, TITLE_KEYS)

    // Skip week-group separator rows and blank spacers — they have no title
    if (!title) return

    const rawDate = findValue(row, DATE_KEYS)
    let date = new Date().toISOString().split('T')[0]
    if (rawDate) {
      const parsed = new Date(rawDate)
      if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0]
    }

    const metrics = [
      findValue(row, M1_KEYS),
      findValue(row, M2_KEYS),
      findValue(row, M3_KEYS),
    ].filter(Boolean)

    items.push({
      title,
      category:    normalizeCategory(findValue(row, CAT_KEYS)),
      description: findValue(row, DESC_KEYS) || 'Imported from Excel.',
      impact:      normalizeImpact(findValue(row, IMPACT_KEYS) || 'medium'),
      metrics,
      date,
      featured:    normalizeFeatured(findValue(row, FEATURED_KEYS)),
      week:        normalizeWeek(findValue(row, WEEK_KEYS)),
    })
  })

  return { items, errors, total: rawRows.length }
}

export function generateTemplateCSV(): string {
  const header = 'title,category,description,impact,metric_1,metric_2,metric_3,date,featured,week'
  const ex1 = '"Claims API Integration",integration,"Built end-to-end claims integration",high,"40% faster","8 hrs/wk saved","3 stakeholders",2026-05-15,"★ Yes","Week 14"'
  const ex2 = '"Sprint Retro Lead",leadership,"Facilitated retrospective with 3 improvements adopted",medium,"2 retros led","3 improvements",,2026-05-20,"—","Week 14"'
  const ex3 = '"Member Data Pipeline",side,"Self-initiated automation saving 8 hours per week",high,"8 hrs/wk saved","0 manual errors",,2026-05-22,"★ Yes","Week 15"'
  return [header, ex1, ex2, ex3].join('\n')
}
