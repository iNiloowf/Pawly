import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'
import App from '../App'

export default function AppShell() {
  const { user, loading, isGuest, syncing } = useAuth()

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)]">
        <img src="/icon-192.png" alt="" className="w-20 h-20 rounded-[22px] shadow-[var(--shadow-soft)]" />
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">Loading Pawly…</p>
      </div>
    )
  }

  if (!user && !isGuest) {
    return <LoginPage />
  }

  return (
    <>
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] w-full max-w-[430px] px-4 pt-3"
          >
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--color-primary)] text-white text-sm font-medium rounded-full shadow-lg">
              <Loader2 size={16} className="animate-spin" />
              Syncing your memories…
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <App />
    </>
  )
}
