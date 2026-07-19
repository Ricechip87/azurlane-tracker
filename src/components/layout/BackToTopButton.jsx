import { useEffect, useState } from 'react'
import { shouldShowBackToTop } from '../../utils/backToTop.js'

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(shouldShowBackToTop({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
      }))
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 right-5 z-30 rounded border border-neutral-500 bg-neutral-700/95 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40 transition-colors hover:bg-neutral-600"
    >
      맨위로
    </button>
  )
}
