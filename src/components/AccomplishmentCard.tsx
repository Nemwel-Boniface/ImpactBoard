'use client'
import { useState } from 'react'
import type { Accomplishment, KPI } from '@/types'
import { CategoryBadge, ImpactIndicator } from '@/components/ui'
import clsx from 'clsx'

interface Props {
  item: Accomplishment
  onToggleFeatured: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (item: Accomplishment) => void
  kpiMap?: Record<string, KPI>
}

export default function AccomplishmentCard({ item, onToggleFeatured, onDelete, onEdit, kpiMap }: Props) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.title}"?`)) return
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
  }

  const dateLabel = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      className={clsx(
        'bg-white rounded-card shadow-card border border-eden-green/[0.07] card-lift p-5 relative overflow-hidden flex flex-col',
        item.featured && 'border-l-4 border-l-eden-green'
      )}
    >
      {item.featured && (
        <div className="absolute top-0 right-0 bg-eden-green text-white text-[9px] font-bold tracking-[1px] uppercase px-2.5 py-1 rounded-bl-lg">
          ★ Featured
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <CategoryBadge category={item.category} />
        <ImpactIndicator impact={item.impact} />
      </div>

      {/* Title */}
      <h3 className="font-syne font-bold text-[15px] text-eden-dark mb-2 leading-snug">
        {item.title}
      </h3>

      {/* Description */}
      <p className="text-[13px] text-eden-grey leading-relaxed mb-4 flex-1 line-clamp-3">
        {item.description}
      </p>

      {/* Metrics */}
      {item.metrics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {item.metrics.map((m, i) => (
            <div
              key={i}
              className="bg-eden-light rounded-lg px-3 py-1.5 text-[12px] flex items-center gap-1.5"
            >
              <strong className="text-eden-green font-syne font-bold">{m}</strong>
            </div>
          ))}
        </div>
      )}

      {/* KPI pills */}
      {item.kpiIds && item.kpiIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-[10px] text-eden-grey uppercase tracking-wide mr-1 self-center">KPIs:</span>
          {item.kpiIds.map(id => (
            <span key={id} className="text-[10px] bg-eden-green-pale text-eden-green px-2 py-0.5 rounded-full font-semibold">
              {kpiMap?.[id]?.title ?? 'KPI'}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-eden-green/[0.07]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-eden-grey">📅 {dateLabel}</span>
          {item.week && (
            <span className="text-[10px] font-semibold bg-eden-orange-pale text-eden-orange px-2 py-0.5 rounded-full">
              {item.week}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleFeatured(item.id)}
            className="w-7 h-7 rounded-lg bg-eden-light hover:bg-eden-green-pale hover:text-eden-green text-eden-grey transition-all flex items-center justify-center text-sm"
            title={item.featured ? 'Unfeature' : 'Feature'}
          >
            {item.featured ? '★' : '☆'}
          </button>
          <button
            onClick={() => onEdit(item)}
            className="w-7 h-7 rounded-lg bg-eden-light hover:bg-eden-green-pale hover:text-eden-green text-eden-grey transition-all flex items-center justify-center text-sm"
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-7 h-7 rounded-lg bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-sm"
            title="Delete"
          >
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </div>
    </div>
  )
}
