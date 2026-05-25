import { NextRequest, NextResponse } from 'next/server'
import { parseExcelBuffer, generateTemplateCSV } from '@/lib/import'
import { bulkCreateAccomplishments } from '@/lib/kv'

export const runtime = 'nodejs'

// POST /api/import  — multipart upload
// Query: ?confirm=true  → actually commit to KV
//        ?confirm=false → return preview only (default)
export async function POST(req: NextRequest) {
  try {
    const confirm = req.nextUrl.searchParams.get('confirm') === 'true'
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { items, errors, total } = parseExcelBuffer(buffer)

    if (!confirm) {
      // Preview mode — return parsed rows without saving
      return NextResponse.json({
        data: { preview: items.slice(0, 20), errors, total, parsed: items.length },
      })
    }

    // Commit mode
    const result = await bulkCreateAccomplishments(items)
    return NextResponse.json({ data: { ...result, errors, total } })
  } catch (err) {
    console.error('[POST /api/import]', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}

// GET /api/import?template=true  — download blank CSV template
export async function GET(req: NextRequest) {
  const isTemplate = req.nextUrl.searchParams.get('template') === 'true'
  if (!isTemplate) {
    return NextResponse.json({ error: 'Use ?template=true' }, { status: 400 })
  }

  const csv = generateTemplateCSV()
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="bragboard-template.csv"',
    },
  })
}
