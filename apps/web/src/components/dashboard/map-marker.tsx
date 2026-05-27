"use client"

import { motion } from "framer-motion"
import type { VehicleWithStatus } from "shared"

function getVehicleType(name: string): string {
  const n = name.toLowerCase()
  if (["motor", "supra", "vario", "beat", "nmax", "scooter", "klx", "crf"].some((k) => n.includes(k))) return "motor"
  if (["truck", "colt", "elf", "dyna", "canter"].some((k) => n.includes(k))) return "truck"
  if (["van", "hiace", "bus", "travel", "combi"].some((k) => n.includes(k))) return "van"
  if (["suv", "jeep", "pajero", "fortuner", "crv", "terios", "rush"].some((k) => n.includes(k))) return "suv"
  return "car"
}

function getVehicleSvg(type: string, color: string): string {
  const paths: Record<string, string> = {
    car: `<path d="M6 5Q6 3 9 3L15 3Q18 3 18 5L18 19Q18 21 15 21L9 21Q6 21 6 19Z" fill="${color}"/>
<path d="M8 7L16 7Q17 7 17 8L17 11L7 11L7 8Q7 7 8 7Z" fill="rgba(0,0,0,0.15)"/>`,
    suv: `<path d="M5 4Q5 2 8 2L16 2Q19 2 19 4L19 20Q19 22 16 22L8 22Q5 22 5 20Z" fill="${color}"/>
<path d="M7 6L17 6Q18 6 18 7L18 10L6 10L6 7Q6 6 7 6Z" fill="rgba(0,0,0,0.12)"/>
<rect x="9.5" y="3.5" width="5" height="2" rx="0.5" fill="rgba(0,0,0,0.08)"/>`,
    van: `<rect x="4" y="3" width="16" height="18" rx="3" fill="${color}"/>
<rect x="6" y="6" width="12" height="13" rx="1.5" fill="rgba(0,0,0,0.1)"/>
<rect x="11" y="3.5" width="2" height="1.5" rx="0.5" fill="rgba(0,0,0,0.08)"/>`,
    truck: `<rect x="3" y="5" width="10" height="14" rx="1.5" fill="${color}"/>
<path d="M13 5L16 5Q18 5 18 7L18 19L13 19Z" fill="${color}" fill-opacity="0.85"/>
<rect x="14.5" y="5.5" width="2" height="5" rx="0.5" fill="rgba(0,0,0,0.1)"/>`,
    motor: `<rect x="10" y="4.5" width="4" height="15" rx="1.5" fill="${color}"/>
<circle cx="9" cy="5" r="2.2" fill="${color}"/>
<circle cx="9" cy="19" r="2.2" fill="${color}"/>`,
  }
  return paths[type] ?? paths.car
}

interface MapMarkerProps {
  vehicle: VehicleWithStatus
  isSelected?: boolean
  onClick?: () => void
}

export function MapMarker({ vehicle, isSelected, onClick }: MapMarkerProps) {
  const loc = vehicle.latestLocation
  if (!loc) return null

  const heading = loc.heading ?? 0
  const color = vehicle.online ? (vehicle.color ?? "#3b82f6") : "#6b7280"
  const size = isSelected ? 40 : 32
  const type = getVehicleType(vehicle.name)
  const svg = getVehicleSvg(type, color)

  return (
    <motion.div
      onClick={onClick}
      animate={{ scale: isSelected ? 1.2 : 1 }}
      whileHover={{ scale: 1.1 }}
      style={{ width: size, height: size, cursor: "pointer", position: "relative" }}
    >
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        style={{
          display: "block",
          transform: `rotate(${heading}deg)`,
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {vehicle.online && (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{
            background: "#22c55e",
            boxShadow: "0 0 6px rgba(34,197,94,0.6)",
          }}
        />
      )}
    </motion.div>
  )
}
