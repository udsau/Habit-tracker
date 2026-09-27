import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Check } from 'lucide-react'
import { getWeeklyProgress, canToggleDay } from '../utils/habitMath'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function HabitRow({
  habit,
  onToggleDay,
  onDelete,
  onUpdateGoal,
  todayIdx       = -1,
  weekDates      = [],      // enriched: [{date, isBeforeAccount}, ...]
  accountCreatedAt = null,
  referenceDate  = null,
  isDragging     = false,
  isReadOnly     = false,
  gridTemplateColumns,
  gridGap,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: habit.id, disabled: isReadOnly })

  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editGoalValue, setEditGoalValue] = useState(String(habit.goal))

  useEffect(() => {
    setEditGoalValue(String(habit.goal))
  }, [habit.goal])

  function handleSaveGoal() {
    setIsEditingGoal(false)
    const parsed = Math.min(7, Math.max(1, Number(editGoalValue) || habit.goal || 7))
    if (parsed !== habit.goal && onUpdateGoal) {
      onUpdateGoal(habit.id, parsed)
    }
  }

  function handleCancelGoal() {
    setIsEditingGoal(false)
    setEditGoalValue(String(habit.goal))
  }

  const rowStyle = {
    gridTemplateColumns,
    columnGap: gridGap,
    transform: isReadOnly ? undefined : CSS.Transform.toString(transform),
    transition: isReadOnly ? undefined : transition,
    opacity: isDragging ? 0 : 1,
  }

  const { completed, goal, percent } =
    getWeeklyProgress(habit, weekDates, accountCreatedAt)

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      className={`group relative z-10 grid items-center py-2 rounded-xl transition-colors ${
        isReadOnly ? '' : 'hover:bg-white/5'
      }`}
      {...(!isReadOnly ? attributes : {})}
    >
      {/* ── Drag handle ──────────────────────────────────── */}
      {isReadOnly ? (
        <div /> // Spacer to preserve column width
      ) : (
        <div
          {...listeners}
          className="flex items-center justify-center opacity-0 group-hover:opacity-100
                     transition-opacity cursor-grab active:cursor-grabbing
                     text-muted hover:text-accent"
          title="Drag to reorder"
        >
          <GripVertical size={16} strokeWidth={2} />
        </div>
      )}

      {/* ── Name + delete ────────────────────────────────── */}
      <div className="flex items-center gap-1 min-w-0 pr-1">
        <span className="text-white text-sm font-medium truncate flex-1">
          {habit.name}
        </span>
        {!isReadOnly && onDelete && (
          <button
            onClick={() => onDelete(habit.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity
                       text-muted hover:text-danger shrink-0"
            title="Delete habit"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Day checkboxes ───────────────────────────────── */}
      {DAYS.map((day, i) => {
        const { date, isBeforeAccount } = weekDates[i] ?? { date: null, isBeforeAccount: false }
        const checked    = habit.completedDays[day]
        const isToday    = i === todayIdx
        const toggleable = !isReadOnly && date ? canToggleDay(date, accountCreatedAt, referenceDate) : false

        // Days before account creation — render as blank space (no circle at all)
        if (isBeforeAccount) {
          return (
            <div key={day} className="flex items-center justify-center">
              <div className="w-8 h-8" aria-hidden="true" />
            </div>
          )
        }

        // When read-only, render static indicators
        if (isReadOnly) {
          return (
            <div key={day} className="flex items-center justify-center">
              <div
                title={checked ? `${day} — Completed` : `${day} — Not completed`}
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-default
                  ${checked
                    ? 'bg-accent border-accent text-white'
                    : 'border-muted/30 text-transparent opacity-50'
                  }
                `}
              >
                <svg
                  viewBox="0 0 12 12"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              </div>
            </div>
          )
        }

        return (
          <div key={day} className="flex items-center justify-center">
            <button
              onClick={toggleable ? () => onToggleDay(habit.id, day) : undefined}
              disabled={!toggleable}
              title={toggleable ? day : `${day} — not editable`}
              className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center
                transition-all duration-150
                ${!toggleable
                  ? 'opacity-40 cursor-not-allowed '
                    + (checked
                      ? 'bg-accent border-accent text-white'
                      : 'border-muted/30 text-transparent')
                  : checked
                    ? 'bg-accent border-accent text-white cursor-pointer'
                    : isToday
                      ? 'border-accent/50 text-transparent hover:border-accent cursor-pointer'
                      : 'border-muted/40 text-transparent hover:border-accent/60 cursor-pointer'
                }
              `}
            >
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="2,6 5,9 10,3" />
              </svg>
            </button>
          </div>
        )
      })}

      {/* ── Progress ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Goal number display with inline editing and tooltip */}
        <div className="w-14 text-right">
          {isEditingGoal ? (
            <div className="flex items-center gap-0.5 justify-end">
              <span className="text-muted text-xs font-medium">{completed}/</span>
              <input
                type="number"
                min="1"
                max="7"
                autoFocus
                value={editGoalValue}
                onChange={(e) => setEditGoalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGoal()
                  if (e.key === 'Escape') handleCancelGoal()
                }}
                onBlur={handleSaveGoal}
                className="w-6 h-5 bg-background border border-accent rounded text-center text-xs text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSaveGoal()
                }}
                className="text-accent hover:text-white p-0.5"
                title="Save goal"
              >
                <Check size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="group/goal relative flex items-center justify-end text-xs font-medium text-muted">
              <span>{completed}/</span>
              <button
                type="button"
                onClick={!isReadOnly && onUpdateGoal ? () => setIsEditingGoal(true) : undefined}
                disabled={isReadOnly || !onUpdateGoal}
                className={`font-semibold transition-colors ${
                  !isReadOnly && onUpdateGoal
                    ? 'text-white hover:text-accent hover:underline cursor-pointer px-0.5 rounded'
                    : 'text-muted'
                }`}
                title="Target days per week — e.g. set to 5 if you only go to the gym 5x/week (click to edit)"
              >
                {goal}
              </button>

              {/* Brief tooltip on hover */}
              {!isReadOnly && (
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden group-hover/goal:block z-30">
                  <div className="whitespace-nowrap rounded-lg bg-surface border border-white/10 px-2.5 py-1 text-[11px] text-white shadow-xl">
                    Target days per week — e.g. set to 5 if you only go to the gym 5x/week
                    <span className="block text-[10px] text-accent font-medium mt-0.5">Click to edit</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
