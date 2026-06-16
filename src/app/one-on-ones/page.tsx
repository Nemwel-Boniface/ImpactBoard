'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import type { OneOnOne, FollowUpItem, KPI, Accomplishment } from '@/types'
import { Button, Card } from '@/components/ui'
import { useToast, ToastContainer } from '@/hooks/useToast'
import clsx from 'clsx'
import { v4 as uuidv4 } from 'uuid'

const EMPTY_SCHEDULE = {
  scheduledDate: '',
  scheduledTime: '10:00',
  withName: '',
  withRole: '',
  agenda: '',
  linkedKpiIds: [] as string[],
  linkedAccomplishmentIds: [] as string[],
}

const EMPTY_COMPLETE = {
  notes: '',
  followUpItems: [] as { id: string; text: string; dueDate: string }[],
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function OneOnOnesPage() {
  const [meetings, setMeetings] = useState<OneOnOne[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editItem, setEditItem] = useState<OneOnOne | null>(null)
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE)

  const [completeOpen, setCompleteOpen] = useState(false)
  const [completingId, setCompletingId] = useState('')
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE)

  const [saving, setSaving] = useState(false)
  const { toasts, show } = useToast()

  const fetchData = useCallback(async () => {
    const [meetingsRes, kpisRes, accsRes] = await Promise.all([
      fetch('/api/one-on-ones').then(r => r.json()),
      fetch('/api/kpis').then(r => r.json()),
      fetch('/api/accomplishments').then(r => r.json()),
    ])
    setMeetings(meetingsRes.data ?? [])
    setKpis(kpisRes.data ?? [])
    setAccomplishments(accsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const upcoming = meetings
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

  const past = meetings
    .filter(m => m.status !== 'scheduled')
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())

  const openSchedule = () => {
    setEditItem(null)
    setScheduleForm({ ...EMPTY_SCHEDULE })
    setScheduleOpen(true)
  }

  const openEdit = (m: OneOnOne) => {
    setEditItem(m)
    setScheduleForm({
      scheduledDate: m.scheduledDate,
      scheduledTime: m.scheduledTime,
      withName: m.withName,
      withRole: m.withRole ?? '',
      agenda: m.agenda ?? '',
      linkedKpiIds: m.linkedKpiIds ?? [],
      linkedAccomplishmentIds: m.linkedAccomplishmentIds ?? [],
    })
    setScheduleOpen(true)
  }

  const handleSaveSchedule = async () => {
    if (!scheduleForm.withName.trim() || !scheduleForm.scheduledDate) return
    setSaving(true)
    try {
      if (editItem) {
        await fetch(`/api/one-on-ones/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleForm),
        })
        show('1:1 updated ✓')
      } else {
        await fetch('/api/one-on-ones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...scheduleForm, status: 'scheduled', followUpItems: [] }),
        })
        show('1:1 scheduled ✓')
      }
      setScheduleOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const openComplete = (m: OneOnOne) => {
    setCompletingId(m.id)
    setCompleteForm({ notes: '', followUpItems: [] })
    setCompleteOpen(true)
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      await fetch(`/api/one-on-ones/${completingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          notes: completeForm.notes,
          followUpItems: completeForm.followUpItems.map(f => ({
            ...f,
            completed: false,
          })),
        }),
      })
      show('1:1 marked as completed ✓')
      setCompleteOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (m: OneOnOne) => {
    if (!confirm(`Cancel 1:1 with ${m.withName}?`)) return
    await fetch(`/api/one-on-ones/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    show('1:1 cancelled', 'warning')
    fetchData()
  }

  const handleDelete = async (m: OneOnOne) => {
    if (!confirm(`Delete 1:1 with ${m.withName}?`)) return
    await fetch(`/api/one-on-ones/${m.id}`, { method: 'DELETE' })
    show('1:1 deleted', 'warning')
    fetchData()
  }

  const handleToggleFollowUp = async (meeting: OneOnOne, itemId: string) => {
    const updated = meeting.followUpItems.map(f =>
      f.id === itemId ? { ...f, completed: !f.completed, completedAt: !f.completed ? new Date().toISOString() : undefined } : f
    )
    await fetch(`/api/one-on-ones/${meeting.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followUpItems: updated }),
    })
    fetchData()
  }

  const toggleMultiSelect = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const addFollowUp = () =>
    setCompleteForm(p => ({
      ...p,
      followUpItems: [...p.followUpItems, { id: uuidv4(), text: '', dueDate: '' }],
    }))

  const kpiMap = Object.fromEntries(kpis.map(k => [k.id, k]))
  const accMap = Object.fromEntries(accomplishments.map(a => [a.id, a]))

  return (
    <div className="p-9">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-[22px] text-eden-dark">1:1 Meetings</h1>
          <p className="text-[13px] text-eden-grey mt-1">Schedule and track your 1:1 conversations</p>
        </div>
        <Button variant="primary" onClick={openSchedule}>+ Schedule 1:1</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-eden-light rounded-xl p-1 w-fit">
        {(['upcoming', 'past'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-5 py-2 rounded-lg text-[13px] font-semibold transition-all capitalize',
              activeTab === tab
                ? 'bg-white text-eden-dark shadow-sm'
                : 'text-eden-grey hover:text-eden-dark'
            )}
          >
            {tab}
            <span className={clsx(
              'ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full',
              activeTab === tab ? 'bg-eden-green text-white' : 'bg-eden-grey/20 text-eden-grey'
            )}>
              {tab === 'upcoming' ? upcoming.length : past.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[160px] animate-pulse shadow-card" />
          ))}
        </div>
      ) : activeTab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <div className="text-center py-16 text-eden-grey">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">No upcoming 1:1s</h3>
            <p className="mb-6">Schedule a 1:1 to stay aligned with your team.</p>
            <Button variant="primary" onClick={openSchedule}>+ Schedule 1:1</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(m => (
              <UpcomingCard
                key={m.id}
                meeting={m}
                kpiMap={kpiMap}
                accMap={accMap}
                onEdit={openEdit}
                onComplete={openComplete}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )
      ) : (
        past.length === 0 ? (
          <div className="text-center py-16 text-eden-grey">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">No past 1:1s</h3>
            <p>Completed and cancelled meetings will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {past.map(m => (
              <PastCard
                key={m.id}
                meeting={m}
                kpiMap={kpiMap}
                accMap={accMap}
                onToggleFollowUp={handleToggleFollowUp}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      )}

      {/* Schedule / Edit modal */}
      {scheduleOpen && (
        <div
          className="fixed inset-0 bg-eden-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setScheduleOpen(false)}
        >
          <div className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">
                {editItem ? 'Edit 1:1' : 'Schedule 1:1'}
              </h2>
              <button onClick={() => setScheduleOpen(false)}
                className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Date *</label>
                  <input type="date"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={scheduleForm.scheduledDate}
                    onChange={e => setScheduleForm(p => ({ ...p, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Time</label>
                  <input type="time"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={scheduleForm.scheduledTime}
                    onChange={e => setScheduleForm(p => ({ ...p, scheduledTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">With — Name *</label>
                  <input
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    placeholder="e.g. John Doe"
                    value={scheduleForm.withName}
                    onChange={e => setScheduleForm(p => ({ ...p, withName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">With — Role (optional)</label>
                  <input
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    placeholder="e.g. Engineering Manager"
                    value={scheduleForm.withRole}
                    onChange={e => setScheduleForm(p => ({ ...p, withRole: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Agenda (optional)</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green resize-y min-h-[70px]"
                  placeholder="What do you want to discuss?"
                  value={scheduleForm.agenda}
                  onChange={e => setScheduleForm(p => ({ ...p, agenda: e.target.value }))}
                />
              </div>
              {/* Link KPIs */}
              {kpis.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Link to KPIs (optional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {kpis.map(k => (
                      <button key={k.id}
                        onClick={() => setScheduleForm(p => ({ ...p, linkedKpiIds: toggleMultiSelect(p.linkedKpiIds, k.id) }))}
                        className={clsx(
                          'text-[12px] px-3 py-1 rounded-full border transition-all',
                          scheduleForm.linkedKpiIds.includes(k.id)
                            ? 'bg-eden-green text-white border-eden-green'
                            : 'bg-white text-eden-grey border-eden-green/20 hover:border-eden-green'
                        )}>
                        {k.title} — {k.weight}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Link Accomplishments */}
              {accomplishments.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Link to Accomplishments (optional)</label>
                  <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1">
                    {accomplishments.slice(0, 20).map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-[13px] cursor-pointer p-1.5 rounded hover:bg-eden-light">
                        <input type="checkbox"
                          className="accent-eden-green"
                          checked={scheduleForm.linkedAccomplishmentIds.includes(a.id)}
                          onChange={() => setScheduleForm(p => ({ ...p, linkedAccomplishmentIds: toggleMultiSelect(p.linkedAccomplishmentIds, a.id) }))}
                        />
                        <span className="text-eden-dark">{a.title}</span>
                        {a.week && <span className="text-eden-grey text-[11px]">· {a.week}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSchedule} disabled={saving}>
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
          <div className="bg-white rounded-[20px] w-full max-w-[540px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">Mark as Completed</h2>
              <button onClick={() => setCompleteOpen(false)}
                className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Notes — what was discussed?</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green resize-y min-h-[100px]"
                  placeholder="Key decisions, discussion points, context..."
                  value={completeForm.notes}
                  onChange={e => setCompleteForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal">Follow-up Items</label>
                  <button onClick={addFollowUp}
                    className="text-[12px] text-eden-green font-semibold hover:underline">
                    + Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {completeForm.followUpItems.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 px-3 py-2 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green"
                        placeholder="Follow-up action..."
                        value={item.text}
                        onChange={e => {
                          const next = [...completeForm.followUpItems]
                          next[i] = { ...next[i], text: e.target.value }
                          setCompleteForm(p => ({ ...p, followUpItems: next }))
                        }}
                      />
                      <input type="date"
                        className="px-3 py-2 border-[1.5px] border-eden-green/20 rounded-lg text-[13px] focus:outline-none focus:border-eden-green w-[140px]"
                        value={item.dueDate}
                        onChange={e => {
                          const next = [...completeForm.followUpItems]
                          next[i] = { ...next[i], dueDate: e.target.value }
                          setCompleteForm(p => ({ ...p, followUpItems: next }))
                        }}
                      />
                      <button onClick={() => setCompleteForm(p => ({ ...p, followUpItems: p.followUpItems.filter((_, j) => j !== i) }))}
                        className="w-7 h-7 rounded-lg bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey flex items-center justify-center text-sm">
                        ✕
                      </button>
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

function UpcomingCard({
  meeting, kpiMap, accMap, onEdit, onComplete, onCancel,
}: {
  meeting: OneOnOne
  kpiMap: Record<string, KPI>
  accMap: Record<string, Accomplishment>
  onEdit: (m: OneOnOne) => void
  onComplete: (m: OneOnOne) => void
  onCancel: (m: OneOnOne) => void
}) {
  const days = daysUntil(meeting.scheduledDate)
  const urgent = days <= 3

  return (
    <Card className="p-6" accent="orange">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-syne font-bold text-[18px] text-eden-dark">
              {formatDate(meeting.scheduledDate)}
            </span>
            <span className="text-eden-grey text-[13px]">@ {meeting.scheduledTime}</span>
            <span className={clsx(
              'text-[11px] font-bold px-2.5 py-1 rounded-full',
              urgent ? 'bg-eden-orange-pale text-eden-orange animate-pulse' : 'bg-eden-light text-eden-grey'
            )}>
              {days === 0 ? 'Today!' : days < 0 ? 'Overdue' : `In ${days} day${days !== 1 ? 's' : ''}`}
            </span>
          </div>
          <p className="text-[14px] text-eden-dark font-semibold mb-0.5">
            With: {meeting.withName}
            {meeting.withRole && <span className="text-eden-grey font-normal ml-1">· {meeting.withRole}</span>}
          </p>
          {meeting.agenda && (
            <p className="text-[13px] text-eden-grey mt-2 italic">📋 {meeting.agenda}</p>
          )}
          {/* Linked KPIs */}
          {meeting.linkedKpiIds?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {meeting.linkedKpiIds.map(id => kpiMap[id] && (
                <span key={id} className="text-[11px] bg-eden-green-pale text-eden-green px-2 py-0.5 rounded-full font-semibold">
                  📈 {kpiMap[id].title}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={() => onComplete(meeting)}>
            ✓ Mark Completed
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(meeting)}>
            ✎ Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => onCancel(meeting)}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}

function PastCard({
  meeting, kpiMap, accMap, onToggleFollowUp, onDelete,
}: {
  meeting: OneOnOne
  kpiMap: Record<string, KPI>
  accMap: Record<string, Accomplishment>
  onToggleFollowUp: (m: OneOnOne, itemId: string) => void
  onDelete: (m: OneOnOne) => void
}) {
  return (
    <Card className="p-6" accent="none">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-syne font-semibold text-[15px] text-eden-dark">
              {formatDate(meeting.scheduledDate)} @ {meeting.scheduledTime}
            </span>
            <span className={clsx(
              'text-[10px] font-bold px-2.5 py-0.5 rounded-full',
              meeting.status === 'completed' ? 'bg-eden-green-pale text-eden-green' : 'bg-slate-100 text-slate-500'
            )}>
              {meeting.status === 'completed' ? '✓ Completed' : 'Cancelled'}
            </span>
          </div>
          <p className="text-[13px] text-eden-grey">
            With: <span className="text-eden-dark font-semibold">{meeting.withName}</span>
            {meeting.withRole && <span className="ml-1">· {meeting.withRole}</span>}
          </p>
        </div>
        <button onClick={() => onDelete(meeting)}
          className="w-7 h-7 rounded-lg bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-sm shrink-0">
          ✕
        </button>
      </div>

      {meeting.notes && (
        <div className="mb-3 p-3 bg-eden-light rounded-lg">
          <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey mb-1">Notes</p>
          <p className="text-[13px] text-eden-dark">{meeting.notes}</p>
        </div>
      )}

      {meeting.followUpItems?.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey mb-2">Follow-up Items</p>
          <div className="space-y-1.5">
            {meeting.followUpItems.map(item => (
              <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                <input type="checkbox"
                  className="mt-0.5 accent-eden-green"
                  checked={item.completed}
                  onChange={() => onToggleFollowUp(meeting, item.id)}
                />
                <span className={clsx('text-[13px] flex-1', item.completed && 'line-through text-eden-grey')}>
                  {item.text}
                </span>
                {item.dueDate && (
                  <span className="text-[11px] text-eden-grey shrink-0">Due {item.dueDate}</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Linked pills */}
      <div className="flex flex-wrap gap-1">
        {meeting.linkedKpiIds?.map(id => kpiMap[id] && (
          <span key={id} className="text-[10px] bg-eden-green-pale text-eden-green px-2 py-0.5 rounded-full font-semibold">
            📈 {kpiMap[id].title}
          </span>
        ))}
        {meeting.linkedAccomplishmentIds?.map(id => accMap[id] && (
          <span key={id} className="text-[10px] bg-eden-orange-pale text-eden-orange px-2 py-0.5 rounded-full font-semibold">
            🏆 {accMap[id].title}
          </span>
        ))}
      </div>
    </Card>
  )
}
