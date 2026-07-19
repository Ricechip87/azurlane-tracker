import { useEffect } from 'react'

export function RecommendationDialog({ name, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto rounded-lg border border-neutral-600 bg-[#242424] p-4 text-gray-100 shadow-2xl shadow-black/70"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} 상세 정보`}
        onClick={event => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-3 top-3 text-xl text-gray-500 hover:text-white" aria-label="닫기">×</button>
        {children}
      </div>
    </div>
  )
}

export function RecommendationDetails({ reason, sourceSections }) {
  return (
    <div className="mt-4 space-y-4 text-sm leading-6">
      <section>
        <h5 className="mb-1 text-xs font-bold text-gray-400">추천 사유</h5>
        <p className="whitespace-pre-line rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-100">{reason}</p>
      </section>
      <section>
        <h5 className="mb-1 text-xs font-bold text-gray-400">입수 방법</h5>
        {sourceSections.length > 0 ? (
          <div className="space-y-2">
            {sourceSections.map(section => (
              <div key={section.label} className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-200">
                <div className="mb-1 text-[11px] font-bold text-gray-400">{section.label}</div>
                <ul className="space-y-1">
                  {section.sources.map(source => <li key={source} className="flex gap-2"><span className="text-gray-500">•</span><span>{source}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-gray-500">확인된 입수처 정보가 없습니다.</p>
        )}
      </section>
    </div>
  )
}
