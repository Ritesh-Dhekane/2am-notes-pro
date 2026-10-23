// View-only PDF on every device: pdf.js on canvas (PdfCanvas, loaded on first use), never a PDF URL the
// browser could save or print from its own viewer.

import { lazy, Suspense } from 'react'

const PdfCanvas = lazy(() => import('./PdfCanvas.jsx'))

export default function PdfView({ data, title, compact }) {
  if (!data?.content) return null
  return (
    <Suspense fallback={<div className={`rounded-xl border border-line bg-surface-2 ${compact ? 'h-[60vh]' : 'h-[78vh]'}`} aria-busy="true" />}>
      <PdfCanvas data={data} title={title} compact={compact} />
    </Suspense>
  )
}
