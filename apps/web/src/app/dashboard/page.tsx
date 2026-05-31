"use client"

import dynamic from "next/dynamic"
import { Truck, Activity, Route, Timer } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { VehicleList } from "@/components/dashboard/vehicle-list"
import { useVehicles } from "@/hooks/use-vehicles"

const MapView = dynamic(
  () => import("@/components/dashboard/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => (
    <div className="h-[400px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground">Loading map...</span>
    </div>
  )}
)

export default function DashboardPage() {
  const { vehicles, onlineCount, isLoading } = useVehicles()

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time overview of your fleet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard
          title="Total Vehicles"
          value={vehicles.length}
          icon={<Truck className="h-5 w-5" />}
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="Online Now"
          value={onlineCount}
          icon={<Activity className="h-5 w-5" />}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Today's Distance"
          value={245}
          unit="km"
          icon={<Route className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. Uptime"
          value={98}
          unit="%"
          icon={<Timer className="h-5 w-5" />}
          trend={{ value: 2, positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 min-h-[200px] lg:min-h-0 h-full">
          <div className="h-full rounded-xl border border-border/50 overflow-hidden">
            <MapView vehicles={vehicles} showOnlineBadge />
          </div>
        </div>
        <div className="lg:col-span-1 max-h-[200px] lg:max-h-none lg:h-full overflow-hidden">
          <div className="h-full p-4 rounded-xl border border-border/50 bg-card flex flex-col">
            <h2 className="font-semibold mb-4 shrink-0">Vehicles</h2>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <VehicleList vehicles={vehicles} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
