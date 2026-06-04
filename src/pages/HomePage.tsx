import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, X } from 'lucide-react'
import PetCard from '../components/PetCard'
import SelectionCard from '../components/SelectionCard'
import { useAppData } from '../hooks/useAppData'
import {
  getTodayEntry,
  saveEntry,
  compressImage,
} from '../store/storage'
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
  const { pet } = useAppData()
  const existing = getTodayEntry()

  const [sleep, setSleep] = useState<SleepLevel>(existing?.sleep ?? DEFAULT_ENTRY.sleep)
  const [food, setFood] = useState<FoodLevel>(existing?.food ?? DEFAULT_ENTRY.food)
  const [activity, setActivity] = useState<ActivityLevel>(existing?.activity ?? DEFAULT_ENTRY.activity)
  const [mood, setMood] = useState<MoodLevel>(existing?.mood ?? DEFAULT_ENTRY.mood)
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (existing) {
      setSleep(existing.sleep)
      setFood(existing.food)
      setActivity(existing.activity)
      setMood(existing.mood)
      setPhoto(existing.photo)
    }
  }, [existing?.date])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file)
    setPhoto(dataUrl)
  }

  const handleSave = async () => {
    setSaving(true)
    const entry: DailyEntry = {
      date: todayKey(),
      sleep,
      food,
      activity,
      mood,
      photo,
    }
    saveEntry(entry)
    await new Promise((r) => setTimeout(r, 400))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
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
          <button
            type="button"
            onClick={() => setPhoto(undefined)}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            <X size={16} />
          </button>
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

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
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

      {existing && (
        <p className="text-center text-xs text-[var(--color-muted)] mt-3">
          You already checked in today — saving will update your entry.
        </p>
      )}
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
