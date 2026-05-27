"use client"

import { motion } from "framer-motion"
import { Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { useDashboardStore } from "@/stores/dashboard-store"
import type { VehicleWithStatus } from "shared"
import { cn } from "@/lib/utils"

interface VehicleListProps {
  vehicles: VehicleWithStatus[]
  isLoading: boolean
}

export function VehicleList({ vehicles, isLoading }: VehicleListProps) {
  const { selectedVehicleId, selectVehicle, searchQuery, filter } =
    useDashboardStore()

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted animate-pulse"
          >
            <div className="h-10 w-10 rounded-full bg-muted-foreground/20" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
              <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Truck className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground font-medium">No vehicles found</p>
        <p className="text-sm text-muted-foreground/60">
          {searchQuery
            ? "Try a different search term"
            : "Add a vehicle to get started"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
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
            style={{ backgroundColor: vehicle.color ?? "#3b82f6" + "20" }}
          >
            <Truck
              className="h-5 w-5"
              style={{ color: vehicle.color ?? "#3b82f6" }}
            />
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
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge online={vehicle.online} />
              {vehicle.latestLocation && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {vehicle.latestLocation.speed?.toFixed(0) ?? 0} km/h
                  </span>
                </>
              )}
            </div>
          </div>
          <Badge
            variant={vehicle.online ? "success" : "secondary"}
            className="shrink-0"
          >
            {vehicle.online ? "Online" : "Offline"}
          </Badge>
        </motion.div>
      ))}
    </div>
  )
}
