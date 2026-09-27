import { useState, useEffect, useCallback } from 'react'

const HISTORY_KEY = 'habitTrackerHistory'

function loadHistoryMap() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // ignore
  }
  return {}
}

export function useWeekHistory() {
  const [historyMap, setHistoryMap] = useState(() => loadHistoryMap())

  useEffect(() => {
    function handleUpdate() {
      setHistoryMap(loadHistoryMap())
    }
    window.addEventListener('habitHistoryUpdated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('habitHistoryUpdated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  // Array of snapshots, sorted newest first by weekStart
  const history = Object.values(historyMap).sort((a, b) =>
    (b.weekStart || '').localeCompare(a.weekStart || '')
  )

  const getWeekByStart = useCallback(
    (weekStartDate) => {
      return historyMap[weekStartDate] || null
    },
    [historyMap]
  )

  return { history, getWeekByStart }
}
