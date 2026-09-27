import { useState, useMemo, useEffect } from 'react'
import {
  Award,
  AlertTriangle,
  TrendingUp,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { useHabits } from '../hooks/useHabits'
import { useWeekHistory } from '../hooks/useWeekHistory'
import { getMonthlyWeeklyScores, getMonthlyHabitStats } from '../utils/monthlyStats'
import { getToday } from '../utils/devClock'

const ACCENT = '#8b6fe0'
const ACCENT_GLOW = '#a78bfa'
const MUTED = '#b8aed1'

// Custom dark tooltip for monthly weekly chart
function CustomMonthlyTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <p className="text-white text-xs font-bold">{data.weekLabel}</p>
        <p className="text-muted text-[11px] mb-1.5">{data.range}</p>
        <p className="text-white text-sm font-extrabold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span>{data.percent}% completion</span>
        </p>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage({ account, habitsData }) {
  const fallbackHabits = useHabits()
  const { habits, activeWeekStart } = habitsData || fallbackHabits
  const { history } = useWeekHistory()

  const accountCreatedAt = account?.createdAt || null

  // Month navigation state — starts on the current month (or fake today's month)
  const [selectedMonthDate, setSelectedMonthDate] = useState(() => {
    const today = getToday()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // Keep month synchronized if history updates
  useEffect(() => {
    function handleHistoryUpdate() {
      setSelectedMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth(), 1))
    }
    window.addEventListener('habitHistoryUpdated', handleHistoryUpdate)
    return () => {
      window.removeEventListener('habitHistoryUpdated', handleHistoryUpdate)
    }
  }, [])

  function goToPreviousMonth() {
    setSelectedMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setSelectedMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function resetToCurrentMonth() {
    const today = getToday()
    setSelectedMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const monthLabel = selectedMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const shortMonth = selectedMonthDate.toLocaleDateString('en-US', {
    month: 'short',
  })

  // 1. Get weekly scores for weeks overlapping this month that have actually started
  const monthlyWeeklyScores = useMemo(() => {
    return getMonthlyWeeklyScores(
      selectedMonthDate,
      history,
      habits,
      activeWeekStart,
      accountCreatedAt
    )
  }, [selectedMonthDate, history, habits, activeWeekStart, accountCreatedAt])

  // 2. Compute 4 monthly stats based on the selected month's weeks
  const {
    mostConsistent,
    mostInconsistent,
    monthlyScore,
    activeHabitsCount,
    habitBreakdown,
  } = useMemo(() => {
    return getMonthlyHabitStats(monthlyWeeklyScores, habits, accountCreatedAt)
  }, [monthlyWeeklyScores, habits, accountCreatedAt])

  return (
    <main className="flex flex-col gap-6 p-6 w-full min-h-screen max-w-5xl font-sans">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-muted text-sm mb-1">Performance Overview</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-muted text-sm mt-1">
            Monthly habit consistency, weekly breakdown, and tracking trends.
          </p>
        </div>

        {/* Month Selector in Header */}
        <div className="flex items-center gap-1.5 bg-surface border border-white/5 rounded-2xl p-1.5 self-start sm:self-auto shadow-md">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-sm font-bold text-white px-3 min-w-[130px] text-center select-none">
            {monthLabel}
          </span>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Most Consistent Habit */}
        <div className="bg-surface rounded-2xl p-5 border border-white/5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Most Consistent Habit
            </span>
            <Award size={18} className="text-accent" />
          </div>
          <p className="text-xl font-bold text-white truncate tracking-tight" title={mostConsistent?.name}>
            {mostConsistent ? mostConsistent.name : '—'}
          </p>
          <p className="text-muted text-xs">
            {mostConsistent
              ? `${mostConsistent.percent}% avg in ${shortMonth}`
              : 'No recorded weeks yet'}
          </p>
        </div>

        {/* Card 2: Most Inconsistent Habit */}
        <div className="bg-surface rounded-2xl p-5 border border-danger/20 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider text-danger/90">
              Most Inconsistent Habit
            </span>
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <p className="text-xl font-bold text-danger truncate tracking-tight" title={mostInconsistent?.name}>
            {mostInconsistent ? mostInconsistent.name : '—'}
          </p>
          <p className="text-danger/80 text-xs">
            {mostInconsistent
              ? `${mostInconsistent.percent}% avg in ${shortMonth}`
              : 'No recorded weeks yet'}
          </p>
        </div>

        {/* Card 3: Monthly Score */}
        <div className="bg-surface rounded-2xl p-5 border border-white/5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Monthly Score
            </span>
            <TrendingUp size={18} className="text-accent" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{monthlyScore}%</p>
          <p className="text-muted text-xs">
            All habits & weeks combined in {shortMonth}
          </p>
        </div>

        {/* Card 4: Active Habits */}
        <div className="bg-surface rounded-2xl p-5 border border-white/5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Habits
            </span>
            <Target size={18} className="text-accent" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{activeHabitsCount}</p>
          <p className="text-muted text-xs">Habits currently being tracked</p>
        </div>
      </div>

      {/* ── Main Chart: Weekly Breakdown for Selected Month ─ */}
      <div className="bg-surface rounded-2xl p-6 border border-white/5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={20} className="text-accent" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Weekly Completion Breakdown
              </h2>
              <p className="text-xs text-muted">
                One bar per week that has occurred in {monthLabel} (0–100%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors border border-white/5"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-white px-2 py-1 bg-white/5 rounded-lg">
              {monthLabel}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors border border-white/5"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Chart View or Empty State */}
        {monthlyWeeklyScores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
            <Calendar size={36} className="text-muted/40 mb-3" />
            <p className="text-sm font-semibold text-white/80">
              No weeks have started yet for {monthLabel}
            </p>
            <p className="text-xs text-muted mt-1 max-w-sm">
              Weeks fully in the future do not appear in this chart. They will appear naturally as each Monday arrives.
            </p>
            <button
              onClick={resetToCurrentMonth}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent/20 text-accent hover:bg-accent hover:text-white transition-colors"
            >
              Back to Current Month
            </button>
          </div>
        ) : (
          <div className="w-full h-72 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyWeeklyScores}
                margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fill: MUTED, fontSize: 12, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: MUTED, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  content={<CustomMonthlyTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="percent" radius={[8, 8, 0, 0]} maxBarSize={64}>
                  {monthlyWeeklyScores.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.weekStart === activeWeekStart ? ACCENT_GLOW : ACCENT}
                      opacity={entry.percent === 0 ? 0.35 : 0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Habit Consistency Breakdown for Selected Month ── */}
      <div className="bg-surface rounded-2xl p-6 border border-white/5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-accent" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Habit Performance in {monthLabel}
            </h2>
          </div>
          <span className="text-xs text-muted">Monthly Average %</span>
        </div>

        {habitBreakdown.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">
            No habit data available for this month.
          </p>
        ) : (
          <div className="flex flex-col gap-3.5 pt-1">
            {habitBreakdown.map((habit) => {
              const isHighest = mostConsistent && habit.name === mostConsistent.name
              const isLowest = mostInconsistent && habit.name === mostInconsistent.name && habitBreakdown.length > 1
              return (
                <div key={habit.id} className="flex items-center gap-4 py-1">
                  <div className="w-48 truncate flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{habit.name}</span>
                    {isHighest && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                        Best
                      </span>
                    )}
                    {isLowest && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-danger/20 text-danger">
                        Lowest
                      </span>
                    )}
                  </div>

                  <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLowest ? 'bg-danger' : 'bg-accent'
                      }`}
                      style={{ width: `${habit.percent}%` }}
                    />
                  </div>

                  <div className="w-16 text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isLowest
                          ? 'bg-danger/15 text-danger border border-danger/30'
                          : habit.percent >= 80
                          ? 'bg-success/15 text-success border border-success/30'
                          : habit.percent >= 50
                          ? 'bg-accent/15 text-accent border border-accent/30'
                          : 'bg-white/5 text-muted border border-white/5'
                      }`}
                    >
                      {habit.percent}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
