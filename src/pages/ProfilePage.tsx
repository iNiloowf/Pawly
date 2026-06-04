import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, TrendingUp, Moon, Activity } from 'lucide-react'
import { useAppData } from '../hooks/useAppData'
import { updatePet, getWeekEntries, moodScore, levelScore, compressImage } from '../store/storage'
import { moodEmoji } from '../types'

export default function ProfilePage() {
  const { pet } = useAppData()
  const [name, setName] = useState(pet.name)
  const [breed, setBreed] = useState(pet.breed ?? '')
  const [photo, setPhoto] = useState(pet.photo)
  const fileRef = useRef<HTMLInputElement>(null)

  const weekEntries = getWeekEntries()

  const avgMood = weekEntries.length
    ? weekEntries.reduce((s, e) => s + moodScore(e.mood), 0) / weekEntries.length
    : 0

  const avgSleep = weekEntries.length
    ? weekEntries.reduce((s, e) => s + levelScore(e.sleep), 0) / weekEntries.length
    : 0

  const avgActivity = weekEntries.length
    ? weekEntries.reduce((s, e) => s + levelScore(e.activity), 0) / weekEntries.length
    : 0

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file)
    setPhoto(dataUrl)
    updatePet({ photo: dataUrl })
  }

  const handleSave = () => {
    updatePet({ name: name.trim() || 'Woody', breed: breed.trim() || undefined, photo })
  }

  const moodText = avgMood >= 2.5 ? 'Happy' : avgMood >= 1.5 ? 'Balanced' : 'Needs care'
  const sleepText = avgSleep >= 2.5 ? 'Great' : avgSleep >= 1.5 ? 'Okay' : 'Poor'
  const activityText = avgActivity >= 2.5 ? 'High' : avgActivity >= 1.5 ? 'Normal' : 'Low'

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Profile</h1>

      <div className="flex flex-col items-center mb-8">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative group"
        >
          {photo ? (
            <img src={photo} alt={name} className="w-28 h-28 rounded-[24px] object-cover ring-4 ring-[var(--color-primary-soft)]" />
          ) : (
            <div className="w-28 h-28 rounded-[24px] bg-gradient-to-br from-[var(--color-primary-soft)] to-[#E8E0FF] flex items-center justify-center text-5xl ring-4 ring-[var(--color-primary-soft)]">
              🐾
            </div>
          )}
          <div className="absolute inset-0 rounded-[24px] bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera size={24} className="text-white" />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <p className="text-xs text-[var(--color-muted)] mt-2">Tap to change photo</p>
      </div>

      <div className="space-y-4 mb-8">
        <Field label="Pet name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            className="w-full px-4 py-3 bg-white rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            placeholder="Your pet's name"
          />
        </Field>
        <Field label="Breed (optional)">
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            onBlur={handleSave}
            className="w-full px-4 py-3 bg-white rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            placeholder="e.g. Golden Retriever"
          />
        </Field>
      </div>

      <h2 className="text-lg font-bold text-[var(--color-text)] mb-3">This week</h2>
      <div className="grid grid-cols-1 gap-3 mb-6">
        <StatCard
          icon={<TrendingUp size={20} className="text-[var(--color-primary)]" />}
          title="Average mood"
          value={weekEntries.length ? `${moodText} ${moodEmoji(avgMood >= 2.5 ? 'happy' : avgMood >= 1.5 ? 'normal' : 'sad')}` : 'No data yet'}
          subtitle={`${weekEntries.length} check-in${weekEntries.length !== 1 ? 's' : ''} this week`}
        />
        <StatCard
          icon={<Moon size={20} className="text-indigo-500" />}
          title="Sleep trend"
          value={weekEntries.length ? sleepText : '—'}
          subtitle="Based on daily sleep ratings"
          bar={avgSleep / 3}
          color="bg-indigo-400"
        />
        <StatCard
          icon={<Activity size={20} className="text-emerald-500" />}
          title="Activity trend"
          value={weekEntries.length ? activityText : '—'}
          subtitle="Based on daily activity ratings"
          bar={avgActivity / 3}
          color="bg-emerald-400"
        />
      </div>

      <div className="bg-[var(--color-primary-soft)] rounded-[var(--radius-card)] p-5 text-center">
        <p className="text-sm text-[var(--color-primary)] font-medium">
          {weekEntries.length >= 5
            ? `Amazing! ${name} has ${weekEntries.length} check-ins this week 🎉`
            : `Keep building the habit — check in daily with ${name}!`}
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  bar,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  bar?: number
  color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-soft)] border border-[var(--color-border)]"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
          <p className="text-lg font-bold text-[var(--color-text)] mt-0.5">{value}</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>
          {bar !== undefined && (
            <div className="mt-2 h-1.5 bg-[var(--color-surface)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(bar * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${color ?? 'bg-[var(--color-primary)]'}`}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
