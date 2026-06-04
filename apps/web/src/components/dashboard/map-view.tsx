"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { VehicleWithStatus } from "shared"
import type { MapStyle } from "@/lib/map-styles"
import { getMapStyle, mapStyles } from "@/lib/map-styles"
import { MapStyleSwitcher } from "./map-style-switcher"
import { createMarkerHtml } from "@/lib/vehicle-markers"

interface MapViewProps {
  vehicles: VehicleWithStatus[]
  selectedVehicleId?: string | null
  onVehicleClick?: (id: string) => void
  showOnlineBadge?: boolean
}

interface AnimState {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  startTime: number
  duration: number
}

function createMarkerElement(
  vehicle: VehicleWithStatus,
  isSelected: boolean,
  heading?: number | null,
) {
  const el = document.createElement("div")
  el.className = "vehicle-marker"
  el.dataset.vehicleId = vehicle.id
  el.innerHTML = createMarkerHtml(vehicle, isSelected, heading)
  return el
}

export function MapView({
  vehicles,
  selectedVehicleId,
  onVehicleClick,
  showOnlineBadge = false,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
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

      const lat = anim.fromLat + (anim.toLat - anim.fromLat) * eased
      const lng = anim.fromLng + (anim.toLng - anim.fromLng) * eased

      marker.setLatLng([lat, lng])

      if (t < 1) hasActive = true
    }

    if (hasActive) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = null
    }
  }, [])

  function startAnim(vehicleId: string, fromLat: number, fromLng: number, toLat: number, toLng: number) {
    animsRef.current.set(vehicleId, {
      fromLat, fromLng, toLat, toLng,
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
        const currentPos = existing.getLatLng()

        if (currentPos.lat !== loc.lat || currentPos.lng !== loc.lng) {
          startAnim(
            vehicle.id,
            currentPos.lat, currentPos.lng,
            loc.lat, loc.lng
          )
        }

        const isSelected = selectedVehicleId === vehicle.id
        const newHtml = createMarkerHtml(vehicle, isSelected, loc.heading)
        const el = existing.getElement()
        if (el && el.innerHTML !== newHtml) {
          el.innerHTML = newHtml
        }

        existing.setPopupContent(createPopupHtml(vehicle))
      } else {
        const el = createMarkerElement(vehicle, selectedVehicleId === vehicle.id, loc.heading)
        el.addEventListener("click", () => onVehicleClick?.(vehicle.id))

        const icon = L.divIcon({
          className: "",
          html: el.outerHTML,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        })

        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(createPopupHtml(vehicle), {
            offset: [0, -22],
            closeButton: false,
            className: "vehicle-popup",
          })

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

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }

      tileLayerRef.current = L.tileLayer(style.url, {
        attribution: style.attribution,
        maxZoom: 19,
      }).addTo(map)

      diffMarkers()
    },
    [diffMarkers]
  )

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const initialStyle = getMapStyle("street")
    const map = L.map(mapContainer.current, {
      center: [-6.2088, 106.865],
      zoom: 11,
      attributionControl: false,
    })

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map)
    L.control.zoom({ position: "topright" }).addTo(map)

    tileLayerRef.current = L.tileLayer(initialStyle.url, {
      attribution: initialStyle.attribution,
      maxZoom: 19,
    }).addTo(map)

    map.whenReady(() => {
      map.invalidateSize()
      setMapReady(true)
      diffMarkers()
    })

    mapRef.current = map

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      tileLayerRef.current = null
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
      animsRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    map.flyTo([vehicle.latestLocation.lat, vehicle.latestLocation.lng], 15, {
      duration: 1,
    })
  }, [selectedVehicleId, mapReady])

  return (
    <div className="h-full w-full relative">
      <div
        ref={mapContainer}
        className="h-full w-full rounded-xl overflow-hidden"
      />
      <div className="absolute top-4 left-4 z-[1000] flex items-start gap-2">
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