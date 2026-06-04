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
import { getData, replaceData, setSyncUserId, updatePet, hydratePhotosFromIdb } from '../store/storage'
import type { Pet } from '../types'
import type { DailyEntry } from '../types'
import {
  canUseCloud,
  completeOnboarding as saveOnboarding,
  restoreFromCloud,
  syncToCloud,
} from '../services/cloudSync'

const GUEST_KEY = 'pawly-guest'
const AUTH_GATE_KEY = 'pawly-auth-gate'

function getAuthGate(): boolean {
  return sessionStorage.getItem(AUTH_GATE_KEY) === 'true'
}

function setAuthGate(value: boolean): void {
  if (value) sessionStorage.setItem(AUTH_GATE_KEY, 'true')
  else sessionStorage.removeItem(AUTH_GATE_KEY)
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  cloudEnabled: boolean
  syncing: boolean
  onboardingComplete: boolean
  authGatePassed: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  continueAsGuest: () => void
  passAuthGate: () => Promise<void>
  refreshCloud: () => Promise<void>
  completeOnboarding: (pet: Pet) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getGuestMode(): boolean {
  return sessionStorage.getItem(GUEST_KEY) === 'true'
}

function setGuestMode(value: boolean): void {
  if (value) sessionStorage.setItem(GUEST_KEY, 'true')
  else sessionStorage.removeItem(GUEST_KEY)
}

function emptyPet(): Pet {
  return { name: '', breed: undefined, photo: undefined, age: undefined, bodyConditionScore: undefined }
}

function mergeEntries(local: DailyEntry[], cloud: DailyEntry[]): DailyEntry[] {
  const map = new Map<string, DailyEntry>()
  for (const e of cloud) map.set(e.date, { ...e })
  for (const e of local) {
    const existing = map.get(e.date)
    if (!existing) {
      map.set(e.date, e)
    } else {
      map.set(e.date, {
        ...existing,
        photo: e.photo || existing.photo,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date))
}

function mergePet(local: Pet, cloud: Pet): Pet {
  return {
    name: cloud.name || local.name,
    breed: cloud.breed ?? local.breed,
    photo: cloud.photo || local.photo,
    age: cloud.age ?? local.age,
    bodyConditionScore: cloud.bodyConditionScore ?? local.bodyConditionScore,
  }
}

async function mergeOnLogin(userId: string): Promise<boolean> {
  const local = getData()
  const cloud = await restoreFromCloud(userId)

  if (cloud.entries.length === 0 && local.entries.length > 0) {
    await syncToCloud(userId, local)
    return cloud.onboardingComplete
  }

  if (cloud.entries.length > 0) {
    const pet = cloud.onboardingComplete
      ? mergePet(local.pet, cloud.pet)
      : emptyPet()
    replaceData({
      pet,
      entries: mergeEntries(local.entries, cloud.entries),
    })
    await syncToCloud(userId, getData())
    return cloud.onboardingComplete
  }

  replaceData({
    pet: cloud.onboardingComplete ? mergePet(local.pet, cloud.pet) : emptyPet(),
    entries: mergeEntries(local.entries, cloud.entries),
  })
  return cloud.onboardingComplete
}

async function resolveSession(): Promise<Session | null> {
  if (!supabase) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    await supabase.auth.signOut()
    return null
  }

  return session
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(getGuestMode)
  const [syncing, setSyncing] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(true)
  const [authGatePassed, setAuthGatePassed] = useState(getAuthGate)

  const cloudEnabled = canUseCloud()

  const runSync = useCallback(async (userId: string) => {
    setSyncing(true)
    try {
      const done = await mergeOnLogin(userId)
      setOnboardingComplete(done)
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    hydratePhotosFromIdb()
  }, [])

  useEffect(() => {
    setSyncUserId(session?.user?.id ?? null)
  }, [session?.user?.id])

  const signOut = useCallback(async () => {
    const userId = session?.user?.id
    if (supabase) await supabase.auth.signOut()
    if (userId) localStorage.removeItem(`pawly-onboarded-${userId}`)
    setSession(null)
    setGuestMode(false)
    setIsGuest(false)
    setAuthGate(false)
    setAuthGatePassed(false)
    setOnboardingComplete(true)
  }, [session?.user?.id])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    resolveSession().then((validSession) => {
      setSession(validSession)
      if (validSession?.user && cloudEnabled && getAuthGate()) {
        runSync(validSession.user.id).finally(() => setLoading(false))
      } else {
        setOnboardingComplete(true)
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'SIGNED_OUT' || !nextSession) {
        setSession(null)
        setOnboardingComplete(true)
        return
      }

      const { data: { user }, error } = await supabase!.auth.getUser()
      if (error || !user) {
        await supabase!.auth.signOut()
        setSession(null)
        setOnboardingComplete(true)
        return
      }

      setSession(nextSession)
      if (cloudEnabled && getAuthGate()) {
        runSync(nextSession.user.id)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [cloudEnabled, runSync])

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
    setAuthGate(true)
    setAuthGatePassed(true)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud login is not configured')
    setGuestMode(false)
    setIsGuest(false)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    const needsEmailConfirmation = !data.session

    if (data.user && data.session && cloudEnabled) {
      setAuthGate(true)
      setAuthGatePassed(true)
      setSyncing(true)
      try {
        await syncToCloud(data.user.id, getData())
        setOnboardingComplete(false)
      } finally {
        setSyncing(false)
      }
    }

    return { needsEmailConfirmation }
  }, [cloudEnabled])

  const passAuthGate = useCallback(async () => {
    if (!supabase) throw new Error('Cloud login is not configured')

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      await signOut()
      throw new Error('Session expired. Please sign in or create a new account.')
    }

    setAuthGate(true)
    setAuthGatePassed(true)
    setGuestMode(false)
    setIsGuest(false)
    if (cloudEnabled) {
      await runSync(user.id)
    }
  }, [cloudEnabled, runSync, signOut])

  const continueAsGuest = useCallback(() => {
    setGuestMode(true)
    setIsGuest(true)
    setAuthGate(true)
    setAuthGatePassed(true)
    setOnboardingComplete(true)
  }, [])

  const refreshCloud = useCallback(async () => {
    if (!session?.user || !cloudEnabled) return
    await runSync(session.user.id)
  }, [session, cloudEnabled, runSync])

  const completeOnboarding = useCallback(
    async (pet: Pet) => {
      if (!session?.user) return
      updatePet(pet)
      if (cloudEnabled) {
        await saveOnboarding(session.user.id, pet)
      }
      setOnboardingComplete(true)
    },
    [session, cloudEnabled],
  )

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isGuest,
      cloudEnabled,
      syncing,
      onboardingComplete,
      authGatePassed,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      passAuthGate,
      refreshCloud,
      completeOnboarding,
    }),
    [
      session,
      loading,
      isGuest,
      cloudEnabled,
      syncing,
      onboardingComplete,
      authGatePassed,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      passAuthGate,
      refreshCloud,
      completeOnboarding,
    ],
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
