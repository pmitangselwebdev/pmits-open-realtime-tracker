"use client"

import { X, Navigation, Battery, Gauge, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import { useDashboardStore } from "@/stores/dashboard-store"
import type { VehicleWithStatus } from "shared"
import { getVehicleType } from "@/lib/vehicle-markers"

interface VehicleDetailPanelProps {
  vehicle: VehicleWithStatus | null
}

export function VehicleDetailPanel({ vehicle }: VehicleDetailPanelProps) {
  const { vehicleDetailOpen, setVehicleDetailOpen } = useDashboardStore()

  return (
    <AnimatePresence>
      {vehicleDetailOpen && vehicle && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: (vehicle.color ?? "#dc2626") + "20",
                  }}
                >
                  <span className="text-lg">
                    {getVehicleType(vehicle.name, vehicle.icon) === "ambulance" ? "🚑" :
                     getVehicleType(vehicle.name, vehicle.icon) === "rescue" ? "🚙" :
                     getVehicleType(vehicle.name, vehicle.icon) === "tanker" ? "🚚" :
                     getVehicleType(vehicle.name, vehicle.icon) === "command" ? "📡" :
                     getVehicleType(vehicle.name, vehicle.icon) === "truck" ? "📦" :
                     getVehicleType(vehicle.name, vehicle.icon) === "van" ? "🚐" :
                     getVehicleType(vehicle.name, vehicle.icon) === "suv" ? "🛻" :
                     getVehicleType(vehicle.name, vehicle.icon) === "pickup" ? "🚛" :
                     getVehicleType(vehicle.name, vehicle.icon) === "motor" ? "🏍️" : "🚗"}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold">{vehicle.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.plate}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVehicleDetailOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-2">
                <StatusBadge online={vehicle.online} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    <span className="text-xs">Speed</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {vehicle.latestLocation?.speed?.toFixed(0) ?? "--"}
                    <span className="text-sm font-normal text-muted-foreground">
                      km/h
                    </span>
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Navigation className="h-4 w-4" />
                    <span className="text-xs">Heading</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {vehicle.latestLocation?.heading?.toFixed(0) ?? "--"}
                    <span className="text-sm font-normal text-muted-foreground">
                      °
                    </span>
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Battery className="h-4 w-4" />
                    <span className="text-xs">Battery</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {vehicle.latestLocation?.battery?.toFixed(0) ?? "--"}
                    <span className="text-sm font-normal text-muted-foreground">
                      %
                    </span>
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs">Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {vehicle.latestLocation?.accuracy?.toFixed(0) ?? "--"}
                    <span className="text-sm font-normal text-muted-foreground">
                      m
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Location Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitude</span>
                    <span className="font-mono">
                      {vehicle.latestLocation?.lat?.toFixed(6) ?? "--"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitude</span>
                    <span className="font-mono">
                      {vehicle.latestLocation?.lng?.toFixed(6) ?? "--"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Last Updated
                    </span>
                    <span className="font-mono text-xs">
                      {vehicle.latestLocation?.timestamp
                        ? new Date(
                            vehicle.latestLocation.timestamp
                          ).toLocaleTimeString()
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
