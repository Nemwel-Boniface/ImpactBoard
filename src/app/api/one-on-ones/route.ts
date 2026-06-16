import { NextRequest, NextResponse } from 'next/server'
import { getAllOneOnOnes, createOneOnOne } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    let data = await getAllOneOnOnes()
    if (status) data = data.filter(o => o.status === status)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/one-on-ones]', err)
    return NextResponse.json({ error: 'Failed to fetch 1:1s' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.withName?.trim()) {
      return NextResponse.json({ error: 'withName is required' }, { status: 400 })
    }
    if (!body.scheduledDate) {
      return NextResponse.json({ error: 'scheduledDate is required' }, { status: 400 })
    }
    const item = await createOneOnOne({
      ...body,
      followUpItems: body.followUpItems ?? [],
      linkedKpiIds: body.linkedKpiIds ?? [],
      linkedAccomplishmentIds: body.linkedAccomplishmentIds ?? [],
      status: body.status ?? 'scheduled',
    })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/one-on-ones]', err)
    return NextResponse.json({ error: 'Failed to create 1:1' }, { status: 500 })
  }
}
