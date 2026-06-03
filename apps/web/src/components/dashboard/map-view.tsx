"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { VehicleWithStatus } from "shared"
import type { MapStyle } from "@/lib/map-styles"
import { getMapStyle } from "@/lib/map-styles"
import { MapStyleSwitcher } from "./map-style-switcher"

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
  fromHeading: number
  toHeading: number
  startTime: number
  duration: number
}

function getVehicleType(name: string): string {
  const n = name.toLowerCase()
  if (["motor", "supra", "vario", "beat", "nmax", "scooter", "klx", "crf"].some((k) => n.includes(k))) return "motor"
  if (["truck", "colt", "elf", "dyna", "canter"].some((k) => n.includes(k))) return "truck"
  if (["van", "hiace", "bus", "travel", "combi"].some((k) => n.includes(k))) return "van"
  if (["suv", "jeep", "pajero", "fortuner", "crv", "terios", "rush"].some((k) => n.includes(k))) return "suv"
  return "car"
}

function getVehicleSvg(type: string, color: string): string {
  const paths: Record<string, string> = {
    car: `<path d="M6 5Q6 3 9 3L15 3Q18 3 18 5L18 19Q18 21 15 21L9 21Q6 21 6 19Z" fill="${color}"/>
<path d="M8 7L16 7Q17 7 17 8L17 11L7 11L7 8Q7 7 8 7Z" fill="rgba(0,0,0,0.15)"/>`,
    suv: `<path d="M5 4Q5 2 8 2L16 2Q19 2 19 4L19 20Q19 22 16 22L8 22Q5 22 5 20Z" fill="${color}"/>
<path d="M7 6L17 6Q18 6 18 7L18 10L6 10L6 7Q6 6 7 6Z" fill="rgba(0,0,0,0.12)"/>
<rect x="9.5" y="3.5" width="5" height="2" rx="0.5" fill="rgba(0,0,0,0.08)"/>`,
    van: `<rect x="4" y="3" width="16" height="18" rx="3" fill="${color}"/>
<rect x="6" y="6" width="12" height="13" rx="1.5" fill="rgba(0,0,0,0.1)"/>
<rect x="11" y="3.5" width="2" height="1.5" rx="0.5" fill="rgba(0,0,0,0.08)"/>`,
    truck: `<rect x="3" y="5" width="10" height="14" rx="1.5" fill="${color}"/>
<path d="M13 5L16 5Q18 5 18 7L18 19L13 19Z" fill="${color}" fill-opacity="0.85"/>
<rect x="14.5" y="5.5" width="2" height="5" rx="0.5" fill="rgba(0,0,0,0.1)"/>`,
    motor: `<rect x="10" y="4.5" width="4" height="15" rx="1.5" fill="${color}"/>
<circle cx="9" cy="5" r="2.2" fill="${color}"/>
<circle cx="9" cy="19" r="2.2" fill="${color}"/>`,
  }
  return paths[type] ?? paths.car
}

function createMarkerElement(
  vehicle: VehicleWithStatus,
  isSelected: boolean
) {
  const el = document.createElement("div")
  el.className = "vehicle-marker"
  el.dataset.vehicleId = vehicle.id
  const color = vehicle.online ? (vehicle.color ?? "#3b82f6") : "#6b7280"
  const size = isSelected ? 40 : 32
  const type = getVehicleType(vehicle.name)
  const svg = getVehicleSvg(type, color)

  el.innerHTML = `
    <div style="
      width: ${size}px; height: ${size}px;
      cursor: pointer; position: relative;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
      will-change: transform;
    ">
      <svg viewBox="0 0 24 24" width="100%" height="100%"
        style="display:block;will-change:transform">
        ${svg}
      </svg>
      ${vehicle.online ? `<div style="
        position:absolute;top:-2px;right:-2px;
        width:8px;height:8px;border-radius:50%;
        background:#22c55e;
        box-shadow:0 0 6px rgba(34,197,94,0.6);
      "></div>` : ""}
    </div>
  `
  return el
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return a + diff * t
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
      const heading = lerpAngle(anim.fromHeading, anim.toHeading, eased)

      marker.setLngLat([lng, lat])
      const svg = marker.getElement().querySelector("svg")
      if (svg) svg.style.transform = `rotate(${heading}deg)`

      if (t < 1) hasActive = true
    }

    if (hasActive) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = null
    }
  }, [])

  function startAnim(vehicleId: string, fromLng: number, fromLat: number, toLng: number, toLat: number, fromHeading: number, toHeading: number) {
    animsRef.current.set(vehicleId, {
      fromLng, fromLat, toLng, toLat,
      fromHeading, toHeading,
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
        const markerEl = existing.getElement()
        const svgEl = markerEl.querySelector("svg")

        let currentHeading = 0
        if (svgEl) {
          const match = svgEl.style.transform.match(/rotate\(([\d.-]+)deg\)/)
          currentHeading = match ? parseFloat(match[1]) : 0
        }

        const newHeading = loc.heading ?? currentHeading

        if (currentPos.lat !== loc.lat || currentPos.lng !== loc.lng || newHeading !== currentHeading) {
          startAnim(
            vehicle.id,
            currentPos.lng, currentPos.lat,
            loc.lng, loc.lat,
            currentHeading, newHeading
          )
        }

        const container = markerEl.firstElementChild as HTMLElement
        if (!container) return
        const svg = container.querySelector("svg")
        if (!svg) return

        const isSelected = selectedVehicleId === vehicle.id
        const expectedSize = isSelected ? 40 : 32
        if (container.style.width !== `${expectedSize}px`) {
          container.style.width = `${expectedSize}px`
          container.style.height = `${expectedSize}px`
        }

        const isOnline = vehicle.online
        const dot = container.querySelector("div")
        if (isOnline && !dot) {
          const newDot = document.createElement("div")
          newDot.style.cssText = "position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,0.6)"
          container.appendChild(newDot)
        } else if (!isOnline && dot) {
          dot.remove()
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
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
      animsRef.current.clear()
    }
  }, [diffMarkers])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) {
      const onLoad = () => diffMarkers()
      map?.on("style.load", onLoad)
      return () => {
        map?.off("style.load", onLoad)
      }
    }
    diffMarkers()
  }, [diffMarkers, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedVehicleId || !mapReady) return

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId)
    if (!vehicle?.latestLocation) return

    map.flyTo({
      center: [vehicle.latestLocation.lng, vehicle.latestLocation.lat],
      zoom: 15,
      duration: 1000,
    })
  }, [selectedVehicleId, vehicles, mapReady])

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
