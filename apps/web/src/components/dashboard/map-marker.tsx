"use client"

import { motion } from "framer-motion"
import type { VehicleWithStatus } from "shared"
import { getVehicleType, getVehicleSvg } from "@/lib/vehicle-markers"

interface MapMarkerProps {
  vehicle: VehicleWithStatus
  isSelected?: boolean
  onClick?: () => void
}

export function MapMarker({ vehicle, isSelected, onClick }: MapMarkerProps) {
  const loc = vehicle.latestLocation
  if (!loc) return null

  const heading = loc.heading ?? 0
  const color = vehicle.color ?? "#dc2626"
  const size = isSelected ? 52 : 42
  const type = getVehicleType(vehicle.name)
  const svg = getVehicleSvg(type, color, vehicle.online)

  return (
    <motion.div
      onClick={onClick}
      animate={{ scale: isSelected ? 1.15 : 1 }}
      whileHover={{ scale: 1.1 }}
      style={{ width: size, height: size, cursor: "pointer", position: "relative" }}
    >
      <svg
        viewBox="0 0 40 40"
        width="100%"
        height="100%"
        style={{
          display: "block",
          transform: `rotate(${heading}deg)`,
          filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.35))",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {vehicle.online && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
          style={{
            background: "#22c55e",
            boxShadow: "0 0 8px rgba(34,197,94,0.6)",
          }}
        />
      )}
    </motion.div>
  )
}
