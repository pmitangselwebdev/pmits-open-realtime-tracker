import * as TaskManager from "expo-task-manager"
import * as Location from "expo-location"
import * as Battery from "expo-battery"
import { sendLocation } from "./api-client"
import { addToBuffer, flushBuffer } from "./offline-buffer"
import { useTrackingStore } from "../stores/tracking-store"

export const LOCATION_TASK_NAME = "background-location-task"

let currentSettings: { serverUrl: string; uniqueId: string } | null = null
let lastFlush = 0

export function updateSettings(settings: { serverUrl: string; uniqueId: string }) {
  currentSettings = settings
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return

  const { locations } = data as { locations: Location.LocationObject[] }
  if (!locations?.length || !currentSettings) return

  const { serverUrl, uniqueId } = currentSettings
  let batteryLevel: number | null = null

  try {
    batteryLevel = await Battery.getBatteryLevelAsync()
  } catch {}

  for (const loc of locations) {
    const entry = {
      timestamp: Date.now(),
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      speed: loc.coords.speed ?? null,
      heading: loc.coords.heading ?? null,
      accuracy: loc.coords.accuracy ?? null,
      battery: batteryLevel != null ? batteryLevel * 100 : null,
    }

    const ok = await sendLocation(serverUrl, uniqueId, entry)
    if (ok) {
      useTrackingStore.getState().incrementSent()
    } else {
      await addToBuffer(entry)
    }
  }

  const now = Date.now()
  if (now - lastFlush > 30000) {
    lastFlush = now
    await flushBuffer(serverUrl, uniqueId)
  }
})

export async function startTracking(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync()
  if (!foreground.granted) return false

  const background = await Location.requestBackgroundPermissionsAsync()
  if (!background.granted) return false

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Tracker Aktif",
      notificationBody: "Mengirim lokasi kendaraan...",
    },
  })

  return true
}

export async function stopTracking(): Promise<void> {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
}

export async function isTracking(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)
}
