import AsyncStorage from "@react-native-async-storage/async-storage"

const SETTINGS_KEY = "@tracker_settings"

interface Settings {
  serverUrl: string
  uniqueId: string
}

export async function getSettings(): Promise<Settings | null> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export async function sendLocation(
  serverUrl: string,
  uniqueId: string,
  location: {
    lat: number
    lng: number
    speed?: number | null
    heading?: number | null
    accuracy?: number | null
    battery?: number | null
  }
): Promise<boolean> {
  try {
    const url = `${serverUrl.replace(/\/$/, "")}/api/locations`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniqueId, ...location }),
    })
    return res.ok
  } catch {
    return false
  }
}
