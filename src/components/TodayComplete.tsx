import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CalendarDays, Images } from 'lucide-react'
import PetCard from '../components/PetCard'
import type { DailyEntry, Pet } from '../types'
import {
  moodEmoji,
  sleepLabel,
  foodLabel,
  activityLabel,
  moodLabel,
} from '../types'

interface TodayCompleteProps {
  pet: Pet
  entry: DailyEntry
}

export default function TodayComplete({ pet, entry }: TodayCompleteProps) {
  return (
    <div className="px-5 pt-12 pb-4">
      <div className="mb-6">
        <p className="text-sm font-medium text-[var(--color-primary)] mb-1">Good day 👋</p>
        <PetCard pet={pet} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border)] mb-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-soft)] flex items-center justify-center">
            <CheckCircle2 size={26} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Checked in for today</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              One check-in per day — come back tomorrow!
            </p>
          </div>
        </div>

        {entry.photo && (
          <img
            src={entry.photo}
            alt="Today's photo"
            className="w-full aspect-[4/3] object-cover rounded-2xl mb-4 shadow-[var(--shadow-soft)]"
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <Stat icon="😴" label="Sleep" value={sleepLabel(entry.sleep)} />
          <Stat icon="🍖" label="Food" value={foodLabel(entry.food)} />
          <Stat icon="🎾" label="Activity" value={activityLabel(entry.activity)} />
          <Stat icon="😊" label="Mood" value={`${moodEmoji(entry.mood)} ${moodLabel(entry.mood)}`} />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/day/${entry.date}`}
          className="flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
        >
          <CalendarDays size={18} />
          View in Journal
        </Link>
        {entry.photo && (
          <Link
            to="/gallery"
            className="flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
          >
            <Images size={18} />
            Memories
          </Link>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-3">
      <span className="text-lg">{icon}</span>
      <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">{label}</p>
      <p className="text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  )
}
