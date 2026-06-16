import { NextRequest, NextResponse } from 'next/server'
import { seedCompanyObjectives } from '@/lib/seed-objectives'
import { seedKPIs } from '@/lib/seed-kpis'

export const runtime = 'nodejs'

// GET /api/seed?key=bragboard-seed-2026
// Idempotent — safe to run multiple times
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== 'bragboard-seed-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const objectivesResult = await seedCompanyObjectives()
    const kpisResult = await seedKPIs()
    return NextResponse.json({
      data: {
        objectives: objectivesResult,
        kpis: kpisResult,
      },
    })
  } catch (err) {
    console.error('[GET /api/seed]', err)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
