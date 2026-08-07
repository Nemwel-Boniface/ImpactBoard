import { NextRequest, NextResponse } from 'next/server'
import { getMember, updateMember, deleteMember } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, ctx: any) {
  const { params } = ctx
  const item = await getMember(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const { params } = ctx
    const body = await req.json()
    const updated = await updateMember(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/members/:id]', err)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// Deleting a member reassigns their handover items back to the owner across
// every handover they're part of — see deleteMember in lib/kv.ts.
export async function DELETE(_: NextRequest, ctx: any) {
  const { params } = ctx
  const ok = await deleteMember(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}
