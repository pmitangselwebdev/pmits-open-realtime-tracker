const OSRM_BASE = "https://router.project-osrm.org"
const TIMEOUT_MS = 15000
const MAX_INPUT_POINTS = 100

interface OSRMMatchResponse {
  matchings?: Array<{
    geometry: {
      coordinates: [number, number][]
    }
    distance: number
  }>
  code: string
  message?: string
}

function sampleCoords(coords: [number, number][], max: number): [number, number][] {
  if (coords.length <= max) return coords
  const step = (coords.length - 1) / (max - 1)
  const result: [number, number][] = []
  for (let i = 0; i < max; i++) {
    result.push(coords[Math.round(i * step)])
  }
  return result
}

export async function matchRoute(
  coords: [number, number][]
): Promise<{ coords: [number, number][]; distance: number } | null> {
  if (coords.length < 2) return null

  const sampled = sampleCoords(coords, MAX_INPUT_POINTS)
  const lngLatStr = sampled.map(([lng, lat]) => `${lng},${lat}`).join(";")

  const url = `${OSRM_BASE}/match/v1/driving/${lngLatStr}?geometries=geojson&overview=full&steps=false`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    })

    if (!res.ok) return null

    const data: OSRMMatchResponse = await res.json()

    if (
      data.code === "Ok" &&
      data.matchings?.length &&
      data.matchings[0].geometry.coordinates.length > 1
    ) {
      return {
        coords: data.matchings[0].geometry.coordinates,
        distance: data.matchings[0].distance / 1000,
      }
    }

    return null
  } catch {
    return null
  }
}
