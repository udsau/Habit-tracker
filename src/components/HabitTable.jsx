import { useState } from 'react'
import { Plus, GripVertical } from 'lucide-react'
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
const COL_HANDLE   = 24    // px — grip handle
const COL_NAME     = 240   // px — habit name (fixed, not flexible)
const COL_DAY      = 48    // px — each day column (wider = nicer circles)
const COL_PROGRESS = 180   // px — progress bar + score (fixed)
const GAP          = 12    // px — column gap

const GRID_COLS =
  `${COL_HANDLE}px ${COL_NAME}px repeat(7, ${COL_DAY}px) ${COL_PROGRESS}px`

// Left offset of today strip inside the grid content area (no card padding)
// handle + gap + name + gap + i*(day + gap)
function dayColLeft(i) {
  return COL_HANDLE + GAP + COL_NAME + GAP + i * (COL_DAY + GAP)
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_KEYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Drag overlay preview ────────────────────────────────────────────────────
function RowPreview({ habit, todayIdx, weekDates, accountCreatedAt }) {
  const { completed, goal, percent } =
    getWeeklyProgress(habit, weekDates, accountCreatedAt)

  return (
    <div
      className="grid items-center py-2 rounded-xl bg-surface shadow-2xl ring-1 ring-accent/30"
      style={{ gridTemplateColumns: GRID_COLS, columnGap: GAP }}
    >
      <div className="flex items-center justify-center text-accent">
        <GripVertical size={16} strokeWidth={2} />
      </div>
      <span className="text-white text-sm font-medium truncate">{habit.name}</span>

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

      <div className="flex items-center gap-2">
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
  const [newGoal,  setNewGoal]  = useState('7')
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
    onAddHabit(newName.trim(), newGoal)
    setNewName('')
    setNewGoal('7')
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
    // overflow-x-auto lets the fixed-width grid scroll on narrow screens
    <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3 overflow-x-auto">
      {/* ── Table Container ──── */}
      {isReadOnly ? (
        <div className="relative w-fit">
          {/* Header row */}
          <div
            className="relative z-10 grid items-end pb-2 mb-1 border-b border-white/5"
            style={{ gridTemplateColumns: GRID_COLS, columnGap: GAP }}
          >
            <div /> {/* handle spacer */}
            <span className="text-muted text-xs font-semibold uppercase tracking-wider">
              Habit
            </span>
            {DAY_LETTERS.map((letter, i) => {
              const { date, isBeforeAccount } = weekDates[i] ?? {}
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
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
            <span className="text-muted text-xs font-semibold uppercase tracking-wider text-right">
              Progress
            </span>
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
          {/* Grid region — today strip + header + rows */}
          <div className="relative w-fit">
            {/* Today column highlight — single strip spanning full table height */}
            {todayIdx >= 0 && (
              <div
                className="absolute top-0 bottom-0 bg-accent/10 rounded pointer-events-none"
                style={{ left: dayColLeft(todayIdx), width: COL_DAY }}
              />
            )}

            {/* Header row */}
            <div
              className="relative z-10 grid items-end pb-2 mb-1 border-b border-white/5"
              style={{ gridTemplateColumns: GRID_COLS, columnGap: GAP }}
            >
              <div /> {/* handle spacer */}
              <span className="text-muted text-xs font-semibold uppercase tracking-wider">
                Habit
              </span>
              {DAY_LETTERS.map((letter, i) => {
                const { date, isBeforeAccount } = weekDates[i] ?? {}
                const isToday = i === todayIdx
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
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
              <span className="text-muted text-xs font-semibold uppercase tracking-wider text-right">
                Progress
              </span>
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

      {/* Add habit form (only visible when not read-only) */}
      {!isReadOnly && (
        <form
          onSubmit={handleAdd}
          className="flex items-center gap-2 pt-2 border-t border-white/5"
        >
          <input
            type="text"
            placeholder="New habit name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 bg-background rounded-xl px-4 py-2 text-sm text-white
                       placeholder:text-muted outline-none border border-white/10
                       focus:border-accent/60 transition-colors"
          />
          <input
            type="number"
            placeholder="Goal"
            value={newGoal}
            min="1"
            max="7"
            onChange={e => setNewGoal(e.target.value)}
            className="w-16 bg-background rounded-xl px-3 py-2 text-sm text-white
                       placeholder:text-muted outline-none border border-white/10
                       focus:border-accent/60 transition-colors text-center"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-accent hover:bg-accent/80
                       text-white text-sm font-medium px-4 py-2 rounded-xl
                       transition-colors duration-150 shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add
          </button>
        </form>
      )}
    </div>
  )
}
