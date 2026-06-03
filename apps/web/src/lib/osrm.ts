const OSRM_BASE = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org"

const BATCH_SIZE = 80
const OVERLAP = 3
const MAX_MATCH_POINTS = 300
const TIMEOUT = 15000

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

function isValidCoord(c: [number, number]): boolean {
  return (
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1]) &&
    Math.abs(c[0]) <= 180 &&
    Math.abs(c[1]) <= 90
  )
}

function isValidCoords(coords: [number, number][]): boolean {
  return coords.length >= 2 && coords.every(isValidCoord)
}

async function matchBatch(coords: [number, number][]): Promise<{
  coords: [number, number][]
  distance: number
} | null> {
  if (!isValidCoords(coords)) return null

  const coordsStr = coords.map((c) => `${c[0]},${c[1]}`).join(";")
  const url =
    `${OSRM_BASE}/match/v1/driving/${coordsStr}?geometries=geojson&overview=full&steps=false&tidy=true`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
    if (!res.ok) return null
    const data: OSRMMatchResponse = await res.json()

    if (data.code === "Ok" && data.matchings?.length) {
      const result: [number, number][] = []
      let totalDist = 0
      for (const m of data.matchings) {
        const g = m.geometry.coordinates
        if (g.length > 0 && g.every(isValidCoord)) {
          result.push(...g)
          totalDist += m.distance ?? 0
        }
      }
      return result.length > 1 ? { coords: result, distance: totalDist } : null
    }
    return null
  } catch {
    return null
  }
}

export async function matchRoute(
  coords: [number, number][]
): Promise<{ coords: [number, number][]; distance: number } | null> {
  if (!isValidCoords(coords)) return null

  const sampled = coords.length > MAX_MATCH_POINTS
    ? sampleCoords(coords, MAX_MATCH_POINTS)
    : coords

  if (sampled.length <= BATCH_SIZE) {
    return matchBatch(sampled)
  }

  const step = BATCH_SIZE - OVERLAP
  const matched: [number, number][] = []
  let totalDist = 0

  for (let i = 0; i < sampled.length; i += step) {
    const batch = sampled.slice(i, i + BATCH_SIZE)
    if (batch.length < 2) continue

    const result = await matchBatch(batch)
    if (!result) continue

    totalDist += result.distance

    if (matched.length > 0 && result.coords.length > OVERLAP) {
      matched.push(...result.coords.slice(OVERLAP))
    } else {
      matched.push(...result.coords)
    }
  }

  return matched.length > 1
    ? { coords: matched, distance: totalDist }
    : null
}

function sampleCoords(
  coords: [number, number][],
  maxPoints: number
): [number, number][] {
  if (coords.length <= maxPoints) return coords
  const step = (coords.length - 1) / (maxPoints - 1)
  const result: [number, number][] = [coords[0]]
  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.round(i * step)
    result.push(coords[idx])
  }
  result.push(coords[coords.length - 1])
  return result
}

export function calculateMatchedDistance(coords: [number, number][]): number {
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
