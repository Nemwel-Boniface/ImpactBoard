import { NextRequest, NextResponse } from 'next/server'
import { getObjective, updateObjective, deleteObjective } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, ctx: any) {
  const { params } = ctx
  const item = await getObjective(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

export async function PUT(req: NextRequest, ctx: any) {
  try {
    const body = await req.json()
    const { params } = ctx
    const updated = await updateObjective(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/objectives/:id]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { params } = ctx
  const ok = await deleteObjective(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}

export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const { params } = ctx
    const existing = await getObjective(params.id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = await updateObjective(params.id, { active: !existing.active })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/objectives/:id]', err)
    return NextResponse.json({ error: 'Failed to toggle' }, { status: 500 })
  }
}
