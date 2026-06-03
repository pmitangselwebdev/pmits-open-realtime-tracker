const OSRM_BASE = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org"

const BATCH_SIZE = 100
const OVERLAP = 5
const MAX_MATCH_POINTS = 500

interface OSRMMatchResponse {
  code: string
  matchings?: Array<{
    geometry: {
      coordinates: [number, number][]
    }
  }>
}

async function matchBatch(coords: [number, number][]): Promise<[number, number][] | null> {
  const coordsStr = coords.map((c) => `${c[0]},${c[1]}`).join(";")
  const url =
    `${OSRM_BASE}/match/v1/driving/${coordsStr}?geometries=geojson&overview=full&steps=false&tidy=true`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data: OSRMMatchResponse = await res.json()

    if (data.code === "Ok" && data.matchings?.length) {
      const result: [number, number][] = []
      for (const m of data.matchings) {
        result.push(...m.geometry.coordinates)
      }
      return result
    }
    return null
  } catch {
    return null
  }
}

export async function matchRoute(
  coords: [number, number][]
): Promise<[number, number][] | null> {
  if (coords.length < 2) return null

  const sampled = coords.length > MAX_MATCH_POINTS
    ? sampleCoords(coords, MAX_MATCH_POINTS)
    : coords

  if (sampled.length <= BATCH_SIZE) {
    return matchBatch(sampled)
  }

  const step = BATCH_SIZE - OVERLAP
  const matched: [number, number][] = []

  for (let i = 0; i < sampled.length; i += step) {
    const batch = sampled.slice(i, i + BATCH_SIZE)
    if (batch.length < 2) break

    const result = await matchBatch(batch)
    if (!result) return null

    if (matched.length > 0 && result.length > OVERLAP) {
      matched.push(...result.slice(OVERLAP))
    } else {
      matched.push(...result)
    }
  }

  return matched.length > 0 ? matched : null
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
