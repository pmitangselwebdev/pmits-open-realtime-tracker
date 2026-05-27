"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import type { VehicleWithStatus } from "shared"
import { useRealtime } from "./use-realtime"

async function fetchVehicles(): Promise<VehicleWithStatus[]> {
  const res = await fetch("/api/vehicles")
  if (!res.ok) throw new Error("Failed to fetch vehicles")
  return res.json()
}

interface UseVehiclesReturn {
  vehicles: VehicleWithStatus[]
  onlineCount: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<VehicleWithStatus[]>([])

  const {
    data: initialData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    if (initialData) setVehicles(initialData)
  }, [initialData])

  const handleMessage = useCallback(
    (payload: { event: string; payload: any }) => {
      const msg = payload.payload

      if (payload.event === "location_update") {
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === msg.vehicleId
              ? { ...v, latestLocation: msg.location, online: true }
              : v
          )
        )
      }
    },
    []
  )

  useRealtime({
    channel: "locations",
    event: "location_update",
    onMessage: handleMessage,
  })

  const onlineCount = vehicles.filter((v) => v.online).length

  return {
    vehicles,
    onlineCount,
    isLoading,
    error: queryError?.message ?? null,
    refetch,
  }
}
