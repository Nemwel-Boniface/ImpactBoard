import { NextRequest, NextResponse } from 'next/server'
import {
  getAccomplishment,
  updateAccomplishment,
  deleteAccomplishment,
  toggleFeatured,
} from '@/lib/kv'

export const runtime = 'nodejs'

// GET /api/accomplishments/[id]
export async function GET(_: NextRequest, ctx: any) {
  const { params } = ctx
  const item = await getAccomplishment(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

// PUT /api/accomplishments/[id]
export async function PUT(req: NextRequest, ctx: any) {
  try {
    const body = await req.json()
    const { params } = ctx
    const updated = await updateAccomplishment(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE /api/accomplishments/[id]
export async function DELETE(_: NextRequest, ctx: any) {
  const { params } = ctx
  const ok = await deleteAccomplishment(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}

// PATCH /api/accomplishments/[id]  → toggle featured
export async function PATCH(_: NextRequest, ctx: any) {
  const { params } = ctx
  const updated = await toggleFeatured(params.id)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}
