import { NextRequest, NextResponse } from 'next/server'
import { getAllMembers, createMember } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await getAllMembers()
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/members]', err)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const item = await createMember({
      name: body.name.trim(),
      role: body.role?.trim() || undefined,
      email: body.email?.trim() || undefined,
    })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/members]', err)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
