'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import type { PerformanceReview, ImprovementArea, KPI, Accomplishment } from '@/types'
import { Button, Card } from '@/components/ui'
import { useToast, ToastContainer } from '@/hooks/useToast'
import clsx from 'clsx'
import { v4 as uuidv4 } from 'uuid'

const USER_NAME = 'Nemwel Boniface Nyandoro'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

const EMPTY_ADD = {
  title: '',
  scheduledDate: '',
  linkedKpiIds: [] as string[],
  linkedAccomplishmentIds: [] as string[],
}

const EMPTY_COMPLETE = {
  completedDate: '',
  attendees: [USER_NAME],
  notes: '',
  improvementAreas: [] as { id: string; area: string; description: string; targetDate: string }[],
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<PerformanceReview | null>(null)
  const [addForm, setAddForm] = useState(EMPTY_ADD)

  const [completeOpen, setCompleteOpen] = useState(false)
  const [completingId, setCompletingId] = useState('')
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE)

  const [saving, setSaving] = useState(false)
  const { toasts, show } = useToast()

  const fetchData = useCallback(async () => {
    const [revRes, kpiRes, accRes] = await Promise.all([
      fetch('/api/reviews').then(r => r.json()),
      fetch('/api/kpis').then(r => r.json()),
      fetch('/api/accomplishments').then(r => r.json()),
    ])
    setReviews(revRes.data ?? [])
    setKpis(kpiRes.data ?? [])
    setAccomplishments(accRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const upcoming = reviews.filter(r => r.status === 'upcoming')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  const past = reviews.filter(r => r.status === 'completed')
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())

  const kpiMap = Object.fromEntries(kpis.map(k => [k.id, k]))
  const accMap = Object.fromEntries(accomplishments.map(a => [a.id, a]))

  const toggleMultiSelect = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const openAdd = () => {
    setEditItem(null)
    setAddForm({ ...EMPTY_ADD })
    setAddOpen(true)
  }

  const openEdit = (r: PerformanceReview) => {
    setEditItem(r)
    setAddForm({
      title: r.title,
      scheduledDate: r.scheduledDate,
      linkedKpiIds: r.linkedKpiIds ?? [],
      linkedAccomplishmentIds: r.linkedAccomplishmentIds ?? [],
    })
    setAddOpen(true)
  }

  const handleSaveAdd = async () => {
    if (!addForm.title.trim() || !addForm.scheduledDate) return
    setSaving(true)
    try {
      if (editItem) {
        await fetch(`/api/reviews/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addForm),
        })
        show('Review updated ✓')
      } else {
        await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...addForm, status: 'upcoming' }),
        })
        show('Review date added ✓')
      }
      setAddOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const openComplete = (r: PerformanceReview) => {
    setCompletingId(r.id)
    setCompleteForm({
      completedDate: r.scheduledDate,
      attendees: [USER_NAME],
      notes: '',
      improvementAreas: [],
    })
    setCompleteOpen(true)
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      await fetch(`/api/reviews/${completingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...completeForm,
          improvementAreas: completeForm.improvementAreas.map(a => ({ ...a, resolved: false })),
        }),
      })
      show('Review marked as completed ✓')
      setCompleteOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (r: PerformanceReview) => {
    if (!confirm(`Delete "${r.title}"?`)) return
    await fetch(`/api/reviews/${r.id}`, { method: 'DELETE' })
    show('Review deleted', 'warning')
    fetchData()
  }

  const handleToggleImprovement = async (review: PerformanceReview, areaId: string) => {
    const updated = review.improvementAreas.map(a =>
      a.id === areaId ? { ...a, resolved: !a.resolved } : a
    )
    await fetch(`/api/reviews/${review.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ improvementAreas: updated }),
    })
    fetchData()
  }

  const addAttendee = () =>
    setCompleteForm(p => ({ ...p, attendees: [...p.attendees, ''] }))

  const addImprovement = () =>
    setCompleteForm(p => ({
      ...p,
      improvementAreas: [...p.improvementAreas, { id: uuidv4(), area: '', description: '', targetDate: '' }],
    }))

  return (
    <div className="p-9">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-syne font-bold text-[22px] text-eden-dark">Performance Reviews</h1>
          <p className="text-[13px] text-eden-grey mt-1">Track your scheduled and completed review meetings</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Review Date</Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[200px] animate-pulse shadow-card" />
          ))}
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <section className="mb-10">
            <h2 className="font-syne font-bold text-[16px] text-eden-dark mb-4 flex items-center gap-2">
              Upcoming Reviews
              <span className="text-[12px] font-bold bg-eden-orange-pale text-eden-orange px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-10 text-eden-grey border-2 border-dashed border-eden-green/20 rounded-card">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-semibold text-eden-dark mb-1">No upcoming reviews</p>
                <p className="text-[13px] mb-4">Add your next review date to start tracking.</p>
                <Button variant="outline" onClick={openAdd}>+ Add Review Date</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming.map(r => {
                  const days = daysUntil(r.scheduledDate)
                  return (
                    <Card key={r.id} className="p-6" accent="orange">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-1">{r.title}</h3>
                          <p className="text-[15px] text-eden-grey mb-3">{formatDate(r.scheduledDate)}</p>
                          <div className={clsx(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold',
                            days <= 7 ? 'bg-eden-orange-pale text-eden-orange animate-pulse' : 'bg-eden-light text-eden-grey'
                          )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                            {days === 0 ? 'Today!' : days < 0 ? `${Math.abs(days)} days overdue` : `${days} days away`}
                          </div>
                          {/* Linked KPIs */}
                          {r.linkedKpiIds?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              <span className="text-[10px] text-eden-grey uppercase tracking-wide self-center mr-1">KPIs:</span>
                              {r.linkedKpiIds.map(id => kpiMap[id] && (
                                <span key={id} className="text-[11px] bg-eden-green-pale text-eden-green px-2 py-0.5 rounded-full font-semibold">
                                  {kpiMap[id].title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button variant="primary" size="sm" onClick={() => openComplete(r)}>
                            ✓ Mark Completed
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                            ✎ Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(r)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          {/* Past */}
          <section>
            <h2 className="font-syne font-bold text-[16px] text-eden-dark mb-4 flex items-center gap-2">
              Past Reviews
              <span className="text-[12px] font-bold bg-eden-green-pale text-eden-green px-2 py-0.5 rounded-full">
                {past.length}
              </span>
            </h2>
            {past.length === 0 ? (
              <p className="text-[13px] text-eden-grey">No completed reviews yet.</p>
            ) : (
              <div className="space-y-6">
                {past.map(r => (
                  <PastReviewCard
                    key={r.id}
                    review={r}
                    kpiMap={kpiMap}
                    accMap={accMap}
                    onDelete={handleDelete}
                    onToggleImprovement={handleToggleImprovement}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Add / Edit modal */}
      {addOpen && (
        <div
          className="fixed inset-0 bg-eden-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setAddOpen(false)}
        >
          <div className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">
                {editItem ? 'Edit Review' : 'Add Review Date'}
              </h2>
              <button onClick={() => setAddOpen(false)}
                className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Title *</label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  placeholder="e.g. Q2 2026 Performance Review"
                  value={addForm.title}
                  onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Scheduled Date *</label>
                <input type="date"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  value={addForm.scheduledDate}
                  onChange={e => setAddForm(p => ({ ...p, scheduledDate: e.target.value }))}
                />
              </div>
              {kpis.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Linked KPIs</label>
                  <div className="flex flex-wrap gap-1.5">
                    {kpis.map(k => (
                      <button key={k.id}
                        onClick={() => setAddForm(p => ({ ...p, linkedKpiIds: toggleMultiSelect(p.linkedKpiIds, k.id) }))}
                        className={clsx(
                          'text-[12px] px-3 py-1 rounded-full border transition-all',
                          addForm.linkedKpiIds.includes(k.id)
                            ? 'bg-eden-green text-white border-eden-green'
                            : 'bg-white text-eden-grey border-eden-green/20 hover:border-eden-green'
                        )}>
                        {k.title} — {k.weight}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {accomplishments.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Linked Accomplishments</label>
                  <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1">
                    {accomplishments.slice(0, 20).map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-[13px] cursor-pointer p-1.5 rounded hover:bg-eden-light">
                        <input type="checkbox"
                          className="accent-eden-green"
                          checked={addForm.linkedAccomplishmentIds.includes(a.id)}
                          onChange={() => setAddForm(p => ({ ...p, linkedAccomplishmentIds: toggleMultiSelect(p.linkedAccomplishmentIds, a.id) }))}
                        />
                        <span>{a.title}</span>
                        {a.week && <span className="text-eden-grey text-[11px]">· {a.week}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveAdd} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete modal */}
      {completeOpen && (
        <div
          className="fixed inset-0 bg-eden-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setCompleteOpen(false)}
        >
          <div className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">Mark Review Completed</h2>
              <button onClick={() => setCompleteOpen(false)}
                className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg">
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Actual Date it Happened</label>
                <input type="date"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  value={completeForm.completedDate}
                  onChange={e => setCompleteForm(p => ({ ...p, completedDate: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal">Attendees</label>
                  <button onClick={addAttendee} className="text-[12px] text-eden-green font-semibold hover:underline">+ Add</button>
                </div>
                <div className="space-y-2">
                  {completeForm.attendees.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className="flex-1 px-3 py-2 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green"
                        value={name}
                        onChange={e => {
                          const next = [...completeForm.attendees]
                          next[i] = e.target.value
                          setCompleteForm(p => ({ ...p, attendees: next }))
                        }}
                      />
                      {i > 0 && (
                        <button onClick={() => setCompleteForm(p => ({ ...p, attendees: p.attendees.filter((_, j) => j !== i) }))}
                          className="w-7 h-7 rounded-lg bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey flex items-center justify-center text-sm">
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Notes</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green resize-y min-h-[100px]"
                  placeholder="Key points discussed, feedback received, next steps..."
                  value={completeForm.notes}
                  onChange={e => setCompleteForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal">Improvement Areas</label>
                  <button onClick={addImprovement} className="text-[12px] text-eden-green font-semibold hover:underline">+ Add area</button>
                </div>
                <div className="space-y-3">
                  {completeForm.improvementAreas.map((area, i) => (
                    <div key={area.id} className="p-3 bg-eden-light rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 px-3 py-1.5 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green bg-white"
                          placeholder="Area name (e.g. Documentation consistency)"
                          value={area.area}
                          onChange={e => {
                            const next = [...completeForm.improvementAreas]
                            next[i] = { ...next[i], area: e.target.value }
                            setCompleteForm(p => ({ ...p, improvementAreas: next }))
                          }}
                        />
                        <input type="date"
                          className="px-3 py-1.5 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green bg-white w-[140px]"
                          value={area.targetDate}
                          onChange={e => {
                            const next = [...completeForm.improvementAreas]
                            next[i] = { ...next[i], targetDate: e.target.value }
                            setCompleteForm(p => ({ ...p, improvementAreas: next }))
                          }}
                        />
                        <button onClick={() => setCompleteForm(p => ({ ...p, improvementAreas: p.improvementAreas.filter((_, j) => j !== i) }))}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 hover:text-red-500 text-eden-grey flex items-center justify-center text-sm">
                          ✕
                        </button>
                      </div>
                      <textarea
                        className="w-full px-3 py-1.5 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green bg-white resize-none"
                        rows={2}
                        placeholder="Description (optional)"
                        value={area.description}
                        onChange={e => {
                          const next = [...completeForm.improvementAreas]
                          next[i] = { ...next[i], description: e.target.value }
                          setCompleteForm(p => ({ ...p, improvementAreas: next }))
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleComplete} disabled={saving}>
                {saving ? 'Saving…' : '✓ Mark Completed'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}

function PastReviewCard({
  review, kpiMap, accMap, onDelete, onToggleImprovement,
}: {
  review: PerformanceReview
  kpiMap: Record<string, KPI>
  accMap: Record<string, Accomplishment>
  onDelete: (r: PerformanceReview) => void
  onToggleImprovement: (r: PerformanceReview, areaId: string) => void
}) {
  const [showAccs, setShowAccs] = useState(false)

  return (
    <Card className="p-6" accent="none">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-1">{review.title}</h3>
          <div className="flex items-center gap-2 text-[13px] text-eden-grey flex-wrap">
            <span>Scheduled: {formatDate(review.scheduledDate)}</span>
            {review.completedDate && review.completedDate !== review.scheduledDate && (
              <span className="text-eden-green">· Held: {formatDate(review.completedDate)}</span>
            )}
            <span className="bg-eden-green-pale text-eden-green text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Completed</span>
          </div>
        </div>
        <button onClick={() => onDelete(review)}
          className="w-7 h-7 rounded-lg bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-sm shrink-0">
          ✕
        </button>
      </div>

      {/* Attendees */}
      {review.attendees?.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey mb-2">Attendees</p>
          <div className="flex flex-wrap gap-1.5">
            {review.attendees.map((name, i) => (
              <span key={i} className="text-[12px] bg-eden-light text-eden-dark px-3 py-1 rounded-full font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {review.notes && (
        <div className="mb-4 p-3 bg-eden-light rounded-lg">
          <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey mb-1">Notes</p>
          <p className="text-[13px] text-eden-dark">{review.notes}</p>
        </div>
      )}

      {/* Improvement areas */}
      {review.improvementAreas?.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey mb-2">Improvement Areas</p>
          <div className="space-y-2">
            {review.improvementAreas.map(area => (
              <div key={area.id} className={clsx('p-3 rounded-lg border', area.resolved ? 'border-eden-green/20 bg-eden-green-pale' : 'border-amber-200 bg-amber-50')}>
                <div className="flex items-start gap-2">
                  <input type="checkbox"
                    className="mt-0.5 accent-eden-green"
                    checked={area.resolved}
                    onChange={() => onToggleImprovement(review, area.id)}
                  />
                  <div className="flex-1">
                    <p className={clsx('text-[13px] font-semibold', area.resolved ? 'line-through text-eden-grey' : 'text-eden-dark')}>
                      {area.area}
                    </p>
                    {area.description && (
                      <p className="text-[12px] text-eden-grey mt-0.5">{area.description}</p>
                    )}
                    {area.targetDate && (
                      <p className="text-[11px] text-eden-grey mt-1">Target: {area.targetDate}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked KPIs + Accomplishments */}
      <div className="flex flex-wrap gap-1 mb-2">
        {review.linkedKpiIds?.map(id => kpiMap[id] && (
          <span key={id} className="text-[10px] bg-eden-green-pale text-eden-green px-2 py-0.5 rounded-full font-semibold">
            📈 {kpiMap[id].title}
          </span>
        ))}
      </div>
      {review.linkedAccomplishmentIds?.length > 0 && (
        <div>
          <button onClick={() => setShowAccs(p => !p)}
            className="text-[12px] text-eden-green font-semibold hover:underline">
            {showAccs ? '▾ Hide' : '▸ Show'} {review.linkedAccomplishmentIds.length} accomplishment{review.linkedAccomplishmentIds.length !== 1 ? 's' : ''}
          </button>
          {showAccs && (
            <div className="mt-2 flex flex-wrap gap-1">
              {review.linkedAccomplishmentIds.map(id => accMap[id] && (
                <span key={id} className="text-[10px] bg-eden-orange-pale text-eden-orange px-2 py-0.5 rounded-full font-semibold">
                  🏆 {accMap[id].title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
