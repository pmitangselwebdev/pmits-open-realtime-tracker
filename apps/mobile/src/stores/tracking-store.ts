import { create } from "zustand"

interface TrackingState {
  serverUrl: string
  uniqueId: string
  isTracking: boolean
  isConfigured: boolean
  sentCount: number
  bufferCount: number
  lastLat: number | null
  lastLng: number | null
  lastSpeed: number | null
  error: string | null

  setServerUrl: (url: string) => void
  setUniqueId: (id: string) => void
  setTracking: (tracking: boolean) => void
  setConfigured: (configured: boolean) => void
  incrementSent: () => void
  setBufferCount: (count: number) => void
  setLastLocation: (lat: number, lng: number, speed: number | null) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useTrackingStore = create<TrackingState>()((set) => ({
  serverUrl: "",
  uniqueId: "",
  isTracking: false,
  isConfigured: false,
  sentCount: 0,
  bufferCount: 0,
  lastLat: null,
  lastLng: null,
  lastSpeed: null,
  error: null,

  setServerUrl: (url) => set({ serverUrl: url }),
  setUniqueId: (id) => set({ uniqueId: id }),
  setTracking: (tracking) => set({ isTracking: tracking }),
  setConfigured: (configured) => set({ isConfigured: configured }),
  incrementSent: () => set((s) => ({ sentCount: s.sentCount + 1 })),
  setBufferCount: (count) => set({ bufferCount: count }),
  setLastLocation: (lat, lng, speed) =>
    set({ lastLat: lat, lastLng: lng, lastSpeed: speed }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      isTracking: false,
      sentCount: 0,
      bufferCount: 0,
      lastLat: null,
      lastLng: null,
      lastSpeed: null,
      error: null,
    }),
}))
