import { NextRequest, NextResponse } from 'next/server'
import { getOneOnOne, updateOneOnOne, deleteOneOnOne } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, ctx: any) {
  const { params } = ctx
  const item = await getOneOnOne(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

export async function PUT(req: NextRequest, ctx: any) {
  try {
    const body = await req.json()
    const { params } = ctx
    const updated = await updateOneOnOne(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/one-on-ones/:id]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { params } = ctx
  const ok = await deleteOneOnOne(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}

// PATCH → mark as completed or cancelled
export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const { params } = ctx
    const body = await req.json()
    const status = body.status as 'completed' | 'cancelled'
    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const updated = await updateOneOnOne(params.id, { status, ...body })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/one-on-ones/:id]', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
