"use client"

import { useCallback, useEffect, useRef } from "react"
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
  const pollingRef = useRef<ReturnType<typeof setInterval>>()

  const {
    data: vehicles = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    staleTime: 15 * 1000,
    refetchInterval: 15_000,
  })

  const handleLocation = useCallback(
    (msg: { vehicleId: string; location: any }) => {
      if (!msg.vehicleId || !msg.location) return
      queryClient.setQueryData<VehicleWithStatus[]>(["vehicles"], (prev) =>
        (prev ?? []).map((v) => {
          if (v.id !== msg.vehicleId) return v
          const existing = v.latestLocation
          const latSame = existing?.lat === msg.location.lat
          const lngSame = existing?.lng === msg.location.lng
          if (latSame && lngSame) return v
          return { ...v, latestLocation: msg.location }
        })
      )
    },
    [queryClient]
  )

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      refetch()
    }, 10_000)

    return () => clearInterval(pollingRef.current)
  }, [refetch])

  useRealtime({
    channel: "locations",
    event: "location_update",
    onMessage: (payload: any) => {
      if (payload?.vehicleId && payload?.location) {
        handleLocation(payload)
      }
    },
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
