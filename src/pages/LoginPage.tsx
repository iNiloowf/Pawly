import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Loader2, Cloud, Smartphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const { signIn, signUp, continueAsGuest, cloudEnabled } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(email.trim(), password)
      if (mode === 'signup') {
        setError(null)
        // Supabase may require email confirm
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[var(--color-primary-soft)] via-[var(--color-surface)] to-[var(--color-surface)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-10"
      >
        <img src="/icon-192.png" alt="Pawly" className="w-24 h-24 rounded-[28px] shadow-[var(--shadow-card)] mb-5" />
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Pawly</h1>
        <p className="text-[var(--color-text-secondary)] text-center mt-2 max-w-[260px]">
          Your pet&apos;s daily journal — synced safely to the cloud
        </p>
      </motion.div>

      {!isSupabaseConfigured && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm"
        >
          <p className="font-medium">Cloud not configured yet</p>
          <p className="mt-1 text-amber-800/80">
            Add Supabase keys to <code className="text-xs bg-amber-100 px-1 rounded">.env.local</code> to enable login &amp; restore.
          </p>
        </motion.div>
      )}

      {cloudEnabled && (
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border)] space-y-4"
        >
          <div className="flex p-1 bg-[var(--color-surface)] rounded-full">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null) }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  mode === m
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <Field icon={<Mail size={18} />} label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full bg-transparent outline-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
            />
          </Field>

          <Field icon={<Lock size={18} />} label="Password">
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent outline-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
            />
          </Field>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                className="text-sm text-[var(--color-danger)] text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-[var(--color-primary)] text-white font-semibold rounded-[var(--radius-button)] shadow-lg shadow-[rgba(124,92,255,0.35)] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </motion.button>
        </motion.form>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 space-y-4"
      >
        <div className="bg-white/80 rounded-2xl p-4 border border-[var(--color-border)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
              <Cloud size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--color-text)]">Where is data restored?</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                After sign-in, your pet profile, daily check-ins, and photos load from <strong>Supabase Cloud</strong> — database for journal data and storage bucket for images. Same account on any device.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-2xl p-4 border border-[var(--color-border)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
              <Smartphone size={20} className="text-[var(--color-muted)]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--color-text)]">Without account</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Data stays only on this browser (<code className="text-[10px]">localStorage</code>). Clearing cache or switching devices loses it.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={continueAsGuest}
          className="w-full py-3.5 text-[var(--color-primary)] font-semibold rounded-[var(--radius-button)] border-2 border-[var(--color-primary-soft)] bg-white hover:bg-[var(--color-primary-soft)] transition-colors"
        >
          Continue without account
        </button>
      </motion.div>
    </div>
  )
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 ml-1">{label}</label>
      <div className="flex items-center gap-3 px-4 py-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-primary-light)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
        <span className="text-[var(--color-muted)]">{icon}</span>
        {children}
      </div>
    </div>
  )
}
