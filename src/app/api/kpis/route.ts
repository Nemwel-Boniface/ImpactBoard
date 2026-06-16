import { NextRequest, NextResponse } from 'next/server'
import { getAllKPIs, getKPIsByObjective, createKPI } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const objectiveId = searchParams.get('objectiveId')
    const data = objectiveId
      ? await getKPIsByObjective(objectiveId)
      : await getAllKPIs()
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/kpis]', err)
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const item = await createKPI(body)
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/kpis]', err)
    return NextResponse.json({ error: 'Failed to create KPI' }, { status: 500 })
  }
}
