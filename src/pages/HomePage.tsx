import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check } from 'lucide-react'
import PetCard from '../components/PetCard'
import SelectionCard from '../components/SelectionCard'
import TodayComplete from '../components/TodayComplete'
import { useAppData } from '../hooks/useAppData'
import { saveEntry, compressImage } from '../store/storage'
import {
  SLEEP_OPTIONS,
  FOOD_OPTIONS,
  ACTIVITY_OPTIONS,
  MOOD_OPTIONS,
  DEFAULT_ENTRY,
  todayKey,
  type DailyEntry,
  type SleepLevel,
  type FoodLevel,
  type ActivityLevel,
  type MoodLevel,
} from '../types'

export default function HomePage() {
  const { pet, entries } = useAppData()
  const today = todayKey()
  const existing = useMemo(() => entries.find((e) => e.date === today), [entries, today])

  const [sleep, setSleep] = useState<SleepLevel>(DEFAULT_ENTRY.sleep)
  const [food, setFood] = useState<FoodLevel>(DEFAULT_ENTRY.food)
  const [activity, setActivity] = useState<ActivityLevel>(DEFAULT_ENTRY.activity)
  const [mood, setMood] = useState<MoodLevel>(DEFAULT_ENTRY.mood)
  const [photo, setPhoto] = useState<string | undefined>()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (existing) {
    return <TodayComplete pet={pet} entry={existing} />
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(await compressImage(file))
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    const entry: DailyEntry = {
      date: today,
      sleep,
      food,
      activity,
      mood,
      photo,
    }
    try {
      saveEntry(entry)
      await new Promise((r) => setTimeout(r, 400))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="mb-6">
        <p className="text-sm font-medium text-[var(--color-primary)] mb-1">Good {getGreeting()} 👋</p>
        <PetCard pet={pet} />
      </div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-bold text-[var(--color-text)] mb-4"
      >
        How is {pet.name} today?
      </motion.h2>

      <div className="space-y-3 mb-6">
        <SelectionCard title="Sleep" icon="😴" options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} />
        <SelectionCard title="Food" icon="🍖" options={FOOD_OPTIONS} value={food} onChange={setFood} />
        <SelectionCard title="Activity" icon="🎾" options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
        <SelectionCard title="Mood" icon="😊" options={MOOD_OPTIONS} value={mood} onChange={setMood} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />

      {photo ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-4 rounded-[var(--radius-card)] overflow-hidden aspect-[4/3] shadow-[var(--shadow-card)]"
        >
          <img src={photo} alt="Today's photo" className="w-full h-full object-cover" />
        </motion.div>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => fileRef.current?.click()}
          className="w-full mb-4 py-4 px-6 bg-white border-2 border-dashed border-[var(--color-primary-light)] rounded-[var(--radius-card)] flex items-center justify-center gap-3 text-[var(--color-primary)] font-semibold shadow-[var(--shadow-soft)]"
        >
          <Camera size={22} />
          Add Today&apos;s Photo
        </motion.button>
      )}

      {error && (
        <p className="text-sm text-[var(--color-danger)] text-center mb-3">{error}</p>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full py-4 bg-[var(--color-primary)] text-white font-semibold rounded-[var(--radius-button)] shadow-lg shadow-[rgba(124,92,255,0.35)] flex items-center justify-center gap-2 disabled:opacity-70"
      >
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.span
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Check size={20} /> Saved!
            </motion.span>
          ) : saving ? (
            <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Saving...
            </motion.span>
          ) : (
            <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Save Today
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <p className="text-center text-xs text-[var(--color-muted)] mt-3">
        One check-in per day — make sure everything looks good before saving.
      </p>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
