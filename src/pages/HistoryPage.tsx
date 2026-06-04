import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { useAppData } from '../hooks/useAppData'
import { moodEmoji, sleepLabel, foodLabel, activityLabel, moodLabel } from '../types'

export default function HistoryPage() {
  const { entries: rawEntries } = useAppData()
  const entries = useMemo(
    () => [...rawEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [rawEntries],
  )
  const entryMap = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = monthStart.getDay()

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Journal</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {format(now, 'MMMM yyyy')}
      </p>

      {/* Calendar grid */}
      <div className="bg-white rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-soft)] border border-[var(--color-border)] mb-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-[var(--color-muted)] py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const entry = entryMap.get(key)
            const today = isToday(day)
            const inMonth = isSameMonth(day, now)

            return (
              <Link
                key={key}
                to={entry ? `/day/${key}` : '#'}
                onClick={(e) => !entry && e.preventDefault()}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative overflow-hidden ${
                  entry ? 'cursor-pointer' : 'cursor-default'
                } ${today ? 'ring-2 ring-[var(--color-primary)] ring-offset-1' : ''} ${
                  entry && !entry.photo ? 'bg-[var(--color-primary-soft)]' : inMonth && !entry?.photo ? 'hover:bg-gray-50' : ''
                } ${!inMonth ? 'opacity-40' : ''}`}
              >
                {entry?.photo && (
                  <img
                    src={entry.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {entry?.photo && <div className="absolute inset-0 bg-black/20" />}
                <span className={`relative z-10 font-medium ${today ? 'text-[var(--color-primary)]' : entry?.photo ? 'text-white drop-shadow' : ''}`}>
                  {format(day, 'd')}
                </span>
                {entry && (
                  <span className={`relative z-10 text-sm leading-none mt-0.5 ${entry.photo ? 'drop-shadow' : ''}`}>
                    {moodEmoji(entry.mood)}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Timeline list */}
      <h2 className="text-lg font-bold text-[var(--color-text)] mb-3">Recent entries</h2>
      {entries.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted)]">
          <span className="text-4xl block mb-3">📔</span>
          <p>No entries yet. Start your first check-in!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.slice(0, 20).map((entry, i) => (
            <motion.div
              key={entry.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/day/${entry.date}`}
                className="flex items-center gap-4 bg-white rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-soft)] border border-[var(--color-border)]"
              >
                {entry.photo ? (
                  <img
                    src={entry.photo}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-soft)] flex items-center justify-center text-2xl shrink-0">
                    {moodEmoji(entry.mood)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text)]">
                    {format(parseISO(entry.date), 'EEEE, MMM d')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">
                    😴 {sleepLabel(entry.sleep)} · 🍖 {foodLabel(entry.food)} · 🎾 {activityLabel(entry.activity)} · {moodEmoji(entry.mood)} {moodLabel(entry.mood)}
                  </p>
                </div>
                <span className="text-2xl">{moodEmoji(entry.mood)}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
