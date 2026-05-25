import { NextResponse } from 'next/server'
import { getDashboardStats, getAllAccomplishments } from '@/lib/kv'
import { generateOpeningStatement } from '@/lib/categories'

export const runtime = 'nodejs'

// GET /api/dashboard
export async function GET() {
  try {
    const [stats, items] = await Promise.all([
      getDashboardStats(),
      getAllAccomplishments(),
    ])

    const userName = process.env.NEXT_PUBLIC_USER_NAME ?? 'You'
    const openingStatement = generateOpeningStatement(items, userName)

    const topItems = [
      ...items.filter(i => i.featured),
      ...items.filter(i => !i.featured),
    ]
      .sort((a, b) => {
        const w = { high: 3, medium: 2, low: 1 }
        return w[b.impact] - w[a.impact]
      })
      .slice(0, 3)

    return NextResponse.json({
      data: {
        stats,
        reviewPrep: {
          openingStatement,
          topItems,
        },
      },
    })
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
