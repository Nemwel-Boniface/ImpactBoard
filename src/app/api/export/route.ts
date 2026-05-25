import { NextRequest, NextResponse } from 'next/server'
import { exportAllAsJSON, exportAllAsCSV } from '@/lib/kv'

export const runtime = 'nodejs'

// GET /api/export?format=json|csv
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') ?? 'json'

  try {
    if (format === 'csv') {
      const csv = await exportAllAsCSV()
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bragboard-export-${Date.now()}.csv"`,
        },
      })
    }

    const json = await exportAllAsJSON()
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bragboard-export-${Date.now()}.json"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/export]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
