import { NextRequest, NextResponse } from 'next/server'
import { getAllReviews, createReview } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await getAllReviews()
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/reviews]', err)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.scheduledDate) {
      return NextResponse.json({ error: 'scheduledDate is required' }, { status: 400 })
    }
    const item = await createReview({
      ...body,
      status: body.status ?? 'upcoming',
      attendees: body.attendees ?? [],
      improvementAreas: body.improvementAreas ?? [],
      linkedKpiIds: body.linkedKpiIds ?? [],
      linkedAccomplishmentIds: body.linkedAccomplishmentIds ?? [],
    })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/reviews]', err)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
