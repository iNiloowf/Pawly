import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, TrendingUp, Moon, Activity, LogOut, ChevronDown, Info, Utensils } from 'lucide-react'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../context/AuthContext'
import PhysicalStatsFields from '../components/PhysicalStatsFields'
import JointAccountSection from '../components/JointAccountSection'
import { updatePet, getWeekEntries, moodScore, levelScore, compressImage } from '../store/storage'
import { moodEmoji } from '../types'
import { activitySubtitle, buildWeeklyInsights, foodSubtitle, formatPetContext } from '../lib/petInsights'

function parseAge(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number.parseInt(trimmed, 10)
  if (Number.isNaN(n) || n < 0 || n > 30) return undefined
  return n
}

export default function ProfilePage() {
  const { pet } = useAppData()
  const { user, signOut } = useAuth()
  const [name, setName] = useState(pet.name)
  const [breed, setBreed] = useState(pet.breed ?? '')
  const [age, setAge] = useState(pet.age != null ? String(pet.age) : '')
  const [bodyConditionScore, setBodyConditionScore] = useState<number | ''>(pet.bodyConditionScore ?? '')
  const [photo, setPhoto] = useState(pet.photo)
  const [infoOpen, setInfoOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const weekEntries = getWeekEntries()
  const hasData = weekEntries.length > 0

  const avgMood = hasData
    ? weekEntries.reduce((s, e) => s + moodScore(e.mood), 0) / weekEntries.length
    : 0

  const avgSleep = hasData
    ? weekEntries.reduce((s, e) => s + levelScore(e.sleep), 0) / weekEntries.length
    : 0

  const avgActivity = hasData
    ? weekEntries.reduce((s, e) => s + levelScore(e.activity), 0) / weekEntries.length
    : 0

  const avgFood = hasData
    ? weekEntries.reduce((s, e) => s + levelScore(e.food), 0) / weekEntries.length
    : 0

  const insights = buildWeeklyInsights(pet, weekEntries, avgActivity, avgFood)

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file)
    setPhoto(dataUrl)
    updatePet({ photo: dataUrl })
  }

  const savePhysicalStats = () => {
    updatePet({
      breed: breed.trim() || undefined,
      age: parseAge(age),
      bodyConditionScore: bodyConditionScore === '' ? undefined : bodyConditionScore,
    })
  }

  const handleSaveName = () => {
    updatePet({ name: name.trim() || 'Woody', photo })
  }

  const moodText = avgMood >= 2.5 ? 'Happy' : avgMood >= 1.5 ? 'Balanced' : 'Needs care'
  const sleepText = avgSleep >= 2.5 ? 'Great' : avgSleep >= 1.5 ? 'Okay' : 'Poor'
  const activityText = avgActivity >= 2.5 ? 'High' : avgActivity >= 1.5 ? 'Normal' : 'Low'
  const foodText = avgFood >= 2.5 ? 'Ate more' : avgFood >= 1.5 ? 'Normal' : 'Ate less'

  const physicalSummary = formatPetContext(pet)

  return (
    <div className="px-5 pt-12 page-with-nav">
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

      <div className="space-y-4 mb-4">
        <Field label="Pet name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSaveName}
            className="w-full px-4 py-3 bg-white rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            placeholder="Your pet's name"
          />
        </Field>
      </div>

      <div className="mb-8">
        <button
          type="button"
          onClick={() => setInfoOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-4 py-4 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
              <Info size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text)]">Information</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                {physicalSummary}
              </p>
            </div>
          </div>
          <ChevronDown
            size={20}
            className={`text-[var(--color-muted)] shrink-0 transition-transform ${infoOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {infoOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold text-[var(--color-text)] mb-1">Physical stats</p>
                <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                  Age, breed, and body condition help personalize your weekly analysis.
                </p>
                <PhysicalStatsFields
                  variant="profile"
                  breed={breed}
                  age={age}
                  bodyConditionScore={bodyConditionScore}
                  onBreedChange={setBreed}
                  onAgeChange={setAge}
                  onBodyConditionScoreChange={setBodyConditionScore}
                />
                <button
                  type="button"
                  onClick={savePhysicalStats}
                  className="w-full mt-4 py-3 text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary-soft)] rounded-full hover:bg-[var(--color-primary-soft)] transition-colors"
                >
                  Save information
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <h2 className="text-lg font-bold text-[var(--color-text)] mb-3">This week</h2>
      <div className="grid grid-cols-1 gap-3 mb-4">
        <StatCard
          icon={<TrendingUp size={20} className="text-[var(--color-primary)]" />}
          title="Average mood"
          value={hasData ? `${moodText} ${moodEmoji(avgMood >= 2.5 ? 'happy' : avgMood >= 1.5 ? 'normal' : 'sad')}` : 'No data yet'}
          subtitle={`${weekEntries.length} check-in${weekEntries.length !== 1 ? 's' : ''} this week`}
        />
        <StatCard
          icon={<Moon size={20} className="text-indigo-500" />}
          title="Sleep trend"
          value={hasData ? sleepText : '—'}
          subtitle="Based on daily sleep ratings"
          bar={avgSleep / 3}
          color="bg-indigo-400"
        />
        <StatCard
          icon={<Activity size={20} className="text-emerald-500" />}
          title="Activity trend"
          value={hasData ? activityText : '—'}
          subtitle={activitySubtitle(pet, avgActivity, hasData)}
          bar={avgActivity / 3}
          color="bg-emerald-400"
        />
        <StatCard
          icon={<Utensils size={20} className="text-amber-500" />}
          title="Food trend"
          value={hasData ? foodText : '—'}
          subtitle={foodSubtitle(pet, avgFood, hasData)}
          bar={avgFood / 3}
          color="bg-amber-400"
        />
      </div>

      {insights.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Insights</h3>
          {insights.map((insight) => (
            <div
              key={insight.title}
              className="bg-white rounded-2xl p-4 border border-[var(--color-border)] shadow-[var(--shadow-soft)]"
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">{insight.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[var(--color-primary-soft)] rounded-[var(--radius-card)] p-5 text-center mb-6">
        <p className="text-sm text-[var(--color-primary)] font-medium">
          {weekEntries.length >= 5
            ? `Amazing! ${name} has ${weekEntries.length} check-ins this week 🎉`
            : `Keep building the habit — check in daily with ${name}!`}
        </p>
      </div>

      <JointAccountSection />

      {user && (
        <button
          type="button"
          onClick={() => signOut()}
          className="w-full py-3.5 text-sm font-medium text-[var(--color-danger)] rounded-[var(--radius-button)] border border-red-100 bg-white flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      )}
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
