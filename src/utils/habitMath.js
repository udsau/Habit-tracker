import { getToday } from './devClock.js'

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Internal helpers ────────────────────────────────────────────────────────

export function midnight(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function parseAccountDate(accountCreatedAt) {
  if (!accountCreatedAt) return null
  // "YYYY-MM-DD" → local midnight (avoid UTC-shift issues)
  return midnight(accountCreatedAt + 'T00:00:00')
}

/**
 * Returns Monday Date at 00:00:00 for the week containing the given date.
 */
export function getMondayOf(date = getToday()) {
  const d = new Date(date)
  const dayOfWeek = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Formats a Date object to "YYYY-MM-DD".
 */
export function toISODate(date) {
  const d = new Date(date)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

// ─── Public functions ────────────────────────────────────────────────────────

/**
 * Returns { completed, goal, percent } for a single habit.
 *
 * When weekDates (enriched date objects) and accountCreatedAt are provided,
 * only counts days that are on/after accountCreatedAt, and adjusts the effective
 * goal denominator proportionally for partial weeks.
 */
export function getWeeklyProgress(habit, weekDates = null, accountCreatedAt = null) {
  if (!weekDates || !accountCreatedAt) {
    // Legacy / summary mode — count all checked days vs the raw goal
    const completed = Object.values(habit.completedDays).filter(Boolean).length
    const goal      = habit.goal
    const percent   = goal > 0 ? Math.min(100, Math.round((completed / goal) * 100)) : 0
    return { completed, goal, percent }
  }

  const accountStart = parseAccountDate(accountCreatedAt)

  // Days this week on or after account creation
  const eligibleIndices = weekDates.reduce((acc, { date }, i) => {
    const d = midnight(date)
    if (!accountStart || d >= accountStart) acc.push(i)
    return acc
  }, [])

  const eligibleCount = eligibleIndices.length

  // Partial week: goal denominator scales based on eligible days (min 1, capped at eligibleCount)
  const effectiveGoal = eligibleCount < 7
    ? Math.min(eligibleCount, Math.max(1, Math.round(habit.goal * (eligibleCount / 7))))
    : habit.goal

  // Only count completions for days on/after accountCreatedAt
  const completed = eligibleIndices.reduce((n, i) => {
    return n + (habit.completedDays[DAY_KEYS[i]] ? 1 : 0)
  }, 0)

  const percent = effectiveGoal > 0
    ? Math.min(100, Math.round((completed / effectiveGoal) * 100))
    : 0

  // Return raw habit.goal so the display always shows the user's actual target.
  // effectiveGoal is only used internally to compute the percent for partial weeks.
  return { completed, goal: habit.goal, percent }
}

/**
 * Returns the average percent completion across all habits (0-100).
 * Accepts optional weekDates and accountCreatedAt for accurate partial-week math.
 */
export function getOverallProgress(habits, weekDates = null, accountCreatedAt = null) {
  if (!habits.length) return 0
  const total = habits.reduce(
    (sum, h) => sum + getWeeklyProgress(h, weekDates, accountCreatedAt).percent,
    0
  )
  return Math.round(total / habits.length)
}

/**
 * Returns 7 Date objects (Mon–Sun) starting from a specified Monday date.
 */
export function getWeekDatesForMonday(mondayDate) {
  const monday = midnight(mondayDate)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

/**
 * Returns an array of 7 Date objects for Mon–Sun of the current real week.
 */
export function getCurrentWeekDates() {
  return getWeekDatesForMonday(getMondayOf(getToday()))
}

/**
 * Returns 7 dates for a given Monday date enriched with metadata:
 *   { date: Date, isBeforeAccount: boolean }
 */
export function getEffectiveWeekDatesForMonday(mondayDate, accountCreatedAt = null) {
  const dates        = getWeekDatesForMonday(mondayDate)
  const accountStart = parseAccountDate(accountCreatedAt)

  return dates.map(date => ({
    date,
    isBeforeAccount: accountStart ? midnight(date) < accountStart : false,
  }))
}

/**
 * Returns the current week's 7 dates enriched with metadata.
 */
export function getEffectiveWeekDates(accountCreatedAt = null) {
  return getEffectiveWeekDatesForMonday(getMondayOf(getToday()), accountCreatedAt)
}

/**
 * Returns today's day key: 'Mon' | … | 'Sun' (Monday-first mapping).
 */
export function getTodayKey() {
  const jsDay = getToday().getDay()
  const mondayFirstIndex = jsDay === 0 ? 6 : jsDay - 1
  return DAY_KEYS[mondayFirstIndex]
}

/**
 * Returns how many habits are checked for today's real weekday.
 */
export function getCompletedToday(habits) {
  const today = getTodayKey()
  return habits.filter(h => h.completedDays[today]).length
}

/**
 * Returns true only if dayDate is today or yesterday AND on/after accountCreatedAt.
 * Returns false for future days, days 2+ in the past, and pre-account days.
 */
export function canToggleDay(dayDate, accountCreatedAt = null, referenceDate = null) {
  const today  = referenceDate ? midnight(referenceDate) : midnight(getToday())
  const target = midnight(dayDate)

  // Block days before account creation
  if (accountCreatedAt) {
    const accountStart = parseAccountDate(accountCreatedAt)
    if (target < accountStart) return false
  }

  const diffMs   = today.getTime() - target.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  return diffDays === 0 || diffDays === 1
}

/** Formats a Date as "Sep 22", "Oct 3", etc. */
export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Returns a formatted week range string for an array of 7 dates. */
export function formatWeekRangeForDates(dates) {
  if (!dates || dates.length < 7) return ''
  return `${formatShortDate(dates[0])} – ${formatShortDate(dates[6])}`
}

/** Returns a formatted week range string for the current week. */
export function getWeekRangeLabel() {
  const dates = getCurrentWeekDates()
  return formatWeekRangeForDates(dates)
}
