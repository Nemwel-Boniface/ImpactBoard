'use client'
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import type { Accomplishment, CreateAccomplishment } from '@/types'
import AccomplishmentCard from '@/components/AccomplishmentCard'
import AccomplishmentModal from '@/components/AccomplishmentModal'
import { Button } from '@/components/ui'
import { useToast, ToastContainer } from '@/hooks/useToast'
import { CATEGORIES } from '@/lib/categories'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'

const ALL_CAT_TABS = [
  { slug: 'all', label: 'All', icon: '🏆' },
  ...CATEGORIES.map(c => ({ slug: c.slug, label: c.name, icon: c.icon })),
]

function AccomplishmentsContent() {
  const searchParams = useSearchParams()
  const initialCat   = searchParams.get('cat') ?? 'all'

  const [items, setItems]           = useState<Accomplishment[]>([])
  const [allItems, setAllItems]     = useState<Accomplishment[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeCat, setActiveCat]   = useState(initialCat)
  const [activeWeek, setActiveWeek] = useState('all')
  const [search, setSearch]         = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editItem, setEditItem]     = useState<Accomplishment | null>(null)
  const { toasts, show }            = useToast()

  // Fetch all items once to derive the week list
  useEffect(() => {
    fetch('/api/accomplishments')
      .then(r => r.json())
      .then(({ data }) => setAllItems(data ?? []))
  }, [])

  const weekOptions = ['all', ...Array.from(
    new Set(
      allItems
        .map(i => i.week)
        .filter((w): w is string => !!w && w.trim() !== '')
    )
  ).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '') || '0')
    const numB = parseInt(b.replace(/\D/g, '') || '0')
    return numA - numB
  })]

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeCat !== 'all')  params.set('category', activeCat)
    if (search)               params.set('search', search)
    if (activeWeek !== 'all') params.set('week', activeWeek)

    const res = await fetch(`/api/accomplishments?${params}`)
    const { data } = await res.json()
    setItems(data ?? [])
    setLoading(false)
  }, [activeCat, search, activeWeek])

  useEffect(() => { fetchItems() }, [fetchItems])

  const refreshAll = () => {
    fetchItems()
    fetch('/api/accomplishments').then(r => r.json()).then(({ data }) => setAllItems(data ?? []))
  }

  const handleSave = async (formData: CreateAccomplishment) => {
    if (editItem) {
      await fetch(`/api/accomplishments/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      show('Accomplishment updated ✓')
    } else {
      await fetch('/api/accomplishments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      show('Accomplishment added ✓')
    }
    setEditItem(null)
    refreshAll()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/accomplishments/${id}`, { method: 'DELETE' })
    show('Item removed', 'warning')
    refreshAll()
  }

  const handleToggleFeatured = async (id: string) => {
    await fetch(`/api/accomplishments/${id}`, { method: 'PATCH' })
    show('Featured status updated ✓')
    fetchItems()
  }

  const handleEdit = (item: Accomplishment) => {
    setEditItem(item)
    setModalOpen(true)
  }

  const countForCat  = (slug: string) =>
    slug === 'all' ? allItems.length : allItems.filter(i => i.category === slug).length

  const countForWeek = (week: string) =>
    week === 'all' ? allItems.length : allItems.filter(i => i.week === week).length

  return (
    <div className="p-9">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-bold text-[22px] text-eden-dark">Accomplishments</h1>
        <div className="flex items-center gap-3">
          <input
            className="px-3.5 py-2 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green w-[220px]"
            placeholder="🔍 Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button variant="primary" onClick={() => { setEditItem(null); setModalOpen(true) }}>
            + Add Accomplishment
          </Button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {ALL_CAT_TABS.map(tab => (
          <button
            key={tab.slug}
            onClick={() => setActiveCat(tab.slug)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full border-[1.5px] text-[13px] font-medium transition-all',
              activeCat === tab.slug
                ? 'bg-eden-green border-eden-green text-white'
                : 'bg-white border-eden-green/20 text-eden-grey hover:border-eden-green hover:text-eden-green'
            )}
          >
            {tab.icon} {tab.label}
            <span className={clsx(
              'text-[10px] font-bold rounded-full px-1.5 py-0.5',
              activeCat === tab.slug ? 'bg-white/25 text-white' : 'bg-eden-green/10 text-eden-green'
            )}>
              {countForCat(tab.slug)}
            </span>
          </button>
        ))}
      </div>

      {/* Week filter tabs — only shown when week data exists */}
      {weekOptions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6 pt-2 border-t border-eden-green/10">
          <span className="text-[11px] text-eden-grey font-medium self-center pr-1 uppercase tracking-wide">
            Week:
          </span>
          {weekOptions.map(week => (
            <button
              key={week}
              onClick={() => setActiveWeek(week)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded-full border-[1.5px] text-[12px] font-medium transition-all',
                activeWeek === week
                  ? 'bg-eden-orange border-eden-orange text-white'
                  : 'bg-white border-eden-orange/20 text-eden-grey hover:border-eden-orange hover:text-eden-orange'
              )}
            >
              {week === 'all' ? '📅 All Weeks' : week}
              <span className={clsx(
                'text-[10px] font-bold rounded-full px-1.5 py-0.5',
                activeWeek === week ? 'bg-white/25 text-white' : 'bg-eden-orange/10 text-eden-orange'
              )}>
                {countForWeek(week)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      {!loading && (
        <p className="text-[12px] text-eden-grey mb-4">
          Showing <strong className="text-eden-dark">{items.length}</strong> accomplishment{items.length !== 1 ? 's' : ''}
          {activeCat !== 'all' ? ` in ${ALL_CAT_TABS.find(t => t.slug === activeCat)?.label}` : ''}
          {activeWeek !== 'all' ? ` · ${activeWeek}` : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[240px] animate-pulse shadow-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-eden-grey">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">No results</h3>
          <p className="mb-6">Try a different filter or add a new accomplishment.</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Accomplishment</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <AccomplishmentCard
              key={item.id}
              item={item}
              onToggleFeatured={handleToggleFeatured}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <AccomplishmentModal
        open={modalOpen}
        editItem={editItem}
        onClose={() => { setModalOpen(false); setEditItem(null) }}
        onSave={handleSave}
      />
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default function AccomplishmentsPage() {
  return (
    <Suspense fallback={
      <div className="p-9">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[240px] animate-pulse shadow-card" />
          ))}
        </div>
      </div>
    }>
      <AccomplishmentsContent />
    </Suspense>
  )
}
