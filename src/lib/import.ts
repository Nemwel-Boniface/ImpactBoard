import * as XLSX from 'xlsx'
import type { CreateAccomplishment, ImpactLevel, CategorySlug } from '@/types'

// Flexible column name mapping
const TITLE_KEYS   = ['title', 'accomplishment', 'what i did', 'win', 'achievement']
const CAT_KEYS     = ['category', 'type', 'area', 'stream']
const DESC_KEYS    = ['description', 'desc', 'details', 'summary', 'what']
const IMPACT_KEYS  = ['impact', 'level', 'priority', 'importance']
const DATE_KEYS    = ['date', 'when', 'month', 'completed']
const M1_KEYS      = ['metric_1', 'metric 1', 'result 1', 'number', 'metric', 'result']
const M2_KEYS      = ['metric_2', 'metric 2', 'result 2', 'number 2']
const M3_KEYS      = ['metric_3', 'metric 3', 'result 3', 'number 3']

function findValue(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()]
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim()
    }
  }
  return ''
}

function normalizeImpact(raw: string): ImpactLevel {
  const v = raw.toLowerCase().trim()
  if (['high', 'h', '3', 'critical', 'major'].includes(v)) return 'high'
  if (['medium', 'med', 'm', '2', 'moderate'].includes(v)) return 'medium'
  return 'low'
}

function normalizeCategory(raw: string): CategorySlug {
  const v = raw.toLowerCase().trim()
  if (['core', 'backend', 'core backend', 'be'].includes(v)) return 'core'
  if (['integration', 'integrations', 'api', 'int'].includes(v)) return 'integration'
  if (['side', 'side quest', 'extra', 'bonus'].includes(v)) return 'side'
  if (['leadership', 'lead', 'management', 'mgmt'].includes(v)) return 'leadership'
  if (['infra', 'infrastructure', 'devops', 'ops'].includes(v)) return 'infra'
  return raw || 'core'
}

export interface ParseResult {
  items: CreateAccomplishment[]
  errors: string[]
  total: number
}

export function parseExcelBuffer(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  })

  const items: CreateAccomplishment[] = []
  const errors: string[] = []

  rows.forEach((row, index) => {
    const title = findValue(row, TITLE_KEYS)
    if (!title) {
      errors.push(`Row ${index + 2}: skipped — no title found`)
      return
    }

    const rawDate = findValue(row, DATE_KEYS)
    let date = new Date().toISOString().split('T')[0]
    if (rawDate) {
      const parsed = new Date(rawDate)
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().split('T')[0]
      }
    }

    const metrics = [
      findValue(row, M1_KEYS),
      findValue(row, M2_KEYS),
      findValue(row, M3_KEYS),
    ].filter(Boolean)

    items.push({
      title,
      category: normalizeCategory(findValue(row, CAT_KEYS)),
      description: findValue(row, DESC_KEYS) || 'Imported from Excel.',
      impact: normalizeImpact(findValue(row, IMPACT_KEYS) || 'medium'),
      metrics,
      date,
      featured: false,
    })
  })

  return { items, errors, total: rows.length }
}

export function generateTemplateCSV(): string {
  const header = 'title,category,description,impact,metric_1,metric_2,metric_3,date'
  const example1 = '"Claims API Integration",integration,"Built end-to-end claims integration reducing processing time by 40%",high,"40% faster","8 hrs/wk saved","3 stakeholders",2025-02-15'
  const example2 = '"Sprint Retro Lead",leadership,"Facilitated team retrospective with 3 process improvements adopted",medium,"2 retros led","3 improvements",,2025-03-01'
  const example3 = '"Member Data Pipeline",side,"Self-initiated automation saving 8 hours per week of manual work",high,"8 hrs/wk saved","0 manual errors",,2025-03-10'
  return [header, example1, example2, example3].join('\n')
}
