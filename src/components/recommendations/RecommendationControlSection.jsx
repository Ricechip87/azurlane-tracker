export function RecommendationControlSection({ title, children }) {
  return (
    <section className="border-b border-neutral-700 p-3">
      <h3 className="mb-2 text-xs font-bold text-gray-300">{title}</h3>
      {children}
    </section>
  )
}
