"use client"

import dynamic from "next/dynamic"
import { useVehicles } from "@/hooks/use-vehicles"
import { useDashboardStore } from "@/stores/dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VehicleList } from "@/components/dashboard/vehicle-list"
import { VehicleDetailPanel } from "@/components/dashboard/vehicle-detail-panel"

const MapView = dynamic(
  () => import("@/components/dashboard/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => (
    <div className="h-full rounded-xl bg-muted animate-pulse" />
  )}
)

export default function MapPage() {
  const { vehicles, isLoading } = useVehicles()
  const { selectedVehicleId, selectVehicle } = useDashboardStore()

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
        <div className="flex-1 min-h-[200px] lg:min-h-0 rounded-xl border border-border/50 overflow-hidden">
          <MapView
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleClick={selectVehicle}
            showOnlineBadge
          />
        </div>

        <div className="lg:w-80 shrink-0 max-h-[200px] lg:max-h-none">
          <div className="p-4 rounded-xl border border-border/50 bg-card h-full">
            <h2 className="font-semibold mb-4">Vehicles</h2>
            <ScrollArea className="h-[calc(100%-2rem)]">
              <VehicleList vehicles={vehicles} isLoading={isLoading} />
            </ScrollArea>
          </div>
        </div>
      </div>
      <VehicleDetailPanel />
    </>
  )
}
