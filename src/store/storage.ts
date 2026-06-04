import type { AppData, DailyEntry, Pet } from '../types'
import { DEFAULT_PET, todayKey } from '../types'
import { canUseCloud, pushEntry, pushPet } from '../services/cloudSync'

const STORAGE_KEY = 'pawly-data'

let syncUserId: string | null = null

export function setSyncUserId(userId: string | null): void {
  syncUserId = userId
}

export function replaceData(data: AppData): void {
  cache = data
  saveRaw(cache)
  notify()
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

function saveRaw(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let cache: AppData = loadRaw()
const listeners = new Set<() => void>()

function notify(): void {
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
  saveRaw(cache)
  notify()
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
  if (idx >= 0) {
    return cache.entries[idx]
  }
  const entries = [...cache.entries, entry]
  cache = { ...cache, entries }
  saveRaw(cache)
  notify()
  if (syncUserId && canUseCloud()) {
    pushEntry(syncUserId, entry).catch(console.error)
  }
  return entry
}

export function hasEntryForDate(date: string): boolean {
  return cache.entries.some((e) => e.date === date)
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

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function compressImage(file: File, maxSize = 800): Promise<string> {
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
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}
