import { useState } from 'react'
import { loadUserDataFromStorage, saveUserDataToStorage } from '../utils/userDataStorage.js'

export function useUserDataStorage(key) {
  const [initial] = useState(() => loadUserDataFromStorage(localStorage, key))
  const [value, setValue] = useState(initial.userData)

  const set = updater => {
    setValue(previous => {
      const next = typeof updater === 'function' ? updater(previous) : updater
      saveUserDataToStorage(localStorage, key, next)
      return next
    })
  }

  return [value, set, initial.error || initial.notice]
}
