import * as Location from "expo-location"

let headingWatcher: { remove: () => void } | null = null
let headingInterval: ReturnType<typeof setInterval> | null = null
let currentHeading: number | null = null
let lastSentHeading: number | null = null
let serverUrl = ""
let uniqueId = ""

export async function startHeadingSender(srv: string, uid: string) {
  serverUrl = srv.replace(/\/$/, "")
  uniqueId = uid

  headingWatcher = await Location.watchHeadingAsync((data) => {
    currentHeading = data.trueHeading ?? data.magneticHeading
  })

  headingInterval = setInterval(async () => {
    if (currentHeading === null) return
    if (lastSentHeading !== null && Math.abs(currentHeading - lastSentHeading) < 3) return
    lastSentHeading = currentHeading
    try {
      const url = `${serverUrl}/api/locations/heading`
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId, heading: currentHeading }),
      })
    } catch {}
  }, 2000)
}

export function stopHeadingSender() {
  if (headingWatcher) {
    headingWatcher.remove()
    headingWatcher = null
  }
  if (headingInterval) {
    clearInterval(headingInterval)
    headingInterval = null
  }
  currentHeading = null
  lastSentHeading = null
}
