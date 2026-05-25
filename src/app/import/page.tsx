'use client'
import { useState, useCallback } from 'react'
import type { CreateAccomplishment } from '@/types'
import { Button } from '@/components/ui'
import { useToast, ToastContainer } from '@/hooks/useToast'

interface PreviewRow extends CreateAccomplishment {
  _rowIndex: number
}

export default function ImportPage() {
  const [dragging, setDragging]   = useState(false)
  const [preview, setPreview]     = useState<PreviewRow[]>([])
  const [errors, setErrors]       = useState<string[]>([])
  const [total, setTotal]         = useState(0)
  const [step, setStep]           = useState<'idle' | 'preview' | 'done'>('idle')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<{ created: number; skipped: number } | null>(null)
  const { toasts, show }          = useToast()

  const uploadFile = useCallback(async (file: File) => {
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)

    const res  = await fetch('/api/import', { method: 'POST', body: fd })
    const json = await res.json()

    if (json.error) {
      show(json.error, 'error')
      setLoading(false)
      return
    }

    const { preview: rows, errors: errs, total: tot } = json.data
    setPreview(rows.map((r: CreateAccomplishment, i: number) => ({ ...r, _rowIndex: i })))
    setErrors(errs ?? [])
    setTotal(tot)
    setStep('preview')
    setLoading(false)
  }, [show])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const fd = new FormData()
    // Re-upload for confirm — in production you'd store a server-side preview token
    // For simplicity we POST preview data directly
    const res = await fetch('/api/accomplishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // batch via individual posts (simple approach)
      body: JSON.stringify(preview[0]),
    })

    // Batch insert all preview items
    let created = 0
    for (const item of preview) {
      const { _rowIndex, ...data } = item
      const r = await fetch('/api/accomplishments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'import' }),
      })
      if (r.ok) created++
    }

    setResult({ created, skipped: total - preview.length })
    setStep('done')
    setLoading(false)
    show(`${created} items imported successfully ✓`)
  }

  return (
    <div className="p-9 max-w-[680px]">
      <h1 className="font-syne font-bold text-[22px] text-eden-dark mb-6">
        Import from Excel / CSV
      </h1>

      {step === 'idle' && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-card p-9 text-center cursor-pointer transition-all ${
              dragging
                ? 'border-eden-green bg-eden-green-pale'
                : 'border-eden-green/30 bg-white hover:border-eden-green hover:bg-eden-green-pale/50'
            }`}
          >
            <div className="text-[40px] mb-3">📊</div>
            <h3 className="font-syne font-bold text-[17px] text-eden-dark mb-2">
              {loading ? 'Parsing file…' : 'Drop your Excel or CSV file here'}
            </h3>
            <p className="text-[13px] text-eden-grey mb-5">
              Supports .xlsx, .xls, .csv — auto-maps columns
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
              <span className="inline-flex items-center gap-2 bg-eden-green text-white font-syne font-semibold text-[13px] px-5 py-2.5 rounded-lg hover:bg-eden-green-light transition-all">
                Browse File
              </span>
            </label>
          </div>

          {/* Column guide */}
          <div className="bg-white rounded-card shadow-card p-6 mt-5">
            <h3 className="font-syne font-bold text-[15px] mb-4">📋 Expected Column Format</h3>
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-eden-green-pale">
                  <th className="px-3 py-2 text-left text-eden-green font-bold rounded-tl-lg">Column</th>
                  <th className="px-3 py-2 text-left text-eden-green font-bold">Required</th>
                  <th className="px-3 py-2 text-left text-eden-green font-bold rounded-tr-lg">Example Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['title', 'Yes', 'Claims API Integration'],
                  ['category', 'No', 'core / integration / side / leadership / infra'],
                  ['description', 'No', 'Built X that did Y resulting in Z...'],
                  ['impact', 'No', 'high / medium / low'],
                  ['metric_1', 'No', '40% faster'],
                  ['metric_2', 'No', '8 hrs/wk saved'],
                  ['date', 'No', '2025-02-15'],
                ].map(([col, req, ex]) => (
                  <tr key={col} className="border-b border-eden-light">
                    <td className="px-3 py-2 font-semibold">{col}</td>
                    <td className="px-3 py-2 text-eden-grey">{req}</td>
                    <td className="px-3 py-2 text-eden-grey">{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <a
              href="/api/import?template=true"
              className="inline-flex items-center gap-2 mt-4 text-[12px] font-semibold text-eden-green border-[1.5px] border-eden-green px-3 py-1.5 rounded-lg hover:bg-eden-green-pale transition-all"
            >
              ⬇ Download Template CSV
            </a>
          </div>
        </>
      )}

      {step === 'preview' && (
        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="font-syne font-bold text-[16px] mb-1">
            Preview — {preview.length} rows parsed
          </h3>
          <p className="text-[12px] text-eden-grey mb-5">
            {total} total rows, {errors.length} skipped. Review before confirming.
          </p>

          <div className="space-y-2 max-h-[320px] overflow-y-auto mb-5">
            {preview.map((row, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-eden-light rounded-lg text-[12px]">
                <span className="font-bold text-eden-grey w-5 shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold text-eden-dark">{row.title}</p>
                  <p className="text-eden-grey">{row.category} · {row.impact} impact · {row.date}</p>
                </div>
              </div>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-700">
              <strong>{errors.length} rows skipped:</strong>
              <ul className="mt-1 space-y-0.5">
                {errors.slice(0, 3).map((e, i) => <li key={i}>• {e}</li>)}
                {errors.length > 3 && <li>…and {errors.length - 3} more</li>}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('idle')}>← Back</Button>
            <Button variant="primary" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Importing…' : `✓ Import ${preview.length} Items`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="bg-white rounded-card shadow-card p-8 text-center">
          <div className="text-[48px] mb-3">🎉</div>
          <h3 className="font-syne font-bold text-[20px] text-eden-dark mb-2">Import Complete</h3>
          <p className="text-eden-grey mb-6">
            <strong className="text-eden-green">{result.created}</strong> items added ·{' '}
            <strong>{result.skipped}</strong> skipped (duplicates)
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep('idle')}>Import More</Button>
            <a href="/accomplishments" className="inline-flex items-center gap-2 bg-eden-green text-white font-syne font-semibold text-[13px] px-4 py-2.5 rounded-lg hover:bg-eden-green-light transition-all">
              View Accomplishments →
            </a>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
