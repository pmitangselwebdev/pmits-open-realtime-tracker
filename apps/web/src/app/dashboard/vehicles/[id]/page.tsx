"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVehicles } from "@/hooks/use-vehicles"
import { StatusBadge } from "@/components/dashboard/status-badge"

export default function VehicleDetailPage() {
  const params = useParams()
  const { vehicles, isLoading } = useVehicles()
  const vehicle = vehicles.find((v) => v.id === params.id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
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
        <div>
          <h1 className="text-2xl font-bold">{vehicle.name}</h1>
          <p className="text-muted-foreground text-sm">{vehicle.plate}</p>
        </div>
        <StatusBadge online={vehicle.online} />
      </div>
    </div>
  )
}
