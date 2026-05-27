import AsyncStorage from "@react-native-async-storage/async-storage"
import { sendLocation } from "./api-client"

const BUFFER_KEY = "@tracker_buffer"

interface BufferedLocation {
  timestamp: number
  lat: number
  lng: number
  speed?: number | null
  heading?: number | null
  accuracy?: number | null
  battery?: number | null
}

export async function addToBuffer(entry: BufferedLocation): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BUFFER_KEY)
    const buffer: BufferedLocation[] = raw ? JSON.parse(raw) : []
    buffer.push(entry)
    await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer.slice(-200)))
  } catch {
    // silently fail
  }
}

export async function flushBuffer(
  serverUrl: string,
  uniqueId: string
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BUFFER_KEY)
    if (!raw) return
    const buffer: BufferedLocation[] = JSON.parse(raw)
    if (buffer.length === 0) return

    const remaining: BufferedLocation[] = []

    for (const entry of buffer) {
      const ok = await sendLocation(serverUrl, uniqueId, entry)
      if (!ok) remaining.push(entry)
    }

    await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(remaining))
  } catch {
    // keep buffer for next attempt
  }
}

export async function getBufferCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BUFFER_KEY)
    return raw ? JSON.parse(raw).length : 0
  } catch {
    return 0
  }
}
