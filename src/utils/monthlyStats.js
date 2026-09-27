import { getToday } from './devClock.js'
import {
  getMondayOf,
  midnight,
  toISODate,
  formatShortDate,
  getEffectiveWeekDatesForMonday,
  getWeeklyProgress,
  getOverallProgress,
} from './habitMath.js'

/**
 * Returns an array of weekly score entries for all weeks overlapping the given month
 * that have actually started (i.e. week's Monday <= today).
 *
 * Each entry has:
 *   - weekLabel: "Week 1", "Week 2", ...
 *   - range: "Sep 28 – Oct 4"
 *   - percent: 0-100 overall score for that week
 *   - weekStart: "YYYY-MM-DD"
 *   - weekEnd: "YYYY-MM-DD"
 *   - habits: [...]
 *
 * Weeks fully in the future are excluded entirely.
 */
export function getMonthlyWeeklyScores(
  monthDate,
  history = [],
  currentWeekData = [],
  currentWeekStart = null,
  accountCreatedAt = null
) {
  const target = new Date(monthDate)
  const year = target.getFullYear()
  const month = target.getMonth() // 0-indexed

  // First & last day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const lastDayOfMonth = new Date(year, month + 1, 0)
  lastDayOfMonth.setHours(23, 59, 59, 999)

  const today = midnight(getToday())

  // Find the Monday of the week containing the 1st of the month
  let curMonday = getMondayOf(firstDayOfMonth)
  curMonday.setHours(0, 0, 0, 0)

  // Normalize history map for fast lookup
  const historyMap = {}
  if (Array.isArray(history)) {
    for (const item of history) {
      if (item && item.weekStart) {
        historyMap[item.weekStart] = item
      }
    }
  } else if (history && typeof history === 'object') {
    Object.assign(historyMap, history)
  }

  const results = []
  let weekIndex = 1

  // Iterate week by week across the month
  while (curMonday <= lastDayOfMonth) {
    const weekMonday = new Date(curMonday)
    const weekSunday = new Date(curMonday)
    weekSunday.setDate(weekSunday.getDate() + 6)
    weekSunday.setHours(23, 59, 59, 999)

    // Check if this week overlaps the target month
    if (weekSunday >= firstDayOfMonth && weekMonday <= lastDayOfMonth) {
      // ONLY include weeks that have actually started (Monday <= today)
      if (weekMonday > today) {
        // Fully in the future — do not include
        break
      }

      const mondayISO = toISODate(weekMonday)
      const sundayISO = toISODate(weekSunday)

      // Resolve habit data for this week
      let weekHabits = []
      if (currentWeekStart && mondayISO === currentWeekStart) {
        weekHabits = currentWeekData || []
      } else if (historyMap[mondayISO] && historyMap[mondayISO].habits) {
        weekHabits = historyMap[mondayISO].habits
      }

      const weekDates = getEffectiveWeekDatesForMonday(weekMonday, accountCreatedAt)
      const percent = getOverallProgress(weekHabits, weekDates, accountCreatedAt)

      results.push({
        weekLabel: `Week ${weekIndex}`,
        range: `${formatShortDate(weekMonday)} – ${formatShortDate(weekSunday)}`,
        percent,
        weekStart: mondayISO,
        weekEnd: sundayISO,
        habits: weekHabits,
        dates: weekDates,
      })

      weekIndex += 1
    }

    curMonday.setDate(curMonday.getDate() + 7)
  }

  return results
}

/**
 * Computes monthly statistics across the weeks in `monthlyWeeklyScores`:
 *   - mostConsistent: habit with the highest average completion %
 *   - mostInconsistent: habit with the lowest average completion %
 *   - monthlyScore: overall average completion % across all habits and weeks
 *   - activeHabitsCount: number of active habits currently tracked
 *   - habitBreakdown: list of all habits with their monthly average completion %
 */
export function getMonthlyHabitStats(
  monthlyWeeklyScores = [],
  currentHabits = [],
  accountCreatedAt = null
) {
  const activeHabitsCount = (currentHabits || []).length

  if (!monthlyWeeklyScores || monthlyWeeklyScores.length === 0) {
    return {
      mostConsistent: null,
      mostInconsistent: null,
      monthlyScore: 0,
      activeHabitsCount,
      habitBreakdown: [],
    }
  }

  // Collect unique habits across currentHabits and any archived weeks in this month
  const habitMap = new Map()

  for (const h of currentHabits || []) {
    habitMap.set(h.id, {
      id: h.id,
      name: h.name,
      goal: h.goal,
      weeklyPercents: [],
    })
  }

  // Iterate over each started week in the month
  for (const week of monthlyWeeklyScores) {
    const weekMondayDate = midnight(week.weekStart + 'T00:00:00')
    const weekDates = week.dates || getEffectiveWeekDatesForMonday(weekMondayDate, accountCreatedAt)

    for (const h of week.habits || []) {
      let entry = habitMap.get(h.id)
      if (!entry) {
        // Fallback: match by name
        const matchByName = Array.from(habitMap.values()).find(e => e.name === h.name)
        if (matchByName) {
          entry = matchByName
        } else {
          entry = {
            id: h.id,
            name: h.name,
            goal: h.goal,
            weeklyPercents: [],
          }
          habitMap.set(h.id, entry)
        }
      }

      const { percent } = getWeeklyProgress(h, weekDates, accountCreatedAt)
      entry.weeklyPercents.push(percent)
    }
  }

  // Calculate each habit's monthly average %
  const habitBreakdown = Array.from(habitMap.values())
    .filter(h => h.name)
    .map(h => {
      const avg = h.weeklyPercents.length > 0
        ? Math.round(h.weeklyPercents.reduce((a, b) => a + b, 0) / h.weeklyPercents.length)
        : 0
      return {
        id: h.id,
        name: h.name,
        goal: h.goal,
        percent: avg,
        weeksTracked: h.weeklyPercents.length,
      }
    })

  if (habitBreakdown.length === 0) {
    return {
      mostConsistent: null,
      mostInconsistent: null,
      monthlyScore: 0,
      activeHabitsCount,
      habitBreakdown: [],
    }
  }

  // Sort descending by percent
  const sorted = [...habitBreakdown].sort((a, b) => b.percent - a.percent)

  const maxPercent = sorted[0].percent
  const mostConsistentHabits = sorted.filter(h => h.percent === maxPercent)

  const minPercent = sorted[sorted.length - 1].percent
  const mostInconsistentHabits = sorted.filter(h => h.percent === minPercent)

  const mostConsistent = {
    percent: maxPercent,
    habits: mostConsistentHabits,
    name: mostConsistentHabits.map(h => h.name).join(', '),
  }

  const mostInconsistent = {
    percent: minPercent,
    habits: mostInconsistentHabits,
    name: mostInconsistentHabits.map(h => h.name).join(', '),
  }

  // Monthly score: overall average completion % across all habits and all weeks combined
  const allWeeklyPercents = []
  for (const h of habitMap.values()) {
    allWeeklyPercents.push(...h.weeklyPercents)
  }

  const monthlyScore = allWeeklyPercents.length > 0
    ? Math.round(allWeeklyPercents.reduce((a, b) => a + b, 0) / allWeeklyPercents.length)
    : 0

  return {
    mostConsistent,
    mostInconsistent,
    monthlyScore,
    activeHabitsCount,
    habitBreakdown: sorted,
  }
}
