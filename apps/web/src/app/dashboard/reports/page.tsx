"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useVehicles } from "@/hooks/use-vehicles"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { cn } from "@/lib/utils"
import { Route, Clock, MapPin, Gauge, Download } from "lucide-react"

interface Trip {
  startTime: string
  endTime: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  distance: number
  avgSpeed: number
  maxSpeed: number
  duration: number
}

export default function ReportsPage() {
  const { vehicles } = useVehicles()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [period, setPeriod] = useState<"today" | "7days" | "30days">("today")

  const now = new Date()
  const after = {
    today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    "7days": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30days": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  }[period]

  const { data: trips, isLoading } = useQuery({
    queryKey: ["reports", "trips", selectedVehicleId, period],
    queryFn: async () => {
      if (!selectedVehicleId) return []
      const params = new URLSearchParams({
        vehicleId: selectedVehicleId,
        after: after.toISOString(),
      })
      const res = await fetch(`/api/reports/trips?${params}`)
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<Trip[]>
    },
    enabled: !!selectedVehicleId,
  })

  const totalDistance = trips?.reduce((s, t) => s + t.distance, 0) ?? 0
  const totalDuration = trips?.reduce((s, t) => s + t.duration, 0) ?? 0
  const avgSpeed = trips?.length
    ? trips.reduce((s, t) => s + t.avgSpeed, 0) / trips.length
    : 0

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">Trip summary and analytics</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-48 shrink-0 space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vehicles</p>
          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicles</p>
          ) : (
            vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={cn("w-full text-left p-2.5 rounded-lg transition-colors text-sm hover:bg-accent border border-transparent",
                  selectedVehicleId === v.id && "bg-accent border-border")}
              >
                <div className="font-medium truncate">{v.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge online={v.online} />
                  <span className="text-xs text-muted-foreground truncate">{v.plate}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            {(["today", "7days", "30days"] as const).map((p) => (
              <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)}>
                {p === "today" ? "Today" : p === "7days" ? "7 Days" : "30 Days"}
              </Button>
            ))}
            {selectedVehicleId && (
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                const params = new URLSearchParams({ vehicleId: selectedVehicleId, after: after.toISOString(), format: "csv" })
                window.open(`/api/reports/trips?${params}`, "_blank")
              }}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            )}
          </div>

          {!selectedVehicleId ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Route className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Select a vehicle</p>
                <p className="text-sm text-muted-foreground/60">Choose a vehicle to view trip reports</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card><CardContent className="p-8 flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></CardContent></Card>
          ) : !trips?.length ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Route className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No trips found</p>
                <p className="text-sm text-muted-foreground/60">No trips recorded for this period</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Route className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-semibold">{totalDistance.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">km</span></p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-semibold">{formatDuration(totalDuration)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Speed</p>
                      <p className="text-sm font-semibold">{avgSpeed.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">km/h</span></p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {trips.map((t, i) => (
                      <div key={i} className="p-3 flex items-center justify-between text-sm hover:bg-accent/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate text-muted-foreground">
                              {t.startLat.toFixed(4)}, {t.startLng.toFixed(4)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(t.startTime).toLocaleString()} → {new Date(t.endTime).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-medium">{t.distance.toFixed(2)} km</p>
                          <p className="text-xs text-muted-foreground">{formatDuration(t.duration)}</p>
                          <p className="text-xs text-muted-foreground">{t.maxSpeed.toFixed(0)} km/h max</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
