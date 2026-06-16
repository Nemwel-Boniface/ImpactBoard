import { NextRequest, NextResponse } from 'next/server'
import { getReview, updateReview, deleteReview } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, ctx: any) {
  const { params } = ctx
  const item = await getReview(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

export async function PUT(req: NextRequest, ctx: any) {
  try {
    const body = await req.json()
    const { params } = ctx
    const updated = await updateReview(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/reviews/:id]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { params } = ctx
  const ok = await deleteReview(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}

// PATCH → mark as completed
export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const { params } = ctx
    const body = await req.json()
    const updated = await updateReview(params.id, {
      status: 'completed',
      completedDate: body.completedDate ?? new Date().toISOString().split('T')[0],
      attendees: body.attendees,
      notes: body.notes,
      improvementAreas: body.improvementAreas,
    })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/reviews/:id]', err)
    return NextResponse.json({ error: 'Failed to complete review' }, { status: 500 })
  }
}
