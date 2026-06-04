import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getData, replaceData, setSyncUserId } from '../store/storage'
import { canUseCloud, restoreFromCloud, syncToCloud } from '../services/cloudSync'

const GUEST_KEY = 'pawly-guest'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  cloudEnabled: boolean
  syncing: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  continueAsGuest: () => void
  refreshCloud: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getGuestMode(): boolean {
  return sessionStorage.getItem(GUEST_KEY) === 'true'
}

function setGuestMode(value: boolean): void {
  if (value) sessionStorage.setItem(GUEST_KEY, 'true')
  else sessionStorage.removeItem(GUEST_KEY)
}

async function mergeOnLogin(userId: string): Promise<void> {
  const local = getData()
  const cloud = await restoreFromCloud(userId)

  if (cloud.entries.length === 0 && local.entries.length > 0) {
    await syncToCloud(userId, local)
    return
  }

  if (cloud.entries.length > 0) {
    const merged = new Map(cloud.entries.map((e) => [e.date, e]))
    for (const e of local.entries) {
      if (!merged.has(e.date)) merged.set(e.date, e)
    }
    replaceData({
      pet: cloud.pet.name ? cloud.pet : local.pet,
      entries: [...merged.values()].sort((a, b) => b.date.localeCompare(a.date)),
    })
    await syncToCloud(userId, getData())
    return
  }

  replaceData(cloud)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(getGuestMode)
  const [syncing, setSyncing] = useState(false)

  const cloudEnabled = canUseCloud()

  useEffect(() => {
    setSyncUserId(session?.user?.id ?? null)
  }, [session?.user?.id])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user && cloudEnabled) {
        mergeOnLogin(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user && cloudEnabled) {
        setSyncing(true)
        mergeOnLogin(nextSession.user.id).finally(() => setSyncing(false))
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [cloudEnabled])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud login is not configured')
    setGuestMode(false)
    setIsGuest(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Email not confirmed yet. Check your inbox and spam folder, or ask the admin to confirm your account.')
      }
      throw error
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud login is not configured')
    setGuestMode(false)
    setIsGuest(false)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    const needsEmailConfirmation = !data.session

    if (data.user && data.session && cloudEnabled) {
      const local = getData()
      if (local.entries.length > 0 || local.pet.photo) {
        setSyncing(true)
        try {
          await syncToCloud(data.user.id, local)
        } finally {
          setSyncing(false)
        }
      }
    }

    return { needsEmailConfirmation }
  }, [cloudEnabled])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setGuestMode(false)
    setIsGuest(false)
  }, [])

  const continueAsGuest = useCallback(() => {
    setGuestMode(true)
    setIsGuest(true)
  }, [])

  const refreshCloud = useCallback(async () => {
    if (!session?.user || !cloudEnabled) return
    setSyncing(true)
    try {
      await mergeOnLogin(session.user.id)
    } finally {
      setSyncing(false)
    }
  }, [session, cloudEnabled])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isGuest,
      cloudEnabled,
      syncing,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      refreshCloud,
    }),
    [session, loading, isGuest, cloudEnabled, syncing, signIn, signUp, signOut, continueAsGuest, refreshCloud],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext)
}

export { isSupabaseConfigured }
