'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Accomplishment, CreateAccomplishment } from '@/types'
import AccomplishmentCard from '@/components/AccomplishmentCard'
import AccomplishmentModal from '@/components/AccomplishmentModal'
import { Button } from '@/components/ui'
import { useToast, ToastContainer } from '@/hooks/useToast'
import { CATEGORIES } from '@/lib/categories'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'

const ALL_TABS = [
  { slug: 'all', label: 'All', icon: '🏆' },
  ...CATEGORIES.map(c => ({ slug: c.slug, label: c.name, icon: c.icon })),
]

export default function AccomplishmentsPage() {
  const searchParams = useSearchParams()
  const initialCat = searchParams.get('cat') ?? 'all'

  const [items, setItems]       = useState<Accomplishment[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState(initialCat)
  const [search, setSearch]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Accomplishment | null>(null)
  const { toasts, show } = useToast()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeTab !== 'all') params.set('category', activeTab)
    if (search) params.set('search', search)

    const res = await fetch(`/api/accomplishments?${params}`)
    const { data } = await res.json()
    setItems(data ?? [])
    setLoading(false)
  }, [activeTab, search])

  useEffect(() => { fetchItems() }, [fetchItems])

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
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/accomplishments/${id}`, { method: 'DELETE' })
    show('Item removed', 'warning')
    fetchItems()
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

  // Count per tab
  const countFor = (slug: string) =>
    slug === 'all' ? items.length : items.filter(i => i.category === slug).length

  return (
    <div className="p-9">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-bold text-[22px] text-eden-dark">
          Accomplishments
        </h1>
        <div className="flex items-center gap-3">
          <input
            className="px-3.5 py-2 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green w-[220px]"
            placeholder="🔍 Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button
            variant="primary"
            onClick={() => { setEditItem(null); setModalOpen(true) }}
          >
            + Add Accomplishment
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_TABS.map(tab => (
          <button
            key={tab.slug}
            onClick={() => setActiveTab(tab.slug)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full border-[1.5px] text-[13px] font-medium transition-all',
              activeTab === tab.slug
                ? 'bg-eden-green border-eden-green text-white'
                : 'bg-white border-eden-green/20 text-eden-grey hover:border-eden-green hover:text-eden-green'
            )}
          >
            {tab.icon} {tab.label}
            <span className={clsx(
              'text-[10px] font-bold rounded-full px-1.5 py-0.5',
              activeTab === tab.slug
                ? 'bg-white/25 text-white'
                : 'bg-eden-green/10 text-eden-green'
            )}>
              {countFor(tab.slug)}
            </span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[240px] animate-pulse shadow-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-eden-grey">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">
            No accomplishments here yet
          </h3>
          <p className="mb-6">Add your first win to get started.</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            + Add Accomplishment
          </Button>
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
