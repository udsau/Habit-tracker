import { useState, useEffect } from 'react'
import { getMondayOf, toISODate, midnight } from '../utils/habitMath'
import { getToday } from '../utils/devClock'

const STORAGE_KEY     = 'habitTrackerData'
const LAST_WEEK_KEY   = 'habitTrackerLastWeekStart'
const HISTORY_KEY     = 'habitTrackerHistory'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function emptyDays() {
  return Object.fromEntries(DAYS.map(d => [d, false]))
}

function makeHabit(id, name, goal) {
  return { id, name, goal, completedDays: emptyDays() }
}

const DEFAULT_HABITS = [
  makeHabit('1', 'Morning Routine', 5),
  makeHabit('2', 'Workout',         4),
  makeHabit('3', 'Reading',         6),
  makeHabit('4', 'Meditation',      5),
  makeHabit('5', 'Sleep 7+ Hours',  7),
]

function loadRawHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // corrupted storage — fall through to defaults
  }
  return DEFAULT_HABITS
}

function loadHistoryObject() {
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

/**
 * Initializes habit state and detects if a new week rollover has occurred
 * since the app was last opened. If so, archives the previous week snapshot
 * and clears checkmarks for the fresh week.
 */
function initializeHabitsWithRollover() {
  const currentMondayISO = toISODate(getMondayOf(getToday()))
  let lastWeekStart = null

  try {
    lastWeekStart = localStorage.getItem(LAST_WEEK_KEY)
  } catch {
    // localStorage unavailable
  }

  const existingHabits = loadRawHabits()

  // First time running — no prior week stored yet
  if (!lastWeekStart) {
    try {
      localStorage.setItem(LAST_WEEK_KEY, currentMondayISO)
    } catch {
      // ignore
    }
    return existingHabits
  }

  // Same week — no rollover
  if (lastWeekStart === currentMondayISO) {
    return existingHabits
  }

  // A new week has begun! Archive the previous week's snapshot before resetting
  try {
    const prevMondayDate = midnight(lastWeekStart + 'T00:00:00')
    const prevSundayDate = new Date(prevMondayDate)
    prevSundayDate.setDate(prevSundayDate.getDate() + 6)
    const prevSundayISO = toISODate(prevSundayDate)

    const history = loadHistoryObject()
    history[lastWeekStart] = {
      weekStart: lastWeekStart,
      weekEnd: prevSundayISO,
      habits: JSON.parse(JSON.stringify(existingHabits)),
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))

    // Reset current week's checkmarks
    const freshHabits = existingHabits.map(h => ({
      ...h,
      completedDays: emptyDays(),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshHabits))
    localStorage.setItem(LAST_WEEK_KEY, currentMondayISO)

    return freshHabits
  } catch {
    return existingHabits
  }
}

export function useHabits() {
  const [habits, setHabits] = useState(() => initializeHabitsWithRollover())
  const [activeWeekStart, setActiveWeekStart] = useState(() => {
    try {
      return localStorage.getItem(LAST_WEEK_KEY) || toISODate(getMondayOf(getToday()))
    } catch {
      return toISODate(getMondayOf(getToday()))
    }
  })

  // Auto-save on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
    } catch {
      // storage quota exceeded — silently ignore
    }
  }, [habits])

  function toggleDay(habitId, day) {
    setHabits(prev =>
      prev.map(h =>
        h.id === habitId
          ? { ...h, completedDays: { ...h.completedDays, [day]: !h.completedDays[day] } }
          : h
      )
    )
  }

  function addHabit(name, goal) {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = Date.now().toString()
    setHabits(prev => [...prev, makeHabit(id, trimmed, Math.min(7, Math.max(1, Number(goal) || 7)))])
  }

  function deleteHabit(habitId) {
    setHabits(prev => prev.filter(h => h.id !== habitId))
  }

  function updateHabitGoal(habitId, newGoal) {
    const parsed = Math.min(7, Math.max(1, Number(newGoal) || 7))
    setHabits(prev =>
      prev.map(h => (h.id === habitId ? { ...h, goal: parsed } : h))
    )
  }

  /** Replaces the entire habits array with a new order (from dnd-kit's arrayMove). */
  function reorderHabits(newOrderArray) {
    setHabits(newOrderArray)
  }

  return {
    habits,
    toggleDay,
    addHabit,
    deleteHabit,
    updateHabitGoal,
    reorderHabits,
    activeWeekStart,
  }
}
