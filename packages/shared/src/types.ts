export interface Vehicle {
  id: string
  name: string
  plate: string
  uniqueId: string
  userId: string
  icon?: string
  color?: string
  createdAt: string
}

export interface Location {
  id: string
  vehicleId: string
  lat: number
  lng: number
  speed?: number
  heading?: number
  accuracy?: number
  battery?: number
  timestamp: string
}

export interface VehicleWithStatus extends Vehicle {
  latestLocation?: Location
  online: boolean
}

export type WSMessage =
  | { type: "location_update"; vehicleId: string; location: Location }
  | { type: "vehicle_online"; vehicleId: string }
  | { type: "vehicle_offline"; vehicleId: string }

export interface DashboardStats {
  totalVehicles: number
  onlineVehicles: number
  totalDistanceToday: number
  uptime: number
}
