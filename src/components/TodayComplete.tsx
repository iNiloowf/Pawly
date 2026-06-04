import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CalendarDays, Images, Pencil, Camera } from 'lucide-react'
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
  onEdit: () => void
  onAddPhoto: () => void
}

export default function TodayComplete({ pet, entry, onEdit, onAddPhoto }: TodayCompleteProps) {
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
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Checked in for today</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              One entry per day — you can still edit or add a photo
            </p>
          </div>
        </div>

        {entry.photo ? (
          <img
            src={entry.photo}
            alt="Today's photo"
            className="w-full aspect-[4/3] object-cover rounded-2xl mb-4 shadow-[var(--shadow-soft)]"
          />
        ) : (
          <button
            type="button"
            onClick={onAddPhoto}
            className="w-full mb-4 py-4 px-6 bg-[var(--color-primary-soft)] border-2 border-dashed border-[var(--color-primary-light)] rounded-2xl flex items-center justify-center gap-3 text-[var(--color-primary)] font-semibold"
          >
            <Camera size={22} />
            Add today&apos;s photo
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Stat icon="😴" label="Sleep" value={sleepLabel(entry.sleep)} />
          <Stat icon="🍖" label="Food" value={foodLabel(entry.food)} />
          <Stat icon="🎾" label="Activity" value={activityLabel(entry.activity)} />
          <Stat icon="😊" label="Mood" value={`${moodEmoji(entry.mood)} ${moodLabel(entry.mood)}`} />
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary-soft)] rounded-full hover:bg-[var(--color-primary-soft)] transition-colors"
        >
          <Pencil size={16} />
          Edit today&apos;s check-in
        </button>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/day/${entry.date}`}
          className="flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
        >
          <CalendarDays size={18} />
          Journal
        </Link>
        <Link
          to="/gallery"
          className="flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
        >
          <Images size={18} />
          Memories
        </Link>
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
