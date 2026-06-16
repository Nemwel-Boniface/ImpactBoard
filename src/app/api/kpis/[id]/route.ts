import { NextRequest, NextResponse } from 'next/server'
import { getKPI, updateKPI, deleteKPI } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, ctx: any) {
  const { params } = ctx
  const item = await getKPI(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

export async function PUT(req: NextRequest, ctx: any) {
  try {
    const body = await req.json()
    const { params } = ctx
    const updated = await updateKPI(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/kpis/:id]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { params } = ctx
  const ok = await deleteKPI(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}
