'use client'
import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[12px] font-semibold text-eden-green border-[1.5px] border-eden-green px-3 py-1.5 rounded-lg hover:bg-eden-green-pale transition-all"
    >
      {copied ? '✓ Copied!' : '📋 Copy'}
    </button>
  )
}
