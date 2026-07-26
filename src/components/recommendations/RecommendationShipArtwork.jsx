import { useState } from 'react'
import { getRecommendationArtworkUrls } from '../../utils/recommendationCardArt.js'

export function RecommendationShipArtwork({
  character,
  name = character?.name || '',
  className = '',
  loading,
}) {
  const sources = getRecommendationArtworkUrls(character, import.meta.env.BASE_URL)
  const sourceIdentity = sources.join('\n')
  const [sourceState, setSourceState] = useState({ identity: sourceIdentity, index: 0 })
  const sourceIndex = sourceState.identity === sourceIdentity ? sourceState.index : 0
  const source = sources[sourceIndex] || ''

  if (!source) {
    return (
      <div className={`flex items-center justify-center text-2xl font-black text-gray-700 ${className}`}>
        {name.slice(0, 2) || '–'}
      </div>
    )
  }

  return (
    <img
      src={source}
      alt=""
      loading={loading}
      className={className}
      onError={() => setSourceState({ identity: sourceIdentity, index: sourceIndex + 1 })}
    />
  )
}
