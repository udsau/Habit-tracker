import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { useHabits, emptyDays } from '../hooks/useHabits'
import { useWeekHistory } from '../hooks/useWeekHistory'
import { getToday } from '../utils/devClock'
import {
  getMondayOf,
  toISODate,
  midnight,
  getEffectiveWeekDatesForMonday,
  formatWeekRangeForDates,
  getOverallProgress,
  getCompletedToday,
} from '../utils/habitMath'
import StatsCard from './StatsCard'
import ProgressDonut from './ProgressDonut'
import HabitTable from './HabitTable'

export default function Dashboard({ account, habitsData }) {
  const fallbackHabits = useHabits()
  const {
    habits,
    toggleDay,
    addHabit,
    deleteHabit,
    updateHabitGoal,
    reorderHabits,
    activeWeekStart,
  } = habitsData || fallbackHabits

  const { getWeekByStart } = useWeekHistory()

  const accountCreatedAt = account?.createdAt || null
  const userName         = account?.name || 'friend'

  // The active week Monday ISO (advances when real rollover occurs)
  const currentActiveMondayISO =
    activeWeekStart || toISODate(getMondayOf(getToday()))

  // Account creation week Monday ISO (earliest boundary allowed)
  const accountMondayISO = accountCreatedAt
    ? toISODate(getMondayOf(accountCreatedAt + 'T00:00:00'))
    : currentActiveMondayISO

  // Currently viewed week (defaults to the active week)
  const [selectedMondayISO, setSelectedMondayISO] = useState(currentActiveMondayISO)

  // Keep selected week synchronized if active week advances
  useEffect(() => {
    setSelectedMondayISO(currentActiveMondayISO)
  }, [currentActiveMondayISO])

  const isCurrentWeek = selectedMondayISO === currentActiveMondayISO
  const isReadOnly    = !isCurrentWeek

  // Calculate previous and next week Monday dates for navigation
  const prevMondayDate = midnight(selectedMondayISO + 'T00:00:00')
  prevMondayDate.setDate(prevMondayDate.getDate() - 7)
  const prevMondayISO = toISODate(prevMondayDate)

  const nextMondayDate = midnight(selectedMondayISO + 'T00:00:00')
  nextMondayDate.setDate(nextMondayDate.getDate() + 7)
  const nextMondayISO = toISODate(nextMondayDate)

  // Navigation guards:
  // Cannot go before account creation week
  const canGoBack =
    prevMondayISO >= accountMondayISO &&
    (Boolean(getWeekByStart(prevMondayISO)) || prevMondayISO === accountMondayISO)

  // Cannot navigate forward beyond the active current week
  const canGoForward = selectedMondayISO < currentActiveMondayISO

  function handlePrevWeek() {
    if (canGoBack) setSelectedMondayISO(prevMondayISO)
  }

  function handleNextWeek() {
    if (canGoForward) setSelectedMondayISO(nextMondayISO)
  }

  function handleCurrentWeek() {
    setSelectedMondayISO(currentActiveMondayISO)
  }

  // Week dates for the currently selected week
  const viewedMondayDate = midnight(selectedMondayISO + 'T00:00:00')
  const weekDates = getEffectiveWeekDatesForMonday(viewedMondayDate, accountCreatedAt)
  const weekRange = formatWeekRangeForDates(weekDates.map(w => w.date))

  // Determine which habits to display
  let displayedHabits = habits
  if (isReadOnly) {
    const historicalEntry = getWeekByStart(selectedMondayISO)
    displayedHabits = historicalEntry?.habits || habits.map(h => ({
      ...h,
      completedDays: emptyDays(),
    }))
  }

  const overallPercent = getOverallProgress(displayedHabits, weekDates, accountCreatedAt)
  const completedToday = getCompletedToday(habits)

  // Reference date for toggling days in active week is getToday()
  const activeReferenceDate = getToday()

  // Total check-ins for past week view
  const totalCheckedIn = displayedHabits.reduce(
    (sum, h) => sum + Object.values(h.completedDays).filter(Boolean).length,
    0
  )

  return (
    <main className="flex flex-col gap-6 p-6 w-full min-h-screen max-w-5xl">

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2.5 flex-1 max-w-sm">
          <Search size={16} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search habits…"
            className="bg-transparent text-sm text-white placeholder:text-muted outline-none w-full"
          />
        </div>
      </div>

      {/* ── Page heading + Week Navigation ──────────────── */}
      <div>
        <p className="text-muted text-sm mb-1">Welcome, {userName}.</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">Habit Tracker</h1>

        {/* Date range with week navigator arrows */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-surface/90 border border-white/5 rounded-xl px-2.5 py-1.5 shadow-sm">
            <button
              onClick={handlePrevWeek}
              disabled={!canGoBack}
              title={canGoBack ? 'Previous week' : 'No earlier week available'}
              className={`p-1 rounded-lg transition-colors ${
                canGoBack
                  ? 'text-muted hover:text-white hover:bg-white/10 cursor-pointer'
                  : 'text-muted/20 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <span className="text-white text-xs font-semibold px-2 select-none tracking-wide">
              {weekRange}
            </span>

            <button
              onClick={handleNextWeek}
              disabled={!canGoForward}
              title={canGoForward ? 'Next week' : 'Already at current week'}
              className={`p-1 rounded-lg transition-colors ${
                canGoForward
                  ? 'text-muted hover:text-white hover:bg-white/10 cursor-pointer'
                  : 'text-muted/20 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Past week indicator & jump-back link */}
          {!isCurrentWeek && (
            <div className="flex items-center gap-2.5 text-xs animate-fadeIn">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-medium">
                <History size={13} strokeWidth={2} />
                Viewing past week — read only
              </span>
              <button
                onClick={handleCurrentWeek}
                className="text-muted hover:text-accent font-medium underline underline-offset-2 transition-colors cursor-pointer"
              >
                Back to current week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex gap-4 flex-1">
          <StatsCard label="Total Habits" value={displayedHabits.length} />
          <StatsCard
            label={isCurrentWeek ? 'Weekly Average' : 'Week Score'}
            value={`${overallPercent}%`}
          />
          <StatsCard
            label={isCurrentWeek ? 'Completed Today' : 'Total Check-ins'}
            value={isCurrentWeek ? `${completedToday} / ${habits.length}` : `${totalCheckedIn} done`}
          />
        </div>
        <div className="bg-surface rounded-2xl p-5 flex items-center justify-center shrink-0">
          <ProgressDonut percent={overallPercent} size={130} />
        </div>
      </div>

      {/* ── Habit table ──────────────────────────────────── */}
      <HabitTable
        habits={displayedHabits}
        onToggleDay={isReadOnly ? undefined : toggleDay}
        onAddHabit={isReadOnly ? undefined : addHabit}
        onDeleteHabit={isReadOnly ? undefined : deleteHabit}
        onUpdateGoal={isReadOnly ? undefined : updateHabitGoal}
        onReorder={isReadOnly ? undefined : reorderHabits}
        accountCreatedAt={accountCreatedAt}
        referenceDate={activeReferenceDate}
        weekDates={weekDates}
        isReadOnly={isReadOnly}
      />

    </main>
  )
}
