import { useState, useCallback } from 'react'
import { getToday } from '../utils/devClock'

const ACCOUNT_KEY = 'habitTrackerAccount'

function loadSavedAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.name === 'string' && typeof parsed.createdAt === 'string') {
        return parsed
      }
    }
  } catch {
    // corrupted or inaccessible storage
  }
  return null
}

export function useAccount() {
  const [account, setAccount] = useState(() => loadSavedAccount())

  const createAccount = useCallback((name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return null

    const today = getToday()
    const isoDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')

    const newAccount = {
      name: trimmed,
      createdAt: isoDate,
    }

    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(newAccount))
    } catch {
      // storage quota exceeded or unavailable
    }

    setAccount(newAccount)
    return newAccount
  }, [])

  return { account, createAccount }
}
