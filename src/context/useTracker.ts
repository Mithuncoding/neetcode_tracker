import { useContext } from 'react'
import { TrackerContext } from './tracker-context'

export function useTracker() {
  const context = useContext(TrackerContext)
  if (!context) throw new Error('useTracker must be used inside TrackerProvider')
  return context
}