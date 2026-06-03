interface Point {
  lat: number
  lng: number
  speed: number | null
  timestamp: Date
}

interface TripSegment {
  startTime: Date
  endTime: Date
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  distance: number
  avgSpeed: number
  maxSpeed: number
  duration: number
}

interface StopSegment {
  startTime: Date
  endTime: Date
  lat: number
  lng: number
  duration: number
}

const SPEED_THRESHOLD = 0.5
const MIN_TRIP_DURATION = 30
const MIN_TRIP_DISTANCE = 100
const MIN_PARKING_DURATION = 180
const MIN_NO_DATA_GAP = 600

function haversine(a: Point, b: Point): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function isMoving(p: Point): boolean {
  return (p.speed ?? 0) > SPEED_THRESHOLD
}

export function detectTrips(points: Point[]): TripSegment[] {
  if (points.length < 3) return []

  const trips: TripSegment[] = []
  let i = 0

  while (i < points.length - 1) {
    const gap = (points[i + 1].timestamp.getTime() - points[i].timestamp.getTime()) / 1000
    if (gap > MIN_NO_DATA_GAP) {
      i++
      continue
    }

    if (!isMoving(points[i])) {
      i++
      continue
    }

    const tripStart = i
    let tripEnd = i
    let stoppedSince = -1
    let tripDistance = 0

    for (let j = i; j < points.length - 1; j++) {
      const g = (points[j + 1].timestamp.getTime() - points[j].timestamp.getTime()) / 1000
      if (g > MIN_NO_DATA_GAP) break

      tripDistance += haversine(points[j], points[j + 1])

      if (!isMoving(points[j])) {
        if (stoppedSince < 0) stoppedSince = j
        const stoppedDuration =
          (points[j].timestamp.getTime() - points[stoppedSince].timestamp.getTime()) / 1000
        if (stoppedDuration >= MIN_PARKING_DURATION) {
          tripEnd = stoppedSince
          break
        }
      } else {
        stoppedSince = -1
      }

      tripEnd = j + 1
    }

    const duration =
      (points[tripEnd].timestamp.getTime() - points[tripStart].timestamp.getTime()) / 1000

    if (duration >= MIN_TRIP_DURATION && tripDistance >= MIN_TRIP_DISTANCE) {
      const speeds = points.slice(tripStart, tripEnd + 1).map((p) => p.speed ?? 0).filter(Boolean)
      trips.push({
        startTime: points[tripStart].timestamp,
        endTime: points[tripEnd].timestamp,
        startLat: points[tripStart].lat,
        startLng: points[tripStart].lng,
        endLat: points[tripEnd].lat,
        endLng: points[tripEnd].lng,
        distance: +(tripDistance / 1000).toFixed(3),
        avgSpeed: speeds.length ? +(speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : 0,
        maxSpeed: speeds.length ? +Math.max(...speeds).toFixed(1) : 0,
        duration: +duration.toFixed(0),
      })
    }

    i = tripEnd + 1
  }

  return trips
}

export function detectStops(points: Point[]): StopSegment[] {
  if (points.length < 3) return []

  const stops: StopSegment[] = []
  let i = 0

  while (i < points.length - 1) {
    const gap = (points[i + 1].timestamp.getTime() - points[i].timestamp.getTime()) / 1000
    if (gap > MIN_NO_DATA_GAP) {
      i++
      continue
    }

    const startedMoving = isMoving(points[i])
    if (!isMoving(points[i]) || startedMoving) {
      let stopStart = -1

      while (i < points.length - 1) {
        const g = (points[i + 1].timestamp.getTime() - points[i].timestamp.getTime()) / 1000
        if (g > MIN_NO_DATA_GAP) {
          i++
          break
        }

        if (!isMoving(points[i])) {
          if (stopStart < 0) stopStart = i
          const dur =
            (points[i].timestamp.getTime() - points[stopStart].timestamp.getTime()) / 1000
          if (dur >= MIN_PARKING_DURATION) {
            stops.push({
              startTime: points[stopStart].timestamp,
              endTime: points[i].timestamp,
              lat: points[i].lat,
              lng: points[i].lng,
              duration: +dur.toFixed(0),
            })
            stopStart = -1
            break
          }
        } else {
          stopStart = -1
        }

        i++
      }
    } else {
      i++
    }
  }

  return stops
}
