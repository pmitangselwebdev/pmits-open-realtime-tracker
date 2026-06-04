"use client"

import { useVehicles } from "@/hooks/use-vehicles"
import { useDashboardStore } from "@/stores/dashboard-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VehicleDialog } from "@/components/dashboard/vehicle-dialog"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Truck, Search, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { getVehicleType, VEHICLE_EMOJI } from "@/lib/vehicle-markers"

export default function VehiclesPage() {
  const { vehicles, isLoading } = useVehicles()
  const { searchQuery, setSearchQuery, filter, setFilter } =
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your fleet and device identifiers
          </p>
        </div>
        <VehicleDialog mode="add" />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, plate, or unique ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["all", "online", "offline"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">
              No vehicles found
            </p>
            <p className="text-sm text-muted-foreground/60">
              {searchQuery
                ? "Try a different search"
                : "Add a vehicle to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((vehicle) => {
              return (
                <div
                  key={vehicle.id}
                  className={cn(
                    "flex items-center gap-4 p-4 transition-colors",
                    "hover:bg-accent/50"
                  )}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: (vehicle.color ?? "#dc2626") + "20",
                    }}
                  >
                    <span className="text-lg">{VEHICLE_EMOJI[getVehicleType(vehicle.name, vehicle.icon)] ?? "🚗"}</span>
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div>
                      <div className="font-medium text-sm truncate">
                        {vehicle.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.plate}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Unique ID
                      </div>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {vehicle.uniqueId}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge online={vehicle.online} />
                      {vehicle.latestLocation && (
                        <span className="text-xs text-muted-foreground">
                          {vehicle.latestLocation.speed?.toFixed(0) ?? 0} km/h
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <VehicleDialog
                      mode="edit"
                      initialData={{
                        id: vehicle.id,
                        name: vehicle.name,
                        plate: vehicle.plate,
                        uniqueId: vehicle.uniqueId,
                        color: vehicle.color ?? "#dc2626",
                        icon: vehicle.icon ?? "",
                      }}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}