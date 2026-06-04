import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { AppData, DailyEntry, Pet } from '../types'
import { DEFAULT_PET } from '../types'

const BUCKET = 'photos'

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function isBucketError(error: { message?: string }): boolean {
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('bucket') || msg.includes('not found')
}

async function uploadPhoto(userId: string, path: string, dataUrl: string): Promise<string | undefined> {
  if (!supabase || !dataUrl.startsWith('data:')) return dataUrl.startsWith('http') ? dataUrl : undefined
  try {
    const blob = dataUrlToBlob(dataUrl)
    const filePath = `${userId}/${path}`
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, blob, {
      upsert: true,
      contentType: blob.type,
    })
    if (error) {
      if (isBucketError(error)) {
        console.warn('[Pawly] Storage bucket "photos" not found — photo kept on device only')
        return undefined
      }
      throw error
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
    return data.publicUrl
  } catch (err) {
    if (err && typeof err === 'object' && isBucketError(err as { message?: string })) {
      console.warn('[Pawly] Storage bucket "photos" not found — photo kept on device only')
      return undefined
    }
    throw err
  }
}

const ONBOARDING_KEY = (userId: string) => `pawly-onboarded-${userId}`

export function markOnboardingLocal(userId: string): void {
  localStorage.setItem(ONBOARDING_KEY(userId), 'true')
}

export function isOnboardingLocal(userId: string): boolean {
  return localStorage.getItem(ONBOARDING_KEY(userId)) === 'true'
}

/** Pull pet + entries + photo URLs from Supabase (cloud restore). */
export async function restoreFromCloud(userId: string): Promise<AppData & { onboardingComplete: boolean }> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('pet_name, pet_breed, pet_photo_url, onboarding_complete')
    .eq('id', userId)
    .maybeSingle()

  if (profileErr) throw profileErr

  const onboardingComplete =
    isOnboardingLocal(userId) || profile?.onboarding_complete === true

  const { data: rows, error: entriesErr } = await supabase
    .from('daily_entries')
    .select('entry_date, sleep, food, activity, mood, photo_url')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })

  if (entriesErr) throw entriesErr

  const pet: Pet = {
    name: profile?.pet_name ?? DEFAULT_PET.name,
    breed: profile?.pet_breed ?? undefined,
    photo: profile?.pet_photo_url ?? undefined,
  }

  const entries: DailyEntry[] = (rows ?? []).map((r) => ({
    date: r.entry_date as string,
    sleep: r.sleep as DailyEntry['sleep'],
    food: r.food as DailyEntry['food'],
    activity: r.activity as DailyEntry['activity'],
    mood: r.mood as DailyEntry['mood'],
    photo: r.photo_url ?? undefined,
  }))

  return { pet, entries, onboardingComplete: profile ? onboardingComplete : false }
}

/** Push all local data to Supabase (first sync or backup). */
export async function syncToCloud(userId: string, data: AppData): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  let petPhotoUrl = data.pet.photo
  if (data.pet.photo?.startsWith('data:')) {
    petPhotoUrl = await uploadPhoto(userId, 'pet.jpg', data.pet.photo)
  }

  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    pet_name: data.pet.name,
    pet_breed: data.pet.breed ?? null,
    pet_photo_url: petPhotoUrl ?? null,
    onboarding_complete: isOnboardingLocal(userId),
    updated_at: new Date().toISOString(),
  })
  if (profileErr) throw profileErr

  for (const entry of data.entries) {
    await pushEntry(userId, entry)
  }
}

export async function pushPet(userId: string, pet: Pet, onboardingComplete?: boolean): Promise<void> {
  if (!supabase) return

  let petPhotoUrl = pet.photo
  if (pet.photo?.startsWith('data:')) {
    petPhotoUrl = await uploadPhoto(userId, 'pet.jpg', pet.photo)
  }

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    pet_name: pet.name,
    pet_breed: pet.breed ?? null,
    pet_photo_url: petPhotoUrl ?? null,
    onboarding_complete: onboardingComplete ?? isOnboardingLocal(userId),
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function completeOnboarding(userId: string, pet: Pet): Promise<void> {
  markOnboardingLocal(userId)
  await pushPet(userId, pet, true)
}

export async function fetchOnboardingComplete(userId: string): Promise<boolean> {
  if (isOnboardingLocal(userId)) return true
  if (!supabase) return false

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return false
  return data.onboarding_complete === true
}

export async function pushEntry(userId: string, entry: DailyEntry): Promise<void> {
  if (!supabase) return

  let photoUrl = entry.photo?.startsWith('http') ? entry.photo : undefined
  if (entry.photo?.startsWith('data:')) {
    photoUrl = (await uploadPhoto(userId, `entries/${entry.date}.jpg`, entry.photo)) ?? photoUrl
  }

  const { error } = await supabase.from('daily_entries').upsert(
    {
      user_id: userId,
      entry_date: entry.date,
      sleep: entry.sleep,
      food: entry.food,
      activity: entry.activity,
      mood: entry.mood,
      photo_url: photoUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entry_date' },
  )
  if (error) throw error
}

export function canUseCloud(): boolean {
  return isSupabaseConfigured && supabase !== null
}
