"use client"

import { motion } from "framer-motion"
import { StatusBadge } from "./status-badge"
import { useDashboardStore } from "@/stores/dashboard-store"
import { cn } from "@/lib/utils"
import { getVehicleType, VEHICLE_EMOJI } from "@/lib/vehicle-markers"
import type { VehicleWithStatus } from "shared"

interface VehicleListProps {
  vehicles: VehicleWithStatus[]
  isLoading: boolean
}

export function VehicleList({ vehicles, isLoading }: VehicleListProps) {
  const { selectedVehicleId, selectVehicle, searchQuery, filter } =
    useDashboardStore()

  const filtered = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      v.name.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      v.uniqueId.toLowerCase().includes(q)
    const matchesFilter =
      filter === "all" ||
      (filter === "online" && v.online) ||
      (filter === "offline" && !v.online)
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-medium">No vehicles found</p>
        <p className="text-sm text-muted-foreground/60">
          {searchQuery ? "Try a different search" : "Add a vehicle to get started"}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/50">
      {filtered.map((vehicle, index) => (
        <motion.div
          key={vehicle.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => selectVehicle(vehicle.id)}
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-accent border border-transparent hover:border-border",
            selectedVehicleId === vehicle.id &&
              "bg-accent border-border/50 shadow-sm"
          )}
        >
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: (vehicle.color ?? "#dc2626") + "20" }}
          >
            <span className="text-lg">{VEHICLE_EMOJI[getVehicleType(vehicle.name, vehicle.icon)] ?? "🚗"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {vehicle.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {vehicle.plate}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge online={vehicle.online} />
              {vehicle.latestLocation && (
                <span className="text-xs text-muted-foreground">
                  {vehicle.latestLocation.speed?.toFixed(0) ?? 0} km/h
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
