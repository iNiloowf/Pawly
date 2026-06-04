import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, X, ArrowLeft } from 'lucide-react'
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

  const [isEditing, setIsEditing] = useState(false)
  const [sleep, setSleep] = useState<SleepLevel>(DEFAULT_ENTRY.sleep)
  const [food, setFood] = useState<FoodLevel>(DEFAULT_ENTRY.food)
  const [activity, setActivity] = useState<ActivityLevel>(DEFAULT_ENTRY.activity)
  const [mood, setMood] = useState<MoodLevel>(DEFAULT_ENTRY.mood)
  const [photo, setPhoto] = useState<string | undefined>()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFormFromEntry = (entry: DailyEntry) => {
    setSleep(entry.sleep)
    setFood(entry.food)
    setActivity(entry.activity)
    setMood(entry.mood)
    setPhoto(entry.photo)
  }

  const startEdit = () => {
    if (existing) loadFormFromEntry(existing)
    setIsEditing(true)
  }

  const buildEntry = (overrides: Partial<DailyEntry> = {}): DailyEntry => ({
    date: today,
    sleep: existing?.sleep ?? sleep,
    food: existing?.food ?? food,
    activity: existing?.activity ?? activity,
    mood: existing?.mood ?? mood,
    photo,
    ...overrides,
  })

  const removePhoto = () => {
    setPhoto(undefined)
    saveEntry(buildEntry({ photo: undefined }))
  }

  const startAddPhoto = () => {
    if (existing) loadFormFromEntry(existing)
    setIsEditing(true)
    setTimeout(() => fileRef.current?.click(), 100)
  }

  if (existing && !isEditing) {
    return (
      <TodayComplete
        pet={pet}
        entry={existing}
        onEdit={startEdit}
        onAddPhoto={startAddPhoto}
        onRemovePhoto={removePhoto}
      />
    )
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const compressed = await compressImage(file)
    setPhoto(compressed)

    const entry = buildEntry({ photo: compressed })
    saveEntry(entry)
    if (existing) setIsEditing(false)
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
      setIsEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const isUpdate = Boolean(existing)

  return (
    <div className="home-screen px-4 pt-5 pb-2">
      {isUpdate && (
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium mb-2 shrink-0"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      <div className="shrink-0 mb-3">
        <p className="text-xs font-medium text-[var(--color-primary)] mb-1.5">Good {getGreeting()} 👋</p>
        <PetCard pet={pet} compact />
      </div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="shrink-0 text-lg font-bold text-[var(--color-text)] mb-2"
      >
        {isUpdate ? `Update ${pet.name}'s check-in` : `How is ${pet.name} today?`}
      </motion.h2>

      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 content-start auto-rows-min">
        <SelectionCard title="Sleep" icon="😴" options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} compact />
        <SelectionCard title="Food" icon="🍖" options={FOOD_OPTIONS} value={food} onChange={setFood} compact />
        <SelectionCard title="Activity" icon="🎾" options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} compact />
        <SelectionCard title="Mood" icon="😊" options={MOOD_OPTIONS} value={mood} onChange={setMood} compact />
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />

      <div className="shrink-0 mt-2 space-y-2">
        {photo ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-16 rounded-xl overflow-hidden shadow-[var(--shadow-soft)]"
          >
            <img src={photo} alt="Today's photo" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removePhoto}
              aria-label="Remove photo"
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 px-4 bg-white border-2 border-dashed border-[var(--color-primary-light)] rounded-xl flex items-center justify-center gap-2 text-sm text-[var(--color-primary)] font-semibold shadow-[var(--shadow-soft)]"
          >
            <Camera size={18} />
            Add photo
          </motion.button>
        )}

        {error && (
          <p className="text-xs text-[var(--color-danger)] text-center">{error}</p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-[var(--radius-button)] shadow-lg shadow-[rgba(124,92,255,0.35)] flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
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
                <Check size={18} /> Saved!
              </motion.span>
            ) : saving ? (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Saving...
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {isUpdate ? 'Update Today' : 'Save Today'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
