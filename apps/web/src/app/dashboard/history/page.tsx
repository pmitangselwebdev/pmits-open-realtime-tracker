"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { MapPin, Clock, Route } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useVehicles } from "@/hooks/use-vehicles"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { cn } from "@/lib/utils"

const RouteReplayMap = dynamic(
  () => import("@/components/dashboard/route-replay-map").then((m) => m.RouteReplayMap),
  { ssr: false, loading: () => (
    <div className="h-full rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground">Loading map...</span>
    </div>
  )}
)

type DatePreset = "today" | "3days" | "7days"

export default function HistoryPage() {
  const { vehicles } = useVehicles()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [datePreset, setDatePreset] = useState<DatePreset>("today")

  const now = new Date()
  const afterDate = {
    today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    "3days": new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    "7days": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
  }[datePreset]

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)
  const color = selectedVehicle?.color ?? "#dc2626"
  const name = selectedVehicle?.name ?? ""
  const icon = selectedVehicle?.icon ?? undefined

  const { data, isLoading } = useQuery({
    queryKey: ["locations", "replay", selectedVehicleId, datePreset],
    queryFn: async () => {
      if (!selectedVehicleId) {
        return { locations: [], hasMore: false, route: [], distance: 0 }
      }
      const params = new URLSearchParams({
        vehicleId: selectedVehicleId,
        after: afterDate.toISOString(),
        replay: "true",
        limit: "2000",
      })
      const res = await fetch(`/api/locations?${params}`)
      if (!res.ok) throw new Error("Failed to fetch history")
      return res.json() as Promise<{
        locations: any[]
        hasMore: boolean
        route: [number, number][]
        distance: number
      }>
    },
    enabled: !!selectedVehicleId,
    staleTime: 5 * 60 * 1000,
  })

  const locations = data?.locations ?? []
  const route = data?.route ?? []
  const totalDistance = data?.distance ?? 0
  const duration =
    locations.length > 1
      ? (new Date(locations[locations.length - 1].timestamp).getTime() -
          new Date(locations[0].timestamp).getTime()) /
        1000
      : 0

  return (
    <div className="flex flex-col min-h-0 flex-1 space-y-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold">Route Replay</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Animated path replay — up to 7 days
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start shrink-0">
        <div className="flex gap-2">
          {(["today", "3days", "7days"] as const).map((p) => (
            <Button
              key={p}
              variant={datePreset === p ? "default" : "outline"}
              size="sm"
              onClick={() => setDatePreset(p)}
            >
              {p === "today" ? "Today" : p === "3days" ? "3 Days" : "7 Days"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="lg:w-56 shrink-0 space-y-1.5 overflow-y-auto max-h-40 lg:max-h-none">
          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicles</p>
          ) : (
            vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg transition-colors text-sm",
                  "hover:bg-accent border border-transparent",
                  selectedVehicleId === v.id && "bg-accent border-border"
                )}
              >
                <div className="font-medium truncate">{v.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge online={v.online} />
                  <span className="text-xs text-muted-foreground truncate">
                    {v.plate}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {!selectedVehicleId ? (
            <div className="flex-1 flex items-center justify-center rounded-xl border border-border/50 bg-card">
              <div className="text-center">
                <Route className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">
                  Select a vehicle
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Choose a vehicle to replay its route
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-[300px] lg:min-h-0">
                <RouteReplayMap
                  locations={locations}
                  vehicleName={name}
                  vehicleColor={color}
                  vehicleIcon={icon}
                  isLoading={isLoading}
                  route={route}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 shrink-0">
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Route className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-semibold">
                        {totalDistance.toFixed(1)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          km
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-semibold">
                        {formatDuration(duration)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data Points</p>
                      <p className="text-sm font-semibold">
                        {locations.length.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return "<1 min"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
