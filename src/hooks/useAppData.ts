import { useSyncExternalStore } from 'react'
import { getData, subscribe } from '../store/storage'

export function useAppData() {
  return useSyncExternalStore(subscribe, getData, getData)
}
