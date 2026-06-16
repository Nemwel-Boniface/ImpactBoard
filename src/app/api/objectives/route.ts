import { NextRequest, NextResponse } from 'next/server'
import { getAllObjectives, createObjective } from '@/lib/kv'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await getAllObjectives()
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/objectives]', err)
    return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const item = await createObjective(body)
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/objectives]', err)
    return NextResponse.json({ error: 'Failed to create objective' }, { status: 500 })
  }
}
