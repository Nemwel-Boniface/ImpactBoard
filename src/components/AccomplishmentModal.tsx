'use client'
import { useState, useEffect } from 'react'
import type { Accomplishment, CreateAccomplishment, ImpactLevel, CategorySlug } from '@/types'
import { Button } from '@/components/ui'
import { CATEGORIES } from '@/lib/categories'
import clsx from 'clsx'

interface Props {
  open: boolean
  editItem?: Accomplishment | null
  onClose: () => void
  onSave: (data: CreateAccomplishment) => Promise<void>
}

const EMPTY: CreateAccomplishment = {
  title: '',
  category: 'core',
  description: '',
  impact: 'medium',
  metrics: [],
  date: new Date().toISOString().split('T')[0],
  featured: false,
}

export default function AccomplishmentModal({ open, editItem, onClose, onSave }: Props) {
  const [form, setForm] = useState<CreateAccomplishment>(EMPTY)
  const [metrics, setMetrics] = useState(['', '', ''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editItem) {
      setForm({
        title: editItem.title,
        category: editItem.category,
        description: editItem.description,
        impact: editItem.impact,
        metrics: editItem.metrics,
        date: editItem.date,
        featured: editItem.featured,
      })
      const m = [...editItem.metrics, '', '', ''].slice(0, 3)
      setMetrics(m)
    } else {
      setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] })
      setMetrics(['', '', ''])
    }
    setError('')
  }, [editItem, open])

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    try {
      await onSave({
        ...form,
        metrics: metrics.filter(m => m.trim()),
      })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-eden-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[20px] w-full max-w-[540px] max-h-[90vh] overflow-y-auto p-9 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">

        <div className="flex items-center justify-between mb-7">
          <h2 className="font-syne font-extrabold text-[22px] text-eden-dark">
            {editItem ? 'Edit Accomplishment' : 'Add Accomplishment'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-600">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">
            Title *
          </label>
          <input
            className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg font-dm text-[14px] focus:outline-none focus:border-eden-green focus:ring-2 focus:ring-eden-green/10 transition-all"
            placeholder="e.g. Integrated Claims API with Instarem"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          />
        </div>

        {/* Category + Date */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">
              Category *
            </label>
            <select
              className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg font-dm text-[14px] focus:outline-none focus:border-eden-green focus:ring-2 focus:ring-eden-green/10 transition-all bg-white"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as CategorySlug }))}
            >
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">
              Date
            </label>
            <input
              type="date"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg font-dm text-[14px] focus:outline-none focus:border-eden-green focus:ring-2 focus:ring-eden-green/10 transition-all"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">
            Description
            <span className="normal-case tracking-normal text-eden-grey font-normal ml-1">(use STAR format)</span>
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg font-dm text-[14px] focus:outline-none focus:border-eden-green focus:ring-2 focus:ring-eden-green/10 transition-all resize-y min-h-[90px]"
            placeholder="Situation → Task → Action → Result"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </div>

        {/* Impact */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">
            Impact Level
          </label>
          <div className="flex gap-2">
            {[
              { val: 'high',   label: '🟢 High' },
              { val: 'medium', label: '🟠 Medium' },
              { val: 'low',    label: '⚪ Steady' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setForm(p => ({ ...p, impact: opt.val as ImpactLevel }))}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg border-[1.5px] text-[12px] font-semibold transition-all',
                  form.impact === opt.val && opt.val === 'high'   && 'bg-eden-green-pale border-eden-green text-eden-green border-2',
                  form.impact === opt.val && opt.val === 'medium' && 'bg-eden-orange-pale border-eden-orange text-eden-orange border-2',
                  form.impact === opt.val && opt.val === 'low'    && 'bg-slate-50 border-slate-400 text-slate-600 border-2',
                  form.impact !== opt.val && 'border-eden-green/15 text-eden-grey hover:border-eden-green/30'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">
            Key Metrics (up to 3)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {metrics.map((m, i) => (
              <input
                key={i}
                className="px-3 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg font-dm text-[13px] focus:outline-none focus:border-eden-green focus:ring-2 focus:ring-eden-green/10 transition-all"
                placeholder={['e.g. 40% faster', '8 hrs/wk', '3 stakeholders'][i]}
                value={m}
                onChange={e => {
                  const next = [...metrics]
                  next[i] = e.target.value
                  setMetrics(next)
                }}
              />
            ))}
          </div>
        </div>

        {/* Featured */}
        <div className="mb-7">
          <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-eden-dark">
            <input
              type="checkbox"
              className="w-4 h-4 accent-eden-green"
              checked={form.featured}
              onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))}
            />
            ⭐ Feature as a top talking point in Review Prep
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '✓ Save Accomplishment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
