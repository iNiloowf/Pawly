import type { DailyEntry } from '../types'

const DB_NAME = 'pawly-photos'
const STORE = 'photos'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
  })
}

export async function savePhotoRef(key: string, dataUrl: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataUrl, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadPhotoRef(key: string): Promise<string | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as string | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function deletePhotoRef(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function entryPhotoKey(date: string): string {
  return `entry-${date}`
}

export async function hydrateEntryPhotos(entries: DailyEntry[]): Promise<DailyEntry[]> {
  return Promise.all(
    entries.map(async (entry) => {
      if (entry.photo) return entry
      const fromIdb = await loadPhotoRef(entryPhotoKey(entry.date))
      return fromIdb ? { ...entry, photo: fromIdb } : entry
    }),
  )
}
