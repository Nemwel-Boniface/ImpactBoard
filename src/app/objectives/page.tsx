'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import type { CompanyObjective } from '@/types'
import { Button, Card } from '@/components/ui'
import { useToast, ToastContainer } from '@/hooks/useToast'
import clsx from 'clsx'

const BSC_TABS = [
  { key: 'all', label: 'All' },
  { key: 'Financial', label: 'Financial' },
  { key: 'Customer', label: 'Customer' },
  { key: 'Internal Business Processes', label: 'Internal' },
  { key: 'Learning and Growth', label: 'Learning & Growth' },
]

const BSC_STYLES: Record<string, string> = {
  Financial: 'bg-[#EBF3FF] text-[#1A56DB]',
  Customer: 'bg-[#E8F5EE] text-[#1A6B3C]',
  'Internal Business Processes': 'bg-[#FEF3C7] text-[#D97706]',
  'Learning and Growth': 'bg-[#F3E8FF] text-[#7C3AED]',
}

const EMPTY_FORM = {
  name: '',
  description: '',
  targetLabel: '',
  balanceScoreCard: 'Financial',
  order: 1,
  active: true,
}

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<CompanyObjective[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<CompanyObjective | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { toasts, show } = useToast()

  const fetchObjectives = async () => {
    const res = await fetch('/api/objectives')
    const { data } = await res.json()
    setObjectives(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchObjectives() }, [])

  const filtered = activeTab === 'all'
    ? objectives
    : objectives.filter(o => o.balanceScoreCard === activeTab)

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, order: objectives.length + 1 })
    setModalOpen(true)
  }

  const openEdit = (obj: CompanyObjective) => {
    setEditItem(obj)
    setForm({
      name: obj.name,
      description: obj.description,
      targetLabel: obj.targetLabel,
      balanceScoreCard: obj.balanceScoreCard,
      order: obj.order,
      active: obj.active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editItem) {
        await fetch(`/api/objectives/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        show('Objective updated ✓')
      } else {
        await fetch('/api/objectives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        show('Objective created ✓')
      }
      setModalOpen(false)
      fetchObjectives()
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (obj: CompanyObjective) => {
    await fetch(`/api/objectives/${obj.id}`, { method: 'PATCH' })
    show(`Objective ${obj.active ? 'hidden' : 'shown'} ✓`)
    fetchObjectives()
  }

  return (
    <div className="p-9">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="font-syne font-bold text-[22px] text-eden-dark">Company Objectives</h1>
          <p className="text-[13px] text-eden-grey mt-1">
            Eden Care 2026 Annual Goals — everything you do ties back to these
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Add Objective</Button>
      </div>

      {/* BSC explanation */}
      <div className="mb-6 mt-4 p-4 bg-eden-green-pale border-l-4 border-eden-green rounded-lg text-[13px] text-eden-grey">
        <span className="font-semibold text-eden-green">Balanced Scorecard (BSC): </span>
        <span className={clsx('px-2 py-0.5 rounded mr-1', BSC_STYLES['Financial'])}>Financial</span>
        <span className={clsx('px-2 py-0.5 rounded mr-1', BSC_STYLES['Customer'])}>Customer</span>
        <span className={clsx('px-2 py-0.5 rounded mr-1', BSC_STYLES['Internal Business Processes'])}>Internal</span>
        <span className={clsx('px-2 py-0.5 rounded mr-1', BSC_STYLES['Learning and Growth'])}>Learning &amp; Growth</span>
        — four lenses that ensure balanced, holistic performance.
      </div>

      {/* BSC filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {BSC_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-1.5 rounded-full border-[1.5px] text-[13px] font-medium transition-all',
              activeTab === tab.key
                ? 'bg-eden-green border-eden-green text-white'
                : 'bg-white border-eden-green/20 text-eden-grey hover:border-eden-green hover:text-eden-green'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Objectives grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[200px] animate-pulse shadow-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-eden-grey">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">No objectives yet</h3>
          <p className="mb-6">Run the seed to load Eden Care 2026 objectives.</p>
          <Button variant="primary" onClick={openCreate}>+ Add Objective</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(obj => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              onEdit={openEdit}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-eden-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-[20px] w-full max-w-[500px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">
                {editItem ? 'Edit Objective' : 'Add Objective'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Name *</label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Number of Integrations"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Description</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green resize-y min-h-[80px]"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Target Label</label>
                  <input
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={form.targetLabel}
                    onChange={e => setForm(p => ({ ...p, targetLabel: e.target.value }))}
                    placeholder="e.g. Q4: 100+"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Display Order</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={form.order}
                    onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">BSC Category</label>
                <select
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green bg-white"
                  value={form.balanceScoreCard}
                  onChange={e => setForm(p => ({ ...p, balanceScoreCard: e.target.value }))}
                >
                  <option>Financial</option>
                  <option>Customer</option>
                  <option>Internal Business Processes</option>
                  <option>Learning and Growth</option>
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-eden-dark">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-eden-green"
                  checked={form.active}
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                />
                Active (visible on objectives page)
              </label>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}

function ObjectiveCard({
  objective,
  onEdit,
  onToggleActive,
}: {
  objective: CompanyObjective
  onEdit: (o: CompanyObjective) => void
  onToggleActive: (o: CompanyObjective) => void
}) {
  const bscStyle = BSC_STYLES[objective.balanceScoreCard] ?? 'bg-gray-100 text-gray-600'

  return (
    <Card
      className={clsx('p-5', !objective.active && 'opacity-60')}
      accent="green"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-syne font-extrabold text-[28px] text-eden-green leading-none">
            {objective.order}
          </span>
          <div>
            <h3 className="font-syne font-bold text-[15px] text-eden-dark leading-snug">
              {objective.name}
            </h3>
            {objective.targetLabel && (
              <span className="inline-block mt-1 bg-eden-orange-pale text-eden-orange text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {objective.targetLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleActive(objective)}
            className={clsx(
              'text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all',
              objective.active
                ? 'bg-eden-green-pale text-eden-green border-eden-green/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-eden-green-pale hover:text-eden-green'
            )}
          >
            {objective.active ? 'Active' : 'Hidden'}
          </button>
          <button
            onClick={() => onEdit(objective)}
            className="w-7 h-7 rounded-lg bg-eden-light hover:bg-eden-green-pale hover:text-eden-green text-eden-grey transition-all flex items-center justify-center text-sm"
          >
            ✎
          </button>
        </div>
      </div>

      <span className={clsx('text-[10px] font-bold px-2.5 py-1 rounded-full', bscStyle)}>
        {objective.balanceScoreCard}
      </span>

      <p className="text-[13px] text-eden-grey leading-relaxed mt-3">
        {objective.description}
      </p>
    </Card>
  )
}
