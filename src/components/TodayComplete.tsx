import { motion } from 'framer-motion'
import { CheckCircle2, Pencil, Camera, X } from 'lucide-react'
import PetCard from '../components/PetCard'
import type { DailyEntry, Pet } from '../types'
import {
  moodEmoji,
  sleepLabel,
  foodLabel,
  activityLabel,
} from '../types'

interface TodayCompleteProps {
  pet: Pet
  entry: DailyEntry
  onEdit: () => void
  onAddPhoto: () => void
  onRemovePhoto: () => void
}

export default function TodayComplete({ pet, entry, onEdit, onAddPhoto, onRemovePhoto }: TodayCompleteProps) {
  return (
    <div className="home-screen px-4 pt-5 pb-2">
      <div className="shrink-0 mb-3">
        <p className="text-xs font-medium text-[var(--color-primary)] mb-1.5">Good day 👋</p>
        <PetCard pet={pet} compact />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 min-h-0 flex flex-col bg-white rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)]"
      >
        <div className="flex items-center gap-2.5 shrink-0 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[var(--color-text)]">Checked in for today</h2>
            <p className="text-[11px] text-[var(--color-text-secondary)] truncate">
              Edit or add a photo anytime today
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {entry.photo ? (
            <div className="relative flex-1 min-h-0 max-h-[32dvh] rounded-xl overflow-hidden shadow-[var(--shadow-soft)]">
              <img
                src={entry.photo}
                alt="Today's photo"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={onRemovePhoto}
                aria-label="Remove photo"
                className="absolute top-2 right-2 w-8 h-8 bg-black/45 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAddPhoto}
              className="shrink-0 w-full py-3 px-4 bg-[var(--color-primary-soft)] border-2 border-dashed border-[var(--color-primary-light)] rounded-xl flex items-center justify-center gap-2 text-sm text-[var(--color-primary)] font-semibold"
            >
              <Camera size={18} />
              Add today&apos;s photo
            </button>
          )}

          <div className="grid grid-cols-4 gap-1.5 shrink-0">
            <Stat icon="😴" label="Sleep" value={sleepLabel(entry.sleep)} />
            <Stat icon="🍖" label="Food" value={foodLabel(entry.food)} />
            <Stat icon="🎾" label="Act." value={activityLabel(entry.activity)} />
            <Stat icon="😊" label="Mood" value={moodEmoji(entry.mood)} />
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 mt-3 w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary-soft)] rounded-full hover:bg-[var(--color-primary-soft)] transition-colors"
        >
          <Pencil size={15} />
          Edit check-in
        </button>
      </motion.div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-2 text-center">
      <span className="text-base leading-none">{icon}</span>
      <p className="text-[9px] text-[var(--color-text-secondary)] mt-1">{label}</p>
      <p className="text-[11px] font-semibold text-[var(--color-text)] mt-0.5 truncate">{value}</p>
    </div>
  )
}
