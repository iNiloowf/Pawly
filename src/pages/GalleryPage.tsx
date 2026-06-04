import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAppData } from '../hooks/useAppData'
import {
  moodEmoji,
  sleepLabel,
  foodLabel,
  activityLabel,
  moodLabel,
  type DailyEntry,
} from '../types'

const GRID_PATTERNS = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
]

export default function GalleryPage() {
  const { entries: rawEntries } = useAppData()
  const photos = useMemo(
    () =>
      [...rawEntries]
        .filter((e) => Boolean(e.photo))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [rawEntries],
  )
  const [selected, setSelected] = useState<DailyEntry | null>(null)

  return (
    <div className="px-5 pt-12 pb-28">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Memories</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
      </p>

      {photos.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)]">
          <span className="text-5xl block mb-4">📸</span>
          <p className="font-medium text-[var(--color-text-secondary)]">No photos yet</p>
          <p className="text-sm mt-1">Add a daily photo from the Home screen</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 auto-rows-[120px] gap-2">
          {photos.map((entry, i) => (
            <motion.button
              key={entry.date}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(entry)}
              className={`relative rounded-[16px] overflow-hidden shadow-[var(--shadow-soft)] ${GRID_PATTERNS[i % GRID_PATTERNS.length]}`}
            >
              <img
                src={entry.photo}
                alt={entry.date}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-2 left-2 flex gap-1">
                <Badge emoji={moodEmoji(entry.mood)} />
                <Badge emoji="😴" small />
                <Badge emoji="🍖" small />
                <Badge emoji="🎾" small />
              </div>
              <span className="absolute top-2 right-2 text-[10px] font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {format(parseISO(entry.date), 'MMM d')}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && selected.photo && (
          <PhotoDetail entry={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function Badge({ emoji, small }: { emoji: string; small?: boolean }) {
  return (
    <span
      className={`bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm ${
        small ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-sm'
      }`}
    >
      {emoji}
    </span>
  )
}

function PhotoDetail({ entry, onClose }: { entry: DailyEntry; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col max-w-[430px] mx-auto"
      onClick={onClose}
    >
      <div className="flex justify-end p-4 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <X size={22} />
        </button>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="flex-1 flex flex-col px-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={entry.photo}
          alt=""
          className="w-full flex-1 object-contain rounded-2xl"
        />
        <div className="mt-4 bg-white/10 backdrop-blur-md rounded-[var(--radius-card)] p-5 text-white">
          <p className="text-lg font-bold">{format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-3xl mt-2">{moodEmoji(entry.mood)} {moodLabel(entry.mood)}</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Stat icon="😴" label="Sleep" value={sleepLabel(entry.sleep)} />
            <Stat icon="🍖" label="Food" value={foodLabel(entry.food)} />
            <Stat icon="🎾" label="Activity" value={activityLabel(entry.activity)} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 text-center">
      <span className="text-xl">{icon}</span>
      <p className="text-[10px] text-white/70 mt-1">{label}</p>
      <p className="text-xs font-semibold mt-0.5">{value}</p>
    </div>
  )
}
