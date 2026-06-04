const OSRM_BASE = "https://router.project-osrm.org"
const TIMEOUT_MS = 20000
const MAX_INPUT_POINTS = 150

function sampleCoords(coords: [number, number][], max: number): [number, number][] {
  if (coords.length <= max) return coords
  const step = (coords.length - 1) / (max - 1)
  const result: [number, number][] = []
  for (let i = 0; i < max; i++) {
    result.push(coords[Math.round(i * step)])
  }
  return result
}

async function tryMatchApi(
  coords: [number, number][]
): Promise<{ coords: [number, number][]; distance: number } | null> {
  const lngLatStr = coords.map(([lng, lat]) => `${lng},${lat}`).join(";")

  const url = `${OSRM_BASE}/match/v1/driving/${lngLatStr}?geometries=geojson&overview=full&steps=false`

  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  })

  if (!res.ok) return null

  const data = await res.json()

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
}

async function tryRouteApi(
  coords: [number, number][]
): Promise<{ coords: [number, number][]; distance: number } | null> {
  const lngLatStr = coords.map(([lng, lat]) => `${lng},${lat}`).join(";")

  const url = `${OSRM_BASE}/route/v1/driving/${lngLatStr}?geometries=geojson&overview=full&steps=false&alternatives=false&continue_straight=false`

  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  })

  if (!res.ok) return null

  const data = await res.json()

  if (
    data.code === "Ok" &&
    data.routes?.length &&
    data.routes[0].geometry.coordinates.length > 1
  ) {
    return {
      coords: data.routes[0].geometry.coordinates,
      distance: data.routes[0].distance / 1000,
    }
  }

  return null
}

export async function matchRoute(
  coords: [number, number][]
): Promise<{ coords: [number, number][]; distance: number } | null> {
  if (coords.length < 2) return null

  const sampled = sampleCoords(coords, MAX_INPUT_POINTS)

  const matched = await tryMatchApi(sampled)
  if (matched) return matched

  const routed = await tryRouteApi(sampled)
  if (routed) return routed

  return null
}