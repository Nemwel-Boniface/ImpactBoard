'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 flex items-center justify-center gap-2 border-[1.5px] border-eden-green text-eden-green font-syne font-semibold text-[13px] py-2.5 rounded-lg hover:bg-eden-green-pale transition-all no-print"
    >
      🖨 Print / PDF
    </button>
  )
}
