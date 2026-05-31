"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
  const queryClient = useQueryClient()

  const {
    data: vehicles = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    staleTime: 30 * 1000,
  })

  const handleMessage = useCallback(
    (msg: { vehicleId: string; location: any }) => {
      queryClient.setQueryData<VehicleWithStatus[]>(["vehicles"], (prev) =>
        (prev ?? []).map((v) =>
          v.id === msg.vehicleId
            ? { ...v, latestLocation: msg.location, online: true }
            : v
        )
      )
    },
    [queryClient]
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
