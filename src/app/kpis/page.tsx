'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import type { KPI, CompanyObjective } from '@/types'
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
  title: '',
  description: '',
  keyMetrics: '',
  objectiveId: '',
  balanceScoreCard: 'Financial',
  weight: 0,
  quarter: 'Q2 2026',
  active: true,
}

export default function KPIsPage() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [objectives, setObjectives] = useState<CompanyObjective[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<KPI | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { toasts, show } = useToast()

  const fetchData = async () => {
    const [kpisRes, objsRes] = await Promise.all([
      fetch('/api/kpis').then(r => r.json()),
      fetch('/api/objectives').then(r => r.json()),
    ])
    setKpis(kpisRes.data ?? [])
    setObjectives(objsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const objectiveMap = Object.fromEntries(objectives.map(o => [o.id, o]))

  const filtered = activeTab === 'all'
    ? kpis
    : kpis.filter(k => k.balanceScoreCard === activeTab)

  const totalWeight = kpis.reduce((sum, k) => sum + k.weight, 0)

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
    setModalOpen(true)
  }

  const openEdit = (kpi: KPI) => {
    setEditItem(kpi)
    setForm({
      title: kpi.title,
      description: kpi.description,
      keyMetrics: kpi.keyMetrics,
      objectiveId: kpi.objectiveId,
      balanceScoreCard: kpi.balanceScoreCard,
      weight: kpi.weight,
      quarter: kpi.quarter,
      active: kpi.active,
    })
    setModalOpen(true)
  }

  const handleObjectiveChange = (objectiveId: string) => {
    const obj = objectives.find(o => o.id === objectiveId)
    setForm(p => ({
      ...p,
      objectiveId,
      balanceScoreCard: obj?.balanceScoreCard ?? p.balanceScoreCard,
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editItem) {
        await fetch(`/api/kpis/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        show('KPI updated ✓')
      } else {
        await fetch('/api/kpis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        show('KPI created ✓')
      }
      setModalOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (kpi: KPI) => {
    if (!confirm(`Delete "${kpi.title}"?`)) return
    await fetch(`/api/kpis/${kpi.id}`, { method: 'DELETE' })
    show('KPI deleted', 'warning')
    fetchData()
  }

  return (
    <div className="p-9">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="font-syne font-bold text-[22px] text-eden-dark">My KPIs</h1>
          <p className="text-[13px] text-eden-grey mt-1">Q2 2026 — personal objectives linked to company goals</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Add KPI</Button>
      </div>

      {/* Weight indicator */}
      <div className={clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold mb-5 mt-3',
        totalWeight === 100
          ? 'bg-eden-green-pale text-eden-green'
          : 'bg-eden-orange-pale text-eden-orange'
      )}>
        {totalWeight === 100 ? '✓' : '⚠'} Total weight: {totalWeight}%
        {totalWeight !== 100 && ' — must sum to 100%'}
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

      {/* KPI list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[180px] animate-pulse shadow-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-eden-grey">
          <div className="text-5xl mb-4">📈</div>
          <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">No KPIs yet</h3>
          <p className="mb-6">Run the seed route or add your KPIs manually.</p>
          <Button variant="primary" onClick={openCreate}>+ Add KPI</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(kpi => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              objective={objectiveMap[kpi.objectiveId]}
              onEdit={openEdit}
              onDelete={handleDelete}
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
          <div className="bg-white rounded-[20px] w-full max-w-[580px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">
                {editItem ? 'Edit KPI' : 'Add KPI'}
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
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Title *</label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Client Integration Ownership"
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
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Key Metrics / Success Criteria</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green resize-y min-h-[80px]"
                  value={form.keyMetrics}
                  onChange={e => setForm(p => ({ ...p, keyMetrics: e.target.value }))}
                  placeholder="How will success be measured?"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Linked Company Objective</label>
                <select
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green bg-white"
                  value={form.objectiveId}
                  onChange={e => handleObjectiveChange(e.target.value)}
                >
                  <option value="">— Select objective —</option>
                  {objectives.map(o => (
                    <option key={o.id} value={o.id}>{o.order}. {o.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={form.weight}
                    onChange={e => setForm(p => ({ ...p, weight: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Quarter</label>
                  <input
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={form.quarter}
                    onChange={e => setForm(p => ({ ...p, quarter: e.target.value }))}
                    placeholder="e.g. Q2 2026"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save KPI'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}

function KPICard({
  kpi,
  objective,
  onEdit,
  onDelete,
}: {
  kpi: KPI
  objective?: CompanyObjective
  onEdit: (k: KPI) => void
  onDelete: (k: KPI) => void
}) {
  const bscStyle = BSC_STYLES[kpi.balanceScoreCard] ?? 'bg-gray-100 text-gray-600'

  return (
    <Card className="p-6" accent="green">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-syne font-bold text-[17px] text-eden-dark">{kpi.title}</h3>
            <span className={clsx('text-[10px] font-bold px-2.5 py-1 rounded-full', bscStyle)}>
              {kpi.balanceScoreCard}
            </span>
            <span className="text-[12px] font-bold bg-eden-green-pale text-eden-green px-2.5 py-1 rounded-full">
              {kpi.weight}%
            </span>
            <span className="text-[11px] text-eden-grey bg-eden-light px-2.5 py-1 rounded-full">
              {kpi.quarter}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <button
            onClick={() => onEdit(kpi)}
            className="w-7 h-7 rounded-lg bg-eden-light hover:bg-eden-green-pale hover:text-eden-green text-eden-grey transition-all flex items-center justify-center text-sm"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(kpi)}
            className="w-7 h-7 rounded-lg bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      <p className="text-[13px] text-eden-grey leading-relaxed mb-3">{kpi.description}</p>

      {kpi.keyMetrics && (
        <div className="mb-3 p-3 bg-eden-light rounded-lg">
          <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey mb-1">Key Metrics</p>
          <p className="text-[13px] text-eden-dark">{kpi.keyMetrics}</p>
        </div>
      )}

      {objective && (
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-eden-grey">🎯 Linked to:</span>
          <span className="bg-eden-green-pale text-eden-green font-semibold px-2.5 py-0.5 rounded-full">
            {objective.name}
          </span>
          <span className="text-eden-grey/60 text-[10px]">[company goal]</span>
        </div>
      )}
    </Card>
  )
}
