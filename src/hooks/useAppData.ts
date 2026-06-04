import { useSyncExternalStore } from 'react'
import { getAppSnapshot, subscribe } from '../store/storage'

export function useAppData() {
  return useSyncExternalStore(subscribe, getAppSnapshot, getAppSnapshot)
}
