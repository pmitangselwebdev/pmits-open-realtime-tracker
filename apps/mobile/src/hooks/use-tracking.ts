import { useEffect, useCallback, useRef } from "react"
import * as Location from "expo-location"
import { useTrackingStore } from "../stores/tracking-store"
import {
  startTracking as startTask,
  stopTracking as stopTask,
  isTracking as checkTracking,
  updateSettings,
} from "../tracking/location-task"
import { getSettings, saveSettings } from "../tracking/api-client"
import { getBufferCount } from "../tracking/offline-buffer"

export function useTracking() {
  const store = useTrackingStore()
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      const settings = await getSettings()
      if (settings) {
        store.setServerUrl(settings.serverUrl)
        store.setUniqueId(settings.uniqueId)
        store.setConfigured(true)
        updateSettings(settings)

        const running = await checkTracking()
        store.setTracking(running)

        const bufCount = await getBufferCount()
        store.setBufferCount(bufCount)
      }
    })()
  }, [])

  const start = useCallback(async () => {
    const settings = await getSettings()
    if (!settings) {
      store.setError("Configure server URL and Unique ID first")
      return false
    }

    updateSettings(settings)
    try {
      const ok = await startTask()
      if (ok) {
        store.setTracking(true)
        store.setError(null)
      } else {
        store.setError("Location permission denied")
      }
      return ok
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "Failed to start tracking")
      return false
    }
  }, [])

  const stop = useCallback(async () => {
    await stopTask()
    store.setTracking(false)
  }, [])

  const configure = useCallback(
    async (serverUrl: string, uniqueId: string) => {
      await saveSettings({ serverUrl, uniqueId })
      store.setServerUrl(serverUrl)
      store.setUniqueId(uniqueId)
      store.setConfigured(true)
      store.setError(null)
      updateSettings({ serverUrl, uniqueId })
    },
    []
  )

  return { start, stop, configure }
}
