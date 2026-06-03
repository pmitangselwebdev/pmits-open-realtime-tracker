interface Point {
  lat: number
  lng: number
}

export function pointInCircle(point: Point, center: Point, radiusMeters: number): boolean {
  const d = haversineDistance(point, center)
  return d <= radiusMeters
}

export function pointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].lng, yi = vertices[i].lat
    const xj = vertices[j].lng, yj = vertices[j].lat
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function checkGeofence(
  point: Point,
  type: string,
  vertices: Point[],
  radius?: number | null
): boolean {
  if (type === "circle" && radius) {
    return pointInCircle(point, vertices[0], radius)
  }
  if (type === "polygon" && vertices.length >= 3) {
    return pointInPolygon(point, vertices)
  }
  return false
}

function haversineDistance(a: Point, b: Point): number {
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

export function generateEventMessage(type: string, vehicleName: string, geofenceName?: string): string {
  switch (type) {
    case "device_online": return `${vehicleName} is now online`
    case "device_offline": return `${vehicleName} went offline`
    case "device_moving": return `${vehicleName} started moving`
    case "device_stopped": return `${vehicleName} has stopped`
    case "speed_exceed": return `${vehicleName} exceeded speed limit`
    case "geofence_enter": return `${vehicleName} entered ${geofenceName ?? "geofence"}`
    case "geofence_exit": return `${vehicleName} exited ${geofenceName ?? "geofence"}`
    default: return `${vehicleName}: ${type}`
  }
}
