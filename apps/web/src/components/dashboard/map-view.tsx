"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { VehicleWithStatus } from "shared"
import type { MapStyle } from "@/lib/map-styles"
import { getMapStyle } from "@/lib/map-styles"
import { MapStyleSwitcher } from "./map-style-switcher"
import { createMarkerHtml } from "@/lib/vehicle-markers"

interface MapViewProps {
  vehicles: VehicleWithStatus[]
  selectedVehicleId?: string | null
  onVehicleClick?: (id: string) => void
  showOnlineBadge?: boolean
}

interface AnimState {
  fromLng: number
  fromLat: number
  toLng: number
  toLat: number
  startTime: number
  duration: number
}

function createMarkerElement(
  vehicle: VehicleWithStatus,
  isSelected: boolean,
) {
  const el = document.createElement("div")
  el.className = "vehicle-marker"
  el.dataset.vehicleId = vehicle.id
  el.innerHTML = createMarkerHtml(vehicle, isSelected)
  return el
}

export function MapView({
  vehicles,
  selectedVehicleId,
  onVehicleClick,
  showOnlineBadge = false,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const animsRef = useRef<Map<string, AnimState>>(new Map())
  const rafRef = useRef<number | null>(null)
  const [styleId, setStyleId] = useState("street")
  const [mapReady, setMapReady] = useState(false)

  const onlineCount = vehicles.filter((v) => v.online).length

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  const tick = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const now = performance.now()
    let hasActive = false

    for (const [id, anim] of animsRef.current) {
      const marker = markersRef.current.get(id)
      if (!marker) continue

      const elapsed = now - anim.startTime
      const t = Math.min(elapsed / anim.duration, 1)
      const eased = easeOutCubic(t)

      const lng = anim.fromLng + (anim.toLng - anim.fromLng) * eased
      const lat = anim.fromLat + (anim.toLat - anim.fromLat) * eased

      marker.setLngLat([lng, lat])

      if (t < 1) hasActive = true
    }

    if (hasActive) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = null
    }
  }, [])

  function startAnim(vehicleId: string, fromLng: number, fromLat: number, toLng: number, toLat: number) {
    animsRef.current.set(vehicleId, {
      fromLng, fromLat, toLng, toLat,
      startTime: performance.now(),
      duration: 150,
    })

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }

  const diffMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const currentIds = new Set(markersRef.current.keys())
    const targetIds = new Set(vehicles.filter((v) => v.latestLocation).map((v) => v.id))

    for (const id of currentIds) {
      if (!targetIds.has(id)) {
        markersRef.current.get(id)?.remove()
        markersRef.current.delete(id)
        animsRef.current.delete(id)
      }
    }

    vehicles.forEach((vehicle) => {
      const loc = vehicle.latestLocation
      if (!loc) return

      const existing = markersRef.current.get(vehicle.id)
      if (existing) {
        const currentPos = existing.getLngLat()

        if (currentPos.lat !== loc.lat || currentPos.lng !== loc.lng) {
          startAnim(
            vehicle.id,
            currentPos.lng, currentPos.lat,
            loc.lng, loc.lat
          )
        }

        const isSelected = selectedVehicleId === vehicle.id
        const newHtml = createMarkerHtml(vehicle, isSelected)
        if (existing.getElement().innerHTML !== newHtml) {
          existing.getElement().innerHTML = newHtml
        }

        existing.setPopup(
          new maplibregl.Popup({
            offset: 20,
            closeButton: false,
            className: "vehicle-popup",
          }).setHTML(createPopupHtml(vehicle))
        )
      } else {
        const el = createMarkerElement(vehicle, selectedVehicleId === vehicle.id)
        el.addEventListener("click", () => onVehicleClick?.(vehicle.id))

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([loc.lng, loc.lat])
          .setPopup(
            new maplibregl.Popup({
              offset: 20,
              closeButton: false,
              className: "vehicle-popup",
            }).setHTML(createPopupHtml(vehicle))
          )
          .addTo(map)

        markersRef.current.set(vehicle.id, marker)
      }
    })
  }, [vehicles, selectedVehicleId, onVehicleClick])

  function createPopupHtml(vehicle: VehicleWithStatus) {
    const loc = vehicle.latestLocation
    return `
      <div style="
        background:#1e293b;color:#f1f5f9;
        padding:12px 16px;border-radius:12px;
        font-family:system-ui,sans-serif;
        min-width:180px;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);
      ">
        <div style="font-weight:600;font-size:14px;margin-bottom:2px;">${vehicle.name}</div>
        <div style="color:#94a3b8;font-size:12px;margin-bottom:8px;">${vehicle.plate}</div>
        <div style="display:flex;gap:12px;font-size:12px;">
          <span style="color:${vehicle.online ? "#22c55e" : "#6b7280"}">● ${vehicle.online ? "Online" : "Offline"}</span>
          ${loc?.speed != null ? `<span style="color:#94a3b8;">${loc.speed.toFixed(0)} km/h</span>` : ""}
          ${loc?.heading != null ? `<span style="color:#94a3b8;">${loc.heading.toFixed(0)}°</span>` : ""}
        </div>
      </div>
    `
  }

  const handleStyleChange = useCallback(
    (style: MapStyle) => {
      const map = mapRef.current
      if (!map) return
      setStyleId(style.id)
      map.setStyle(style.style as any)
      map.once("style.load", () => {
        diffMarkers()
      })
    },
    [diffMarkers]
  )

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const initialStyle = getMapStyle("street")
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle.style as any,
      center: [106.865, -6.2088],
      zoom: 11,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    )

    map.on("load", () => {
      map.resize()
      setMapReady(true)
      diffMarkers()
    })

    mapRef.current = map

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { map.remove() } catch {}
      mapRef.current = null
      markersRef.current.clear()
      animsRef.current.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapReady) return
    diffMarkers()
  }, [diffMarkers, mapReady])

  const prevSelectedId = useRef<string | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedVehicleId || !mapReady) return
    if (selectedVehicleId === prevSelectedId.current) return
    prevSelectedId.current = selectedVehicleId

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId)
    if (!vehicle?.latestLocation) return

    map.flyTo({
      center: [vehicle.latestLocation.lng, vehicle.latestLocation.lat],
      zoom: 15,
      duration: 1000,
    })
  }, [selectedVehicleId, mapReady])

  return (
    <div className="h-full w-full relative">
      <div
        ref={mapContainer}
        className="h-full w-full rounded-xl overflow-hidden"
      />
      <div className="absolute top-4 left-4 z-20 flex items-start gap-2">
        <MapStyleSwitcher
          currentStyle={styleId}
          onStyleChange={handleStyleChange}
        />
        {showOnlineBadge && (
          <div className="glass px-3 py-1.5 rounded-lg text-sm">
            <span className="text-muted-foreground">Online: </span>
            <span className="font-semibold text-emerald-400">{onlineCount}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="font-semibold">{vehicles.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}
