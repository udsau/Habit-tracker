import { useState, useEffect } from 'react'
import { Plus, GripVertical, X, Check } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import HabitRow from './HabitRow'
import {
  getEffectiveWeekDates,
  getTodayKey,
  getWeeklyProgress,
  canToggleDay,
} from '../utils/habitMath'

// ─── Shared layout constants ──────────────────────────────────────────────────
const COL_NAME     = 220   // px — habit name (sticky left: 0, holds grip handle + name + delete)
const COL_DAY      = 44    // px — each day column (centered 32px circles)
const COL_PROGRESS = 130   // px — progress bar + score (fixed)
const GAP          = 12    // px — column gap

const GRID_COLS = `${COL_NAME}px repeat(7, ${COL_DAY}px) ${COL_PROGRESS}px`
const TABLE_MIN_WIDTH = COL_NAME + 7 * COL_DAY + COL_PROGRESS + 8 * GAP // 754px

// Left offset of today strip inside the grid content area (no card padding)
// name + gap + i*(day + gap)
function dayColLeft(i) {
  return COL_NAME + GAP + i * (COL_DAY + GAP)
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_KEYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Mobile Card Component (< md screens) ────────────────────────────────────
function MobileHabitCard({
  habit,
  onToggleDay,
  onDelete,
  onUpdateGoal,
  todayIdx,
  weekDates,
  accountCreatedAt,
  referenceDate,
  isReadOnly,
}) {
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

  const { completed, goal, percent } =
    getWeeklyProgress(habit, weekDates, accountCreatedAt)

  return (
    <div className="bg-surface rounded-2xl p-4 border border-white/5 shadow-md flex flex-col gap-3">
      {/* ── Top row: Habit name, progress badge, delete button ── */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-white text-base font-bold tracking-tight truncate flex-1" title={habit.name}>
          {habit.name}
        </h3>

        <div className="flex items-center gap-2 shrink-0">
          {/* Progress badge / Inline Goal Edit */}
          {isEditingGoal ? (
            <div className="flex items-center gap-1 bg-background px-2 py-1 rounded-lg border border-accent">
              <span className="text-muted text-xs font-semibold">{completed}/</span>
              <input
                type="number"
                min="1"
                max="7"
                autoFocus
                value={editGoalValue}
                onChange={e => setEditGoalValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveGoal()
                  if (e.key === 'Escape') handleCancelGoal()
                }}
                onBlur={handleSaveGoal}
                className="w-5 bg-transparent text-xs text-white font-bold text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  handleSaveGoal()
                }}
                className="text-accent hover:text-white p-0.5 cursor-pointer"
                title="Save goal"
              >
                <Check size={13} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={!isReadOnly && onUpdateGoal ? () => setIsEditingGoal(true) : undefined}
              disabled={isReadOnly || !onUpdateGoal}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-colors cursor-pointer"
              title="Target days per week (click to edit)"
            >
              {completed}/{goal} <span className="text-muted text-[10px]">({percent}%)</span>
            </button>
          )}

          {/* Delete button */}
          {!isReadOnly && onDelete && (
            <button
              onClick={() => onDelete(habit.id)}
              className="text-muted/60 hover:text-danger p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Delete habit"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* ── Checkboxes Row: All 7 days with day letter, date number, and circle ── */}
      <div className="grid grid-cols-7 gap-1 pt-1 border-t border-white/5">
        {DAY_KEYS.map((day, i) => {
          const { date, isBeforeAccount } = weekDates[i] ?? { date: null, isBeforeAccount: false }
          const checked    = habit.completedDays[day]
          const isToday    = i === todayIdx
          const toggleable = !isReadOnly && date ? canToggleDay(date, accountCreatedAt, referenceDate) : false
          const letter     = DAY_LETTERS[i]

          return (
            <div key={day} className="flex flex-col items-center gap-1">
              {/* Day letter */}
              <span className={`text-[11px] font-bold ${
                isBeforeAccount ? 'text-muted/20'
                : isToday       ? 'text-accent font-extrabold'
                :                 'text-muted'
              }`}>
                {letter}
              </span>

              {/* Date number */}
              <span className={`text-[10px] ${
                isBeforeAccount ? 'text-muted/20'
                : isToday       ? 'text-accent font-bold'
                :                 'text-muted/60'
              }`}>
                {date ? date.getDate() : ''}
              </span>

              {/* Checkbox button or blank space */}
              {isBeforeAccount ? (
                <div className="w-8 h-8" aria-hidden="true" />
              ) : isReadOnly ? (
                <div
                  title={checked ? `${day} — Completed` : `${day} — Not completed`}
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-default
                    ${checked
                      ? 'bg-accent border-accent text-white'
                      : isToday
                        ? 'border-accent/40 bg-accent/5 text-transparent'
                        : 'border-muted/30 text-transparent opacity-50'
                    }
                  `}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </div>
              ) : (
                <button
                  onClick={toggleable ? () => onToggleDay(habit.id, day) : undefined}
                  disabled={!toggleable}
                  title={toggleable ? `${day} — Click to check` : `${day} — not editable`}
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center
                    transition-all duration-150 cursor-pointer
                    ${!toggleable
                      ? 'opacity-35 cursor-not-allowed '
                        + (checked ? 'bg-accent border-accent text-white' : 'border-muted/30 text-transparent')
                      : checked
                        ? 'bg-accent border-accent text-white shadow-sm'
                        : isToday
                          ? 'border-accent bg-accent/15 text-transparent hover:border-accent ring-1 ring-accent/40'
                          : 'border-muted/40 text-transparent hover:border-accent/60'
                    }
                  `}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Drag overlay preview ────────────────────────────────────────────────────
function RowPreview({ habit, todayIdx, weekDates, accountCreatedAt }) {
  const { completed, goal, percent } =
    getWeeklyProgress(habit, weekDates, accountCreatedAt)

  return (
    <div
      className="grid items-center py-2 rounded-xl bg-surface shadow-2xl ring-1 ring-accent/30"
      style={{ gridTemplateColumns: GRID_COLS, columnGap: GAP, width: TABLE_MIN_WIDTH }}
    >
      <div className="flex items-center gap-2 min-w-0 pr-3">
        <div className="flex items-center justify-center text-accent shrink-0">
          <GripVertical size={16} strokeWidth={2} />
        </div>
        <span className="text-white text-sm font-medium truncate flex-1">{habit.name}</span>
      </div>

      {DAY_KEYS.map((day, i) => {
        const { date, isBeforeAccount } = weekDates[i] ?? {}
        const checked    = habit.completedDays[day]
        const toggleable = date ? canToggleDay(date, accountCreatedAt) : false

        if (isBeforeAccount) {
          return <div key={day} className="w-8 h-8" />
        }
        return (
          <div key={day} className="flex items-center justify-center">
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${!toggleable
                ? 'opacity-40 ' + (checked ? 'bg-accent border-accent text-white' : 'border-muted/30 text-transparent')
                : checked ? 'bg-accent border-accent text-white' : 'border-muted/40 text-transparent'}
            `}>
              <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,6 5,9 10,3" />
              </svg>
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-2 pr-1">
        <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-muted text-xs font-medium w-10 text-right">
          {completed}/{goal}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function HabitTable({
  habits,
  onToggleDay,
  onAddHabit,
  onDeleteHabit,
  onUpdateGoal,
  onReorder,
  accountCreatedAt,
  referenceDate = null,
  weekDates: propWeekDates = null,
  isReadOnly = false,
}) {
  const [newName,  setNewName]  = useState('')
  const [newGoal,  setNewGoal]  = useState('')
  const [activeId, setActiveId] = useState(null)

  // Enriched dates: [{date, isBeforeAccount}, ...] for Mon–Sun
  const weekDates = propWeekDates || getEffectiveWeekDates(accountCreatedAt)
  const todayIdx  = isReadOnly ? -1 : DAY_KEYS.indexOf(getTodayKey())  // 0-6 or -1 if past week

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart({ active }) {
    if (isReadOnly) return
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!isReadOnly && over && active.id !== over.id && onReorder) {
      const from = habits.findIndex(h => h.id === active.id)
      const to   = habits.findIndex(h => h.id === over.id)
      onReorder(arrayMove(habits, from, to))
    }
  }

  function handleAdd(e) {
    e.preventDefault()
    if (isReadOnly || !newName.trim() || !onAddHabit) return
    // Default to 7 days/wk if user leaves goal blank
    onAddHabit(newName.trim(), newGoal || '7')
    setNewName('')
    setNewGoal('')
  }

  const activeHabit = habits.find(h => h.id === activeId)

  // Table content rows
  const rowsContent = habits.length === 0 ? (
    <p className="text-muted text-sm text-center py-8">
      {isReadOnly ? 'No habits recorded for this week.' : 'No habits yet — add one below!'}
    </p>
  ) : (
    habits.map(habit => (
      <HabitRow
        key={habit.id}
        habit={habit}
        onToggleDay={onToggleDay}
        onDelete={onDeleteHabit}
        onUpdateGoal={onUpdateGoal}
        todayIdx={todayIdx}
        weekDates={weekDates}
        accountCreatedAt={accountCreatedAt}
        referenceDate={referenceDate}
        isDragging={activeId === habit.id}
        isReadOnly={isReadOnly}
        gridTemplateColumns={GRID_COLS}
        gridGap={GAP}
      />
    ))
  )

  return (
    <>
      {/* ── Mobile Layout (< md): One card per habit in normal document flow ── */}
      <div className="md:hidden flex flex-col gap-3">
        {habits.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 border border-white/5 text-center shadow-md">
            <p className="text-muted text-sm">
              {isReadOnly ? 'No habits recorded for this week.' : 'No habits yet — add your first habit below!'}
            </p>
          </div>
        ) : (
          habits.map(habit => (
            <MobileHabitCard
              key={habit.id}
              habit={habit}
              onToggleDay={onToggleDay}
              onDelete={onDeleteHabit}
              onUpdateGoal={onUpdateGoal}
              todayIdx={todayIdx}
              weekDates={weekDates}
              accountCreatedAt={accountCreatedAt}
              referenceDate={referenceDate}
              isReadOnly={isReadOnly}
            />
          ))
        )}

        {/* Mobile Add habit form */}
        {!isReadOnly && (
          <form
            onSubmit={handleAdd}
            className="bg-surface rounded-2xl p-4 border border-white/5 flex flex-col gap-2.5 shadow-md"
          >
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Add New Habit
            </p>
            <input
              type="text"
              placeholder="Habit name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="bg-background rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted outline-none border border-white/10 focus:border-accent/60 transition-colors"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-background rounded-xl px-3 py-2 border border-white/10 flex-1">
                <span className="text-xs text-muted">Goal:</span>
                <input
                  type="number"
                  placeholder="7"
                  value={newGoal}
                  min="1"
                  max="7"
                  onChange={e => setNewGoal(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder:text-muted outline-none text-center font-bold"
                />
                <span className="text-xs text-muted">days/wk</span>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent/80 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Desktop Layout (≥ md): Exact grid-table with sticky column ── */}
      <div className="hidden md:flex bg-surface rounded-2xl p-4 sm:p-5 flex-col gap-3">
        {/* ── Table Container with ONE single horizontal scroll ──── */}
        <div className="overflow-x-auto scrollbar-subtle pb-2">
          {isReadOnly ? (
            <div className="relative" style={{ minWidth: TABLE_MIN_WIDTH }}>
              {/* Header row */}
              <div
                className="grid items-center pb-2 mb-1 border-b border-white/5"
                style={{ gridTemplateColumns: GRID_COLS, columnGap: GAP }}
              >
                <div className="sticky left-0 z-20 bg-surface flex items-center pr-3 border-r border-white/5">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wider">
                    Habit
                  </span>
                </div>
                {DAY_LETTERS.map((letter, i) => {
                  const { date, isBeforeAccount } = weekDates[i] ?? {}
                  return (
                    <div key={i} className="flex flex-col items-center justify-center gap-0.5 z-10">
                      <span className={`text-xs font-bold ${
                        isBeforeAccount ? 'text-muted/20' : 'text-muted'
                      }`}>
                        {letter}
                      </span>
                      <span className={`text-xs ${
                        isBeforeAccount ? 'text-muted/20' : 'text-muted/60'
                      }`}>
                        {date ? date.getDate() : ''}
                      </span>
                    </div>
                  )
                })}
                <div className="flex items-center z-10 pl-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wider">
                    Progress
                  </span>
                </div>
              </div>

              {/* Static Rows */}
              {rowsContent}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Grid region — today strip + header + rows (all within the same scroll wrapper) */}
              <div className="relative" style={{ minWidth: TABLE_MIN_WIDTH }}>
                {/* Today column highlight — single strip spanning full table height */}
                {todayIdx >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 bg-accent/10 rounded pointer-events-none z-0"
                    style={{ left: dayColLeft(todayIdx), width: COL_DAY }}
                  />
                )}

                {/* Header row */}
                <div
                  className="grid items-center pb-2 mb-1 border-b border-white/5"
                  style={{ gridTemplateColumns: GRID_COLS, columnGap: GAP }}
                >
                  <div className="sticky left-0 z-20 bg-surface flex items-center pr-3 border-r border-white/5">
                    <span className="text-muted text-xs font-semibold uppercase tracking-wider">
                      Habit
                    </span>
                  </div>
                  {DAY_LETTERS.map((letter, i) => {
                    const { date, isBeforeAccount } = weekDates[i] ?? {}
                    const isToday = i === todayIdx
                    return (
                      <div key={i} className="flex flex-col items-center justify-center gap-0.5 z-10">
                        <span className={`text-xs font-bold ${
                          isBeforeAccount ? 'text-muted/20'
                          : isToday       ? 'text-accent'
                          :                 'text-muted'
                        }`}>
                          {letter}
                        </span>
                        <span className={`text-xs ${
                          isBeforeAccount ? 'text-muted/20'
                          : isToday       ? 'text-accent'
                          :                 'text-muted/60'
                        }`}>
                          {date ? date.getDate() : ''}
                        </span>
                      </div>
                    )
                  })}
                  <div className="flex items-center justify-end z-10 pr-1">
                    <span className="text-muted text-xs font-semibold uppercase tracking-wider">
                      Progress
                    </span>
                  </div>
                </div>

                {/* Sortable rows */}
                <SortableContext
                  items={habits.map(h => h.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rowsContent}
                </SortableContext>
              </div>

              <DragOverlay>
                {activeHabit && (
                  <RowPreview
                    habit={activeHabit}
                    todayIdx={todayIdx}
                    weekDates={weekDates}
                    accountCreatedAt={accountCreatedAt}
                  />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Add habit form (only visible when not read-only) */}
        {!isReadOnly && (
          <form
            onSubmit={handleAdd}
            className="flex items-center gap-2 pt-2 border-t border-white/5 w-full"
          >
            {/* Habit name — flex-1 so it fills remaining width */}
            <input
              type="text"
              placeholder="New habit name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="flex-1 bg-background rounded-xl px-4 py-2 text-sm text-white
                         placeholder:text-muted outline-none border border-white/10
                         focus:border-accent/60 transition-colors"
            />
            {/* Goal input — centered placeholder reads "days/wk"; typing replaces it with a number */}
            <input
              type="number"
              placeholder="days/wk"
              value={newGoal}
              min="1"
              max="7"
              onChange={e => setNewGoal(e.target.value)}
              className="w-20 bg-background rounded-xl px-3 py-2 text-sm text-white text-center
                         placeholder:text-muted placeholder:text-xs outline-none border border-white/10
                         focus:border-accent/60 transition-colors shrink-0
                         [appearance:textfield]
                         [&::-webkit-inner-spin-button]:appearance-none
                         [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent/80
                         text-white text-sm font-medium px-4 py-2 rounded-xl
                         transition-colors duration-150 shrink-0 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              Add
            </button>
          </form>
        )}
      </div>
    </>
  )
}
