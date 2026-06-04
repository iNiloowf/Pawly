import type { AppData, DailyEntry, Pet } from '../types'
import { DEFAULT_PET, todayKey } from '../types'
import { canUseCloud, pushEntry, pushPet } from '../services/cloudSync'
import { entryPhotoKey, hydrateEntryPhotos, loadPhotoRef, savePhotoRef } from './photoStore'

const STORAGE_KEY = 'pawly-data'

let syncUserId: string | null = null
let snapshotVersion = 0

export function setSyncUserId(userId: string | null): void {
  syncUserId = userId
}

export function getSnapshotVersion(): number {
  return snapshotVersion
}

export function replaceData(data: AppData): void {
  cache = data
  persistCache()
}

function loadRaw(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    /* ignore corrupt data */
  }
  return { pet: { ...DEFAULT_PET }, entries: [] }
}

/** Strip base64 photos from data before localStorage (stored in IndexedDB). */
function stripPhotosForStorage(data: AppData): AppData {
  return {
    pet: {
      ...data.pet,
      photo: data.pet.photo?.startsWith('data:') ? undefined : data.pet.photo,
    },
    entries: data.entries.map((e) => ({
      ...e,
      photo: e.photo?.startsWith('data:') ? undefined : e.photo,
    })),
  }
}

function persistCache(): void {
  notify()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripPhotosForStorage(cache)))
  } catch (err) {
    console.warn('[Pawly] localStorage save failed — photos kept in IndexedDB', err)
  }
  for (const entry of cache.entries) {
    if (entry.photo?.startsWith('data:')) {
      savePhotoRef(entryPhotoKey(entry.date), entry.photo).catch(console.error)
    }
  }
  if (cache.pet.photo?.startsWith('data:')) {
    savePhotoRef('pet-profile', cache.pet.photo).catch(console.error)
  }
}

let cache: AppData = loadRaw()
let hydrated = false

export type AppSnapshot = AppData & { _v: number }

let appSnapshot: AppSnapshot | null = null

function buildAppSnapshot(): AppSnapshot {
  appSnapshot = {
    pet: cache.pet,
    entries: cache.entries,
    _v: snapshotVersion,
  }
  return appSnapshot
}

export function getAppSnapshot(): AppSnapshot {
  if (!appSnapshot || appSnapshot._v !== snapshotVersion) {
    buildAppSnapshot()
  }
  return appSnapshot!
}

export async function hydratePhotosFromIdb(): Promise<void> {
  if (hydrated) return
  hydrated = true
  try {
    const entries = await hydrateEntryPhotos(cache.entries)
    let pet = cache.pet
    if (!pet.photo) {
      const petPhoto = await loadPhotoRef('pet-profile')
      if (petPhoto) pet = { ...pet, photo: petPhoto }
    }
    cache = { ...cache, entries, pet }
    notify()
  } catch (err) {
    console.warn('[Pawly] Could not load photos from IndexedDB', err)
  }
}

const listeners = new Set<() => void>()

function notify(): void {
  snapshotVersion++
  buildAppSnapshot()
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getData(): AppData {
  return cache
}

export function getPet(): Pet {
  return cache.pet
}

export function updatePet(pet: Partial<Pet>): Pet {
  cache = { ...cache, pet: { ...cache.pet, ...pet } }
  persistCache()
  if (syncUserId && canUseCloud()) {
    pushPet(syncUserId, cache.pet).catch(console.error)
  }
  return cache.pet
}

export function getEntries(): DailyEntry[] {
  return [...cache.entries].sort((a, b) => b.date.localeCompare(a.date))
}

export function getEntry(date: string): DailyEntry | undefined {
  return cache.entries.find((e) => e.date === date)
}

export function getTodayEntry(): DailyEntry | undefined {
  return getEntry(todayKey())
}

export function saveEntry(entry: DailyEntry): DailyEntry {
  const idx = cache.entries.findIndex((e) => e.date === entry.date)
  const entries =
    idx >= 0
      ? cache.entries.map((e, i) => (i === idx ? entry : e))
      : [...cache.entries, entry]
  cache = { ...cache, entries }
  persistCache()
  if (syncUserId && canUseCloud()) {
    pushEntry(syncUserId, entry).catch(console.error)
  }
  return entry
}

export function getEntriesWithPhotos(): DailyEntry[] {
  return getEntries().filter((e) => Boolean(e.photo))
}

export function getWeekEntries(): DailyEntry[] {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const cutoff = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`
  return cache.entries.filter((e) => e.date >= cutoff)
}

export function moodScore(mood: DailyEntry['mood']): number {
  return mood === 'happy' ? 3 : mood === 'normal' ? 2 : 1
}

export function levelScore(level: 'low' | 'normal' | 'high' | 'poor' | 'okay' | 'great' | 'less' | 'more'): number {
  const map: Record<string, number> = {
    poor: 1, less: 1, low: 1, sad: 1,
    okay: 2, normal: 2,
    great: 3, more: 3, high: 3, happy: 3,
  }
  return map[level] ?? 2
}

export function compressImage(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}
