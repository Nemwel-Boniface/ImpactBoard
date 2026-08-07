import { NextRequest, NextResponse } from 'next/server'
import { getAllHandovers, createHandover } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    let data = await getAllHandovers()
    if (status) data = data.filter(h => h.status === status)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/handovers]', err)
    return NextResponse.json({ error: 'Failed to fetch handovers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }
    const item = await createHandover({
      title: body.title.trim(),
      reason: body.reason?.trim() || undefined,
      startDate: body.startDate,
      endDate: body.endDate,
      memberIds: body.memberIds ?? [],
    })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/handovers]', err)
    return NextResponse.json({ error: 'Failed to create handover' }, { status: 500 })
  }
}
