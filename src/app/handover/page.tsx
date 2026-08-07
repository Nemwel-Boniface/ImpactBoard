'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import type {
  Handover, HandoverItem, HandoverItemPriority, HandoverItemStatus,
  Member, KPI, Accomplishment,
} from '@/types'
import { Button, Card } from '@/components/ui'
import { MemberPicker } from '@/components/MemberPicker'
import { useToast, ToastContainer } from '@/hooks/useToast'
import clsx from 'clsx'
import { v4 as uuidv4 } from 'uuid'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

const EMPTY_HANDOVER_FORM = {
  title: '',
  reason: '',
  startDate: '',
  endDate: '',
  memberIds: [] as string[],
}

const EMPTY_ITEM_FORM = {
  title: '',
  context: '',
  priority: 'medium' as HandoverItemPriority,
  assigneeMemberId: '',
  linkedKpiIds: [] as string[],
  linkedAccomplishmentIds: [] as string[],
}

const PRIORITY_STYLES: Record<HandoverItemPriority, string> = {
  high:   'bg-red-50 text-red-600',
  medium: 'bg-eden-orange-pale text-eden-orange',
  low:    'bg-slate-100 text-slate-500',
}

const STATUS_STYLES: Record<HandoverItemStatus, string> = {
  pending:     'bg-slate-100 text-slate-500',
  in_progress: 'bg-eden-orange-pale text-eden-orange',
  done:        'bg-eden-green-pale text-eden-green',
}

const STATUS_LABELS: Record<HandoverItemStatus, string> = {
  pending: 'Pending', in_progress: 'In Progress', done: 'Done',
}

const NEXT_STATUS: Record<HandoverItemStatus, HandoverItemStatus> = {
  pending: 'in_progress', in_progress: 'done', done: 'pending',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const toggleMultiSelect = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

export default function HandoverPage() {
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active')

  const [handoverModalOpen, setHandoverModalOpen] = useState(false)
  const [editingHandover, setEditingHandover] = useState<Handover | null>(null)
  const [handoverForm, setHandoverForm] = useState(EMPTY_HANDOVER_FORM)

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemHandoverId, setItemHandoverId] = useState('')
  const [editingItem, setEditingItem] = useState<HandoverItem | null>(null)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM)

  const [saving, setSaving] = useState(false)
  const { toasts, show } = useToast()

  const fetchData = useCallback(async () => {
    const [hRes, mRes, kRes, aRes] = await Promise.all([
      fetch('/api/handovers').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
      fetch('/api/kpis').then(r => r.json()),
      fetch('/api/accomplishments').then(r => r.json()),
    ])
    setHandovers(hRes.data ?? [])
    setMembers(mRes.data ?? [])
    setKpis(kRes.data ?? [])
    setAccomplishments(aRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const active = handovers.filter(h => h.status === 'active')
  const ended  = handovers.filter(h => h.status === 'ended')

  const memberMap = Object.fromEntries(members.map(m => [m.id, m]))
  const kpiMap = Object.fromEntries(kpis.map(k => [k.id, k]))
  const accMap = Object.fromEntries(accomplishments.map(a => [a.id, a]))

  const handleCreateMember = async (name: string): Promise<Member> => {
    const res = await fetch('/api/members', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ name }) })
    const json = await res.json()
    const member = json.data as Member
    setMembers(prev => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)))
    return member
  }

  // ── Handover CRUD ─────────────────────────────────────────────

  const openCreateHandover = () => {
    setEditingHandover(null)
    setHandoverForm({ ...EMPTY_HANDOVER_FORM })
    setHandoverModalOpen(true)
  }

  const openEditHandover = (h: Handover) => {
    setEditingHandover(h)
    setHandoverForm({
      title: h.title, reason: h.reason ?? '', startDate: h.startDate, endDate: h.endDate,
      memberIds: h.memberIds,
    })
    setHandoverModalOpen(true)
  }

  const handleSaveHandover = async () => {
    if (!handoverForm.title.trim() || !handoverForm.startDate || !handoverForm.endDate) return
    setSaving(true)
    try {
      if (editingHandover) {
        await fetch(`/api/handovers/${editingHandover.id}`, {
          method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(handoverForm),
        })
        show('Handover updated ✓')
      } else {
        await fetch('/api/handovers', {
          method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(handoverForm),
        })
        show('Handover created ✓')
      }
      setHandoverModalOpen(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleEndHandover = async (h: Handover) => {
    if (!confirm(`End "${h.title}" and reassign all its items back to you?`)) return
    await fetch(`/api/handovers/${h.id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ action: 'end' }) })
    show('Handover ended — items reassigned to you ✓')
    fetchData()
  }

  const handleDeleteHandover = async (h: Handover) => {
    if (!confirm(`Delete "${h.title}"? This removes its full history.`)) return
    await fetch(`/api/handovers/${h.id}`, { method: 'DELETE' })
    show('Handover deleted', 'warning')
    fetchData()
  }

  const handleMembersChange = async (h: Handover, newIds: string[]) => {
    const removed = h.memberIds.filter(id => !newIds.includes(id))
    const added = newIds.filter(id => !h.memberIds.includes(id))
    for (const memberId of removed) {
      await fetch(`/api/handovers/${h.id}`, {
        method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ action: 'removeMember', memberId }),
      })
    }
    if (added.length > 0) {
      await fetch(`/api/handovers/${h.id}`, {
        method: 'PUT', headers: JSON_HEADERS,
        body: JSON.stringify({ memberIds: [...h.memberIds.filter(id => !removed.includes(id)), ...added] }),
      })
    }
    fetchData()
  }

  // ── Item CRUD (embedded in handover.items) ───────────────────

  const openAddItem = (handoverId: string) => {
    setItemHandoverId(handoverId)
    setEditingItem(null)
    setItemForm({ ...EMPTY_ITEM_FORM })
    setItemModalOpen(true)
  }

  const openEditItem = (h: Handover, item: HandoverItem) => {
    setItemHandoverId(h.id)
    setEditingItem(item)
    setItemForm({
      title: item.title,
      context: item.context,
      priority: item.priority,
      assigneeMemberId: item.assigneeMemberId ?? '',
      linkedKpiIds: item.linkedKpiIds ?? [],
      linkedAccomplishmentIds: item.linkedAccomplishmentIds ?? [],
    })
    setItemModalOpen(true)
  }

  const saveItems = async (handoverId: string, items: HandoverItem[]) => {
    await fetch(`/api/handovers/${handoverId}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ items }) })
    fetchData()
  }

  const handleSaveItem = async () => {
    if (!itemForm.title.trim()) return
    const handover = handovers.find(h => h.id === itemHandoverId)
    if (!handover) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      let items: HandoverItem[]
      if (editingItem) {
        items = handover.items.map(i => i.id === editingItem.id
          ? {
              ...i,
              title: itemForm.title.trim(),
              context: itemForm.context.trim(),
              priority: itemForm.priority,
              assigneeMemberId: itemForm.assigneeMemberId || null,
              linkedKpiIds: itemForm.linkedKpiIds,
              linkedAccomplishmentIds: itemForm.linkedAccomplishmentIds,
              updatedAt: now,
            }
          : i)
      } else {
        const newItem: HandoverItem = {
          id: uuidv4(),
          title: itemForm.title.trim(),
          context: itemForm.context.trim(),
          priority: itemForm.priority,
          status: 'pending',
          assigneeMemberId: itemForm.assigneeMemberId || null,
          linkedKpiIds: itemForm.linkedKpiIds,
          linkedAccomplishmentIds: itemForm.linkedAccomplishmentIds,
          createdAt: now,
          updatedAt: now,
        }
        items = [...handover.items, newItem]
      }
      await saveItems(handover.id, items)
      show(editingItem ? 'Item updated ✓' : 'Item added ✓')
      setItemModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (h: Handover, item: HandoverItem) => {
    if (!confirm(`Remove "${item.title}" from this handover?`)) return
    await saveItems(h.id, h.items.filter(i => i.id !== item.id))
    show('Item removed', 'warning')
  }

  const handleCycleStatus = async (h: Handover, item: HandoverItem) => {
    const items = h.items.map(i => i.id === item.id
      ? { ...i, status: NEXT_STATUS[i.status], updatedAt: new Date().toISOString() }
      : i)
    await saveItems(h.id, items)
  }

  return (
    <div className="p-9">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-[22px] text-eden-dark">Handover</h1>
          <p className="text-[13px] text-eden-grey mt-1">Hand off items and context before you go on leave</p>
        </div>
        <Button variant="primary" onClick={openCreateHandover}>+ New Handover</Button>
      </div>

      <div className="flex gap-1 mb-6 bg-eden-light rounded-xl p-1 w-fit">
        {(['active', 'ended'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-5 py-2 rounded-lg text-[13px] font-semibold transition-all capitalize',
              activeTab === tab ? 'bg-white text-eden-dark shadow-sm' : 'text-eden-grey hover:text-eden-dark'
            )}
          >
            {tab}
            <span className={clsx(
              'ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full',
              activeTab === tab ? 'bg-eden-green text-white' : 'bg-eden-grey/20 text-eden-grey'
            )}>
              {tab === 'active' ? active.length : ended.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-card h-[220px] animate-pulse shadow-card" />
          ))}
        </div>
      ) : activeTab === 'active' ? (
        active.length === 0 ? (
          <div className="text-center py-16 text-eden-grey">
            <div className="text-5xl mb-4">🧳</div>
            <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">No active handovers</h3>
            <p className="mb-6">Going on leave? Set up a handover so your team has full context.</p>
            <Button variant="primary" onClick={openCreateHandover}>+ New Handover</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {active.map(h => (
              <HandoverCard
                key={h.id} handover={h} memberMap={memberMap} members={members}
                kpiMap={kpiMap} accMap={accMap}
                onEdit={openEditHandover} onEnd={handleEndHandover} onDelete={handleDeleteHandover}
                onMembersChange={handleMembersChange} onCreateMember={handleCreateMember}
                onAddItem={openAddItem} onEditItem={openEditItem} onDeleteItem={handleDeleteItem}
                onCycleStatus={handleCycleStatus}
              />
            ))}
          </div>
        )
      ) : (
        ended.length === 0 ? (
          <div className="text-center py-16 text-eden-grey">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-syne font-bold text-[18px] text-eden-dark mb-2">No ended handovers</h3>
            <p>Closed-out handovers will appear here for reference.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {ended.map(h => (
              <HandoverCard
                key={h.id} handover={h} memberMap={memberMap} members={members}
                kpiMap={kpiMap} accMap={accMap}
                onEdit={openEditHandover} onEnd={handleEndHandover} onDelete={handleDeleteHandover}
                onMembersChange={handleMembersChange} onCreateMember={handleCreateMember}
                onAddItem={openAddItem} onEditItem={openEditItem} onDeleteItem={handleDeleteItem}
                onCycleStatus={handleCycleStatus}
              />
            ))}
          </div>
        )
      )}

      {/* Create / Edit handover modal */}
      {handoverModalOpen && (
        <div
          className="fixed inset-0 bg-eden-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setHandoverModalOpen(false)}
        >
          <div className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">
                {editingHandover ? 'Edit Handover' : 'New Handover'}
              </h2>
              <button onClick={() => setHandoverModalOpen(false)}
                className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Title *</label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  placeholder="e.g. Annual Leave — August 2026"
                  value={handoverForm.title}
                  onChange={e => setHandoverForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Reason (optional)</label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  placeholder="e.g. Annual leave, sick leave, travel"
                  value={handoverForm.reason}
                  onChange={e => setHandoverForm(p => ({ ...p, reason: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">From *</label>
                  <input type="date"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={handoverForm.startDate}
                    onChange={e => setHandoverForm(p => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">To *</label>
                  <input type="date"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                    value={handoverForm.endDate}
                    onChange={e => setHandoverForm(p => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Hand over to</label>
                <MemberPicker
                  allMembers={members}
                  selectedIds={handoverForm.memberIds}
                  onChange={ids => setHandoverForm(p => ({ ...p, memberIds: ids }))}
                  onCreateMember={handleCreateMember}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="outline" onClick={() => setHandoverModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveHandover} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit item modal */}
      {itemModalOpen && (
        <div
          className="fixed inset-0 bg-eden-dark/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setItemModalOpen(false)}
        >
          <div className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne font-extrabold text-[20px] text-eden-dark">
                {editingItem ? 'Edit Item' : 'Add Handover Item'}
              </h2>
              <button onClick={() => setItemModalOpen(false)}
                className="w-9 h-9 rounded-[10px] bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Title *</label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
                  placeholder="e.g. HIMS Portal integration follow-up"
                  value={itemForm.title}
                  onChange={e => setItemForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Context — what do they need to know?</label>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green resize-y min-h-[110px]"
                  placeholder="Current state, blockers, who to contact, where to find things..."
                  value={itemForm.context}
                  onChange={e => setItemForm(p => ({ ...p, context: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Priority</label>
                  <div className="flex gap-1.5">
                    {(['high', 'medium', 'low'] as const).map(p => (
                      <button key={p} type="button"
                        onClick={() => setItemForm(prev => ({ ...prev, priority: p }))}
                        className={clsx(
                          'flex-1 text-[12px] font-semibold px-2 py-2 rounded-lg border capitalize transition-all',
                          itemForm.priority === p
                            ? 'bg-eden-green text-white border-eden-green'
                            : 'bg-white text-eden-grey border-eden-green/20 hover:border-eden-green'
                        )}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Assignee</label>
                  <select
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green bg-white"
                    value={itemForm.assigneeMemberId}
                    onChange={e => setItemForm(p => ({ ...p, assigneeMemberId: e.target.value }))}
                  >
                    <option value="">Me (unassigned)</option>
                    {handovers.find(h => h.id === itemHandoverId)?.memberIds.map(id => (
                      <option key={id} value={id}>{memberMap[id]?.name ?? 'Unknown'}</option>
                    ))}
                  </select>
                </div>
              </div>
              {kpis.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Link to KPIs (optional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {kpis.map(k => (
                      <button key={k.id} type="button"
                        onClick={() => setItemForm(p => ({ ...p, linkedKpiIds: toggleMultiSelect(p.linkedKpiIds, k.id) }))}
                        className={clsx(
                          'text-[12px] px-3 py-1 rounded-full border transition-all',
                          itemForm.linkedKpiIds.includes(k.id)
                            ? 'bg-eden-green text-white border-eden-green'
                            : 'bg-white text-eden-grey border-eden-green/20 hover:border-eden-green'
                        )}>
                        {k.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {accomplishments.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-eden-charcoal mb-1.5">Link to Accomplishments (optional)</label>
                  <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1">
                    {accomplishments.slice(0, 20).map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-[13px] cursor-pointer p-1.5 rounded hover:bg-eden-light">
                        <input type="checkbox"
                          className="accent-eden-green"
                          checked={itemForm.linkedAccomplishmentIds.includes(a.id)}
                          onChange={() => setItemForm(p => ({ ...p, linkedAccomplishmentIds: toggleMultiSelect(p.linkedAccomplishmentIds, a.id) }))}
                        />
                        <span className="text-eden-dark">{a.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="outline" onClick={() => setItemModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveItem} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save Item'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}

function HandoverCard({
  handover, memberMap, members, kpiMap, accMap,
  onEdit, onEnd, onDelete, onMembersChange, onCreateMember,
  onAddItem, onEditItem, onDeleteItem, onCycleStatus,
}: {
  handover: Handover
  memberMap: Record<string, Member>
  members: Member[]
  kpiMap: Record<string, KPI>
  accMap: Record<string, Accomplishment>
  onEdit: (h: Handover) => void
  onEnd: (h: Handover) => void
  onDelete: (h: Handover) => void
  onMembersChange: (h: Handover, ids: string[]) => void
  onCreateMember: (name: string) => Promise<Member>
  onAddItem: (handoverId: string) => void
  onEditItem: (h: Handover, item: HandoverItem) => void
  onDeleteItem: (h: Handover, item: HandoverItem) => void
  onCycleStatus: (h: Handover, item: HandoverItem) => void
}) {
  const isActive = handover.status === 'active'
  const assignedMembers = handover.memberIds.map(id => memberMap[id]).filter((m): m is Member => !!m)

  return (
    <Card className="p-6" accent={isActive ? 'orange' : 'none'}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <span className="font-syne font-bold text-[17px] text-eden-dark">{handover.title}</span>
            <span className={clsx(
              'text-[10px] font-bold px-2.5 py-0.5 rounded-full',
              isActive ? 'bg-eden-orange-pale text-eden-orange' : 'bg-eden-green-pale text-eden-green'
            )}>
              {isActive ? '● Active' : '✓ Ended'}
            </span>
          </div>
          <p className="text-[13px] text-eden-grey">
            {formatDate(handover.startDate)} → {formatDate(handover.endDate)}
            {handover.reason && <span className="italic ml-1">· {handover.reason}</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(handover)}
            className="w-8 h-8 rounded-lg bg-eden-light hover:bg-eden-green-pale hover:text-eden-green text-eden-grey transition-all flex items-center justify-center text-sm">
            ✎
          </button>
          {isActive && (
            <Button variant="outline" size="sm" onClick={() => onEnd(handover)}>End & Reclaim</Button>
          )}
          <button onClick={() => onDelete(handover)}
            className="w-8 h-8 rounded-lg bg-eden-light hover:bg-red-50 hover:text-red-500 text-eden-grey transition-all flex items-center justify-center text-sm">
            ✕
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="mb-4 pb-4 border-b border-eden-green/10">
        <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey mb-2">Handed over to</p>
        {isActive ? (
          <MemberPicker
            allMembers={members}
            selectedIds={handover.memberIds}
            onChange={ids => onMembersChange(handover, ids)}
            onCreateMember={onCreateMember}
            placeholder="Search a member or type a new name…"
          />
        ) : assignedMembers.length === 0 ? (
          <p className="text-[13px] text-eden-grey">No members were assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {assignedMembers.map(m => (
              <span key={m.id} className="text-[12px] bg-eden-light text-eden-grey px-2.5 py-1 rounded-full font-semibold">
                {m.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-eden-grey">
          Items ({handover.items.length})
        </p>
        {isActive && (
          <button onClick={() => onAddItem(handover.id)} className="text-[12px] text-eden-green font-semibold hover:underline">
            + Add item
          </button>
        )}
      </div>

      {handover.items.length === 0 ? (
        <p className="text-[13px] text-eden-grey py-3">No items yet — add what you're handing off.</p>
      ) : (
        <div className="space-y-2.5">
          {handover.items.map(item => (
            <div key={item.id} className="p-3.5 bg-eden-light rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <button onClick={() => onCycleStatus(handover, item)}
                      className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full transition-all', STATUS_STYLES[item.status])}>
                      {STATUS_LABELS[item.status]}
                    </button>
                    <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', PRIORITY_STYLES[item.priority])}>
                      {item.priority}
                    </span>
                    <span className="font-syne font-semibold text-[14px] text-eden-dark">{item.title}</span>
                  </div>
                  <p className="text-[13px] text-eden-grey">
                    → {item.assigneeMemberId ? (memberMap[item.assigneeMemberId]?.name ?? 'Unknown') : 'Me'}
                  </p>
                  {item.context && <p className="text-[13px] text-eden-dark mt-1.5 whitespace-pre-wrap">{item.context}</p>}
                  {(item.linkedKpiIds?.length || item.linkedAccomplishmentIds?.length) ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.linkedKpiIds?.map(id => kpiMap[id] && (
                        <span key={id} className="text-[10px] bg-eden-green-pale text-eden-green px-2 py-0.5 rounded-full font-semibold">
                          📈 {kpiMap[id].title}
                        </span>
                      ))}
                      {item.linkedAccomplishmentIds?.map(id => accMap[id] && (
                        <span key={id} className="text-[10px] bg-eden-orange-pale text-eden-orange px-2 py-0.5 rounded-full font-semibold">
                          🏆 {accMap[id].title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => onEditItem(handover, item)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-eden-green-pale hover:text-eden-green text-eden-grey flex items-center justify-center text-sm">
                    ✎
                  </button>
                  <button onClick={() => onDeleteItem(handover, item)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 hover:text-red-500 text-eden-grey flex items-center justify-center text-sm">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
