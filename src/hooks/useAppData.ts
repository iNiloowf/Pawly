import { useSyncExternalStore } from 'react'
import { getData, getSnapshotVersion, subscribe } from '../store/storage'

export function useAppData() {
  return useSyncExternalStore(
    subscribe,
    () => ({ ...getData(), _v: getSnapshotVersion() }),
    () => ({ ...getData(), _v: getSnapshotVersion() }),
  )
}
