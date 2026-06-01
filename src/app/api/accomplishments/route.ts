import { NextRequest, NextResponse } from 'next/server'
import { getAllAccomplishments, createAccomplishment, getAccomplishmentsByCategory } from '@/lib/kv'
import type { CreateAccomplishment } from '@/types'

export const runtime = 'nodejs'

// GET /api/accomplishments?category=core&impact=high&week=Week%2014&search=preauth
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const impact   = searchParams.get('impact')
    const search   = searchParams.get('search')?.toLowerCase()
    const week     = searchParams.get('week')

    let items = category
      ? await getAccomplishmentsByCategory(category)
      : await getAllAccomplishments()

    if (impact) items = items.filter(i => i.impact === impact)
    if (week)   items = items.filter(i => i.week === week)
    if (search) items = items.filter(i =>
      i.title.toLowerCase().includes(search) ||
      i.description?.toLowerCase().includes(search) ||
      i.week?.toLowerCase().includes(search)
    )

    return NextResponse.json({ data: items })
  } catch (err) {
    console.error('[GET /api/accomplishments]', err)
    return NextResponse.json({ error: 'Failed to fetch accomplishments' }, { status: 500 })
  }
}

// POST /api/accomplishments
export async function POST(req: NextRequest) {
  try {
    const body: CreateAccomplishment = await req.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const item = await createAccomplishment(body)
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/accomplishments]', err)
    return NextResponse.json({ error: 'Failed to create accomplishment' }, { status: 500 })
  }
}
