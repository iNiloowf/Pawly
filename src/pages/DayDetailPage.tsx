import { useParams, Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { getEntry } from '../store/storage'
import {
  moodEmoji,
  sleepLabel,
  foodLabel,
  activityLabel,
  moodLabel,
} from '../types'

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>()
  const entry = date ? getEntry(date) : undefined

  if (!entry) {
    return (
      <div className="px-5 pt-12 page-with-nav text-center">
        <p className="text-[var(--color-muted)]">Entry not found</p>
        <Link to="/history" className="text-[var(--color-primary)] mt-4 inline-block">Back to journal</Link>
      </div>
    )
  }

  return (
    <div className="px-5 pt-12 page-with-nav">
      <Link to="/history" className="inline-flex items-center gap-1 text-[var(--color-primary)] font-medium mb-4">
        <ArrowLeft size={18} /> Journal
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {format(parseISO(entry.date), 'EEEE')}
        </h1>
        <p className="text-[var(--color-text-secondary)]">{format(parseISO(entry.date), 'MMMM d, yyyy')}</p>
      </motion.div>

      {entry.photo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <img
            src={entry.photo}
            alt=""
            className="w-full aspect-[4/3] object-cover rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
          />
        </motion.div>
      )}

      <div className="bg-white rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] border border-[var(--color-border)] text-center mb-4">
        <span className="text-5xl">{moodEmoji(entry.mood)}</span>
        <p className="text-xl font-bold mt-2">{moodLabel(entry.mood)}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">Overall mood</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DetailCard icon="😴" label="Sleep" value={sleepLabel(entry.sleep)} />
        <DetailCard icon="🍖" label="Food" value={foodLabel(entry.food)} />
        <DetailCard icon="🎾" label="Activity" value={activityLabel(entry.activity)} />
        <DetailCard icon="📸" label="Photo" value={entry.photo ? 'Captured' : 'None'} />
      </div>
    </div>
  )
}

function DetailCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-[var(--color-border)]">
      <span className="text-2xl">{icon}</span>
      <p className="text-xs text-[var(--color-text-secondary)] mt-2">{label}</p>
      <p className="font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  )
}
