import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Link2, Users, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  buildInviteLink,
  createHouseholdInvite,
  fetchHouseholdInfo,
  type HouseholdInfo,
} from '../services/householdSync'

export default function JointAccountSection() {
  const { user, cloudEnabled, householdInfo, refreshHousehold } = useAuth()
  const [info, setInfo] = useState<HouseholdInfo | null>(householdInfo)
  const [inviteLink, setInviteLink] = useState<string | null>(householdInfo?.activeInvite?.link ?? null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user || !cloudEnabled) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHouseholdInfo(user.id)
      setInfo(data)
      if (data?.activeInvite?.link) setInviteLink(data.activeInvite.link)
      await refreshHousehold()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load shared account')
    } finally {
      setLoading(false)
    }
  }, [user, cloudEnabled, refreshHousehold])

  useEffect(() => {
    setInfo(householdInfo)
    if (householdInfo?.activeInvite?.link) setInviteLink(householdInfo.activeInvite.link)
  }, [householdInfo])

  useEffect(() => {
    if (user && cloudEnabled && !householdInfo) load()
  }, [user, cloudEnabled, householdInfo, load])

  const handleCreateLink = async () => {
    if (!user) return
    setCreating(true)
    setError(null)
    try {
      const token = await createHouseholdInvite(user.id)
      const link = buildInviteLink(token)
      setInviteLink(link)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite link')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user || !cloudEnabled) return null

  const partnerConnected = info?.hasPartner

  return (
    <div className="mb-6">
      <div className="bg-white rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-soft)] border border-[var(--color-border)]">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
            <Users size={20} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--color-text)]">Joint account</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Share one pet journal with your partner
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
            className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {info?.role === 'member' ? (
          <div className="rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-primary)]">
            You&apos;re linked to a shared account. Both of you can view and edit your dog&apos;s journal.
          </div>
        ) : partnerConnected ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
            Partner connected — you&apos;re sharing the same pet journal.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Send an invite link to your partner. When they sign up, their account joins yours automatically.
            </p>
            {inviteLink ? (
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 px-3 py-2.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] truncate">
                  {inviteLink}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCopy}
                  className="shrink-0 px-3 py-2.5 bg-[var(--color-primary)] text-white rounded-xl flex items-center gap-1.5 text-sm font-semibold"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </motion.button>
              </div>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateLink}
                disabled={creating}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-primary)] border border-[var(--color-primary-soft)] rounded-full hover:bg-[var(--color-primary-soft)] transition-colors disabled:opacity-60"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                Create invite link
              </motion.button>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-[var(--color-danger)] mt-3">{error}</p>
        )}
      </div>
    </div>
  )
}
