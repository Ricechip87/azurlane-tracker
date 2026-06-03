import { useState } from 'react'

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch {
      return initial
    }
  })

  const set = (updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  return [value, set]
}
