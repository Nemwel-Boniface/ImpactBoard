'use client'

import { useEffect, useRef, useState } from 'react'
import type { Member } from '@/types'

export function MemberPicker({
  allMembers,
  selectedIds,
  onChange,
  onCreateMember,
  placeholder = 'Search or type a name…',
}: {
  allMembers: Member[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onCreateMember: (name: string) => Promise<Member>
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selected = selectedIds
    .map(id => allMembers.find(m => m.id === id))
    .filter((m): m is Member => !!m)

  const q = query.trim().toLowerCase()
  const matches = allMembers
    .filter(m => !selectedIds.includes(m.id))
    .filter(m => !q || m.name.toLowerCase().includes(q))
    .slice(0, 6)

  const exactMatch = allMembers.some(m => m.name.toLowerCase() === q)
  const showAddNew = q.length > 0 && !exactMatch

  const select = (id: string) => {
    onChange([...selectedIds, id])
    setQuery('')
  }

  const handleCreate = async () => {
    if (!query.trim() || creating) return
    setCreating(true)
    try {
      const member = await onCreateMember(query.trim())
      onChange([...selectedIds, member.id])
      setQuery('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(m => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 text-[12px] bg-eden-green-pale text-eden-green px-2.5 py-1 rounded-full font-semibold"
            >
              {m.name}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter(id => id !== m.id))}
                className="hover:text-red-500 leading-none"
                aria-label={`Remove ${m.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        className="w-full px-3.5 py-2.5 border-[1.5px] border-eden-green/20 rounded-lg text-[14px] focus:outline-none focus:border-eden-green"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (matches.length > 0) select(matches[0].id)
            else if (showAddNew) handleCreate()
          }
        }}
      />

      {open && (matches.length > 0 || showAddNew) && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] border border-eden-green/10 max-h-[220px] overflow-y-auto">
          {matches.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => select(m.id)}
              className="w-full text-left px-3.5 py-2.5 text-[13px] text-eden-dark hover:bg-eden-light flex items-center justify-between"
            >
              <span className="font-medium">{m.name}</span>
              {m.role && <span className="text-eden-grey text-[11px]">{m.role}</span>}
            </button>
          ))}
          {showAddNew && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-3.5 py-2.5 text-[13px] text-eden-green font-semibold hover:bg-eden-green-pale flex items-center gap-1.5 border-t border-eden-green/10"
            >
              {creating ? 'Adding…' : `+ Add "${query.trim()}" as new member`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
