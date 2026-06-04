import { motion } from 'framer-motion'
import { Camera, Loader2, Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import PhysicalStatsFields from '../components/PhysicalStatsFields'
import { compressImage } from '../store/storage'

function parseAge(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number.parseInt(trimmed, 10)
  if (Number.isNaN(n) || n < 0 || n > 30) return undefined
  return n
}

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth()
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [bodyConditionScore, setBodyConditionScore] = useState<number | ''>('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(await compressImage(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Please enter your pet's name")
      return
    }
    setError(null)
    setLoading(true)
    try {
      await completeOnboarding({
        name: trimmed,
        breed: breed.trim() || undefined,
        age: parseAge(age),
        bodyConditionScore: bodyConditionScore === '' ? undefined : bodyConditionScore,
        photo,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[var(--color-primary-soft)] via-[var(--color-surface)] to-[var(--color-surface)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mb-4 shadow-lg shadow-[rgba(124,92,255,0.35)]">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] text-center">Welcome to Pawly!</h1>
        <p className="text-[var(--color-text-secondary)] text-center mt-2 max-w-[280px]">
          Tell us about your furry friend to personalize your journal
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border)] space-y-5"
      >
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative group"
          >
            {photo ? (
              <img src={photo} alt="" className="w-24 h-24 rounded-[22px] object-cover ring-4 ring-[var(--color-primary-soft)]" />
            ) : (
              <div className="w-24 h-24 rounded-[22px] bg-gradient-to-br from-[var(--color-primary-soft)] to-[#E8E0FF] flex items-center justify-center text-4xl ring-4 ring-[var(--color-primary-soft)]">
                🐾
              </div>
            )}
            <div className="absolute inset-0 rounded-[22px] bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <p className="text-xs text-[var(--color-muted)] mt-2">Add a photo (optional)</p>
        </div>

        <Field label="Pet's name" required>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Woody"
            className="w-full bg-transparent outline-none text-[var(--color-text)] font-medium placeholder:text-[var(--color-muted)]"
          />
        </Field>

        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-1">Physical stats</p>
          <p className="text-xs text-[var(--color-text-secondary)] mb-3">
            Used for smarter weekly insights — all optional except name
          </p>
          <PhysicalStatsFields
            variant="onboarding"
            breed={breed}
            age={age}
            bodyConditionScore={bodyConditionScore}
            onBreedChange={setBreed}
            onAgeChange={setAge}
            onBodyConditionScoreChange={setBodyConditionScore}
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--color-danger)] text-center">{error}</p>
        )}

        <motion.button
          type="submit"
          disabled={loading || !name.trim()}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-[var(--color-primary)] text-white font-semibold rounded-[var(--radius-button)] shadow-lg shadow-[rgba(124,92,255,0.35)] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : null}
          Let&apos;s go!
        </motion.button>
      </motion.form>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 ml-1">
        {label}
        {required && <span className="text-[var(--color-primary)]"> *</span>}
      </label>
      <div className="px-4 py-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-primary-light)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
        {children}
      </div>
    </div>
  )
}
