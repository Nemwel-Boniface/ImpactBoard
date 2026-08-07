import { NextRequest, NextResponse } from 'next/server'
import {
  getHandover,
  updateHandover,
  deleteHandover,
  endHandover,
  removeMemberFromHandover,
} from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, ctx: any) {
  const { params } = ctx
  const item = await getHandover(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

export async function PUT(req: NextRequest, ctx: any) {
  try {
    const { params } = ctx
    const body = await req.json()
    const updated = await updateHandover(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/handovers/:id]', err)
    return NextResponse.json({ error: 'Failed to update handover' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { params } = ctx
  const ok = await deleteHandover(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}

// PATCH → action-based transitions: end the handover (reassign items back to
// me) or remove a single member from this handover.
export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const { params } = ctx
    const body = await req.json()

    if (body.action === 'end') {
      const updated = await endHandover(params.id)
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ data: updated })
    }

    if (body.action === 'removeMember') {
      if (!body.memberId) {
        return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
      }
      const updated = await removeMemberFromHandover(params.id, body.memberId)
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ data: updated })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[PATCH /api/handovers/:id]', err)
    return NextResponse.json({ error: 'Failed to update handover' }, { status: 500 })
  }
}
