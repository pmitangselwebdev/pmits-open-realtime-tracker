"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowLeft, Gauge, Navigation, Battery, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useVehicles } from "@/hooks/use-vehicles"
import { StatusBadge } from "@/components/dashboard/status-badge"

const MapView = dynamic(
  () => import("@/components/dashboard/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-64 rounded-xl bg-muted animate-pulse" /> }
)

export default function VehicleDetailPage() {
  const params = useParams()
  const { vehicles, isLoading } = useVehicles()
  const vehicle = vehicles.find((v) => v.id === params.id)
  const loc = vehicle?.latestLocation

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Vehicle not found</p>
        <Link href="/dashboard/vehicles">
          <Button variant="link">Back to vehicles</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">{vehicle.name}</h1>
            <p className="text-muted-foreground text-sm">{vehicle.plate}</p>
          </div>
          <StatusBadge online={vehicle.online} />
        </div>
        <div className="ml-auto">
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            {vehicle.uniqueId}
          </span>
        </div>
      </div>

      <div className="h-64 lg:h-80 rounded-xl border border-border/50 overflow-hidden">
        <MapView
          vehicles={[vehicle]}
          selectedVehicleId={vehicle.id}
          showOnlineBadge={false}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-4 w-4" />
              <span className="text-xs">Speed</span>
            </div>
            <p className="text-2xl font-bold">
              {loc?.speed?.toFixed(0) ?? "--"}
              <span className="text-sm font-normal text-muted-foreground ml-1">km/h</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Navigation className="h-4 w-4" />
              <span className="text-xs">Heading</span>
            </div>
            <p className="text-2xl font-bold">
              {loc?.heading?.toFixed(0) ?? "--"}
              <span className="text-sm font-normal text-muted-foreground ml-1">°</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Battery className="h-4 w-4" />
              <span className="text-xs">Battery</span>
            </div>
            <p className="text-2xl font-bold">
              {loc?.battery?.toFixed(0) ?? "--"}
              <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-xs">Accuracy</span>
            </div>
            <p className="text-2xl font-bold">
              {loc?.accuracy?.toFixed(0) ?? "--"}
              <span className="text-sm font-normal text-muted-foreground ml-1">m</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Location Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Latitude</span>
              <span className="font-mono">{loc?.lat?.toFixed(6) ?? "--"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Longitude</span>
              <span className="font-mono">{loc?.lng?.toFixed(6) ?? "--"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Last Updated</span>
              <span className="font-mono text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {loc?.timestamp
                  ? new Date(loc.timestamp).toLocaleString()
                  : "--"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
