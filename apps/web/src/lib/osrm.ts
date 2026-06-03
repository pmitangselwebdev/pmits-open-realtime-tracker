const OSRM_BASE = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org"

const TIMEOUT = 10000

interface OSRMMatchResponse {
  code: string
  message?: string
  matchings?: Array<{
    geometry: {
      coordinates: [number, number][]
    }
    distance: number
  }>
}

export async function matchRoute(
  coords: [number, number][]
): Promise<{ coords: [number, number][]; distance: number } | null> {
  if (coords.length < 2) return null

  const coordsStr = coords.map((c) => `${c[0]},${c[1]}`).join(";")
  const url =
    `${OSRM_BASE}/match/v1/driving/${coordsStr}?geometries=geojson&overview=full&steps=false&tidy=true`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
    if (!res.ok) return null
    const data: OSRMMatchResponse = await res.json()

    if (data.code === "Ok" && data.matchings?.length) {
      const points: [number, number][] = []
      let dist = 0
      for (const m of data.matchings) {
        if (m.geometry.coordinates.length > 0) {
          points.push(...m.geometry.coordinates)
          dist += m.distance ?? 0
        }
      }
      return points.length > 1 ? { coords: points, distance: dist } : null
    }
    return null
  } catch {
    return null
  }
}

export function calculateDistance(coords: [number, number][]): number {
  if (coords.length < 2) return 0
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0])
  }
  return total
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
