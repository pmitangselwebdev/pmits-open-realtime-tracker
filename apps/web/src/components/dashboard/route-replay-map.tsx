"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine"
import "leaflet-routing-machine/dist/leaflet-routing-machine.css"
import { Play, Pause, SkipBack, SkipForward, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getMapStyle } from "@/lib/map-styles"
import { createMarkerHtml } from "@/lib/vehicle-markers"

interface LocationPoint {
  id: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  timestamp: string
}

interface RouteReplayMapProps {
  locations: LocationPoint[]
  vehicleName: string
  vehicleColor: string
  vehicleIcon?: string | null
  isLoading: boolean
  route?: [number, number][] | null
}

const SPEEDS = [1, 2, 5, 10] as const

export function RouteReplayMap({
  locations,
  vehicleName,
  vehicleColor,
  vehicleIcon,
  isLoading,
  route,
}: RouteReplayMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const animRef = useRef<number | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const routingControlRef = useRef<any>(null)
  const projectedRef = useRef<[number, number][]>([])
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(2)
  const [progress, setProgress] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const progressRef = useRef(0)
  const currentIdxRef = useRef(0)

  const totalPoints = locations.length

  function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180
    const lat1Rad = lat1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180
    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  }

  function applyHeading(deg: number) {
    const markerEl = markerRef.current?.getElement()
    const rotateEl = markerEl?.querySelector(".marker-rotate") as HTMLElement | null
    if (rotateEl) {
      rotateEl.style.transform = `rotate(${deg}deg)`
    }
  }

  function findNearestOnRoute(lat: number, lng: number, coords: [number, number][]): [number, number] {
    let minDist = Infinity
    let closest: [number, number] = [lat, lng]
    for (const [rlng, rlat] of coords) {
      const dx = rlat - lat
      const dy = rlng - lng
      const d = dx * dx + dy * dy
      if (d < minDist) {
        minDist = d
        closest = [rlat, rlng]
      }
    }
    return closest
  }

  function drawRoute() {
    const map = mapRef.current
    if (!map || locations.length < 1) return

    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
    if (routingControlRef.current) {
      try { map.removeControl(routingControlRef.current) } catch {}
      routingControlRef.current = null
    }

    const routeCoords = route
      ? route.map(([lng, lat]) => [lat, lng] as [number, number])
      : locations.map((l) => [l.lat, l.lng] as [number, number])

    polylineRef.current = L.polyline(routeCoords, {
      color: "#3b82f6",
      weight: 4,
      opacity: 0.85,
    }).addTo(map)

    map.fitBounds(polylineRef.current.getBounds(), { padding: [60, 60], maxZoom: 15 })

    projectedRef.current = route
      ? locations.map((l) => findNearestOnRoute(l.lat, l.lng, route))
      : locations.map((l) => [l.lat, l.lng] as [number, number])

    const proj = projectedRef.current
    const initHeading = proj.length > 1 ? bearing(proj[0][0], proj[0][1], proj[1][0], proj[1][1]) : 0
    const markerHtml = createMarkerHtml({
      id: "replay",
      name: vehicleName,
      color: vehicleColor,
      icon: vehicleIcon,
      online: false,
    }, false, initHeading)

    const icon = L.divIcon({
      className: "",
      html: markerHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
    markerRef.current = L.marker(locations.length > 0
      ? [projectedRef.current[0][0], projectedRef.current[0][1]]
      : [0, 0], { icon }).addTo(map)

    try {
      const waypoints = locations.slice(0, 20).map((l) => L.latLng(l.lat, l.lng))
      const routing = L.Routing.control({
        waypoints,
        routeWhileDragging: false,
        show: false,
        collapsible: true,
        fitSelectedRoutes: false,
        lineOptions: {
          styles: [{ color: "#6366f1", weight: 4, opacity: 0.5 }],
          extendToWaypoints: false,
          missingRouteTolerance: 10,
        },
      } as any)
      routingControlRef.current = routing.addTo(map)
    } catch {}
  }

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = L.map(mapContainer.current, {
      attributionControl: false,
      center: [-6.2088, 106.865],
      zoom: 13,
    })

    const initialStyle = getMapStyle("street")
    L.tileLayer(initialStyle.url, {
      attribution: initialStyle.attribution,
      maxZoom: 19,
    }).addTo(map)

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map)
    L.control.zoom({ position: "topright" }).addTo(map)

    mapRef.current = map

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      try { map.remove() } catch {}
      mapRef.current = null
      markerRef.current = null
      polylineRef.current = null
      routingControlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return
    mapRef.current.invalidateSize()
    drawRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, route, vehicleColor, vehicleIcon])

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  const startAnimation = useCallback(() => {
    if (locations.length < 2) return

    let lastTime = performance.now()

    function easeInOutQuad(t: number): number {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    function animate(time: number) {
      const idx = currentIdxRef.current
      if (idx >= locations.length - 1) {
        setPlaying(false)
        return
      }

      const current = locations[idx]
      const next = locations[idx + 1]
      const tA = new Date(current.timestamp).getTime()
      const tB = new Date(next.timestamp).getTime()
      const realDuration = (tB - tA) / speed
      const duration = Math.max(realDuration, 50)

      const elapsed = time - lastTime
      const rawT = Math.min(elapsed / duration, 1)
      const easedT = easeInOutQuad(rawT)

      const proj = projectedRef.current
      const from = proj[idx] ?? [current.lat, current.lng]
      const to = proj[Math.min(idx + 1, proj.length - 1)] ?? [next.lat, next.lng]
      const lat = from[0] + (to[0] - from[0]) * easedT
      const lng = from[1] + (to[1] - from[1]) * easedT

      markerRef.current?.setLatLng([lat, lng])

      if (from[0] !== to[0] || from[1] !== to[1]) {
        applyHeading(bearing(from[0], from[1], to[0], to[1]))
      }

      const globalProgress = (idx + rawT) / (locations.length - 1)
      progressRef.current = globalProgress
      setProgress(globalProgress)

      if (rawT >= 1) {
        currentIdxRef.current = idx + 1
        setCurrentIdx(idx + 1)
        lastTime = time
      }

      animRef.current = requestAnimationFrame(animate)
    }

    lastTime = performance.now()
    animRef.current = requestAnimationFrame(animate)
  }, [locations, speed])

  useEffect(() => {
    if (playing) {
      startAnimation()
    } else {
      stopAnimation()
    }
    return stopAnimation
  }, [playing, startAnimation, stopAnimation])

  function handlePlayPause() {
    if (playing) {
      setPlaying(false)
    } else {
      if (currentIdxRef.current >= locations.length - 1) {
        currentIdxRef.current = 0
        setCurrentIdx(0)
        progressRef.current = 0
        setProgress(0)
        const proj = projectedRef.current
        if (proj.length > 0 && markerRef.current) {
          markerRef.current.setLatLng([proj[0][0], proj[0][1]])
          if (proj.length > 1) {
            applyHeading(bearing(proj[0][0], proj[0][1], proj[1][0], proj[1][1]))
          }
        }
      }
      setPlaying(true)
    }
  }

  function headingAt(idx: number): number {
    const proj = projectedRef.current
    if (idx < proj.length - 1) {
      return bearing(proj[idx][0], proj[idx][1], proj[idx + 1][0], proj[idx + 1][1])
    }
    if (idx > 0) {
      const h = bearing(proj[idx - 1][0], proj[idx - 1][1], proj[idx][0], proj[idx][1])
      return (h + 180) % 360
    }
    return 0
  }

  function handleSkip(forward: boolean) {
    const step = forward ? 20 : -20
    const newIdx = Math.max(0, Math.min(locations.length - 1, currentIdxRef.current + step))
    currentIdxRef.current = newIdx
    setCurrentIdx(newIdx)
    setProgress(newIdx / (locations.length - 1))
    const proj = projectedRef.current
    if (proj[newIdx] && markerRef.current) {
      markerRef.current.setLatLng([proj[newIdx][0], proj[newIdx][1]])
      applyHeading(headingAt(newIdx))
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const idx = Math.round(pct * (locations.length - 1))
    const clamped = Math.max(0, Math.min(locations.length - 1, idx))
    currentIdxRef.current = clamped
    setCurrentIdx(clamped)
    setProgress(clamped / (locations.length - 1))
    const proj = projectedRef.current
    if (proj[clamped] && markerRef.current) {
      markerRef.current.setLatLng([proj[clamped][0], proj[clamped][1]])
      const map = mapRef.current
      if (map) {
        map.flyTo([proj[clamped][0], proj[clamped][1]], 14, { duration: 0.4 })
      }
      applyHeading(headingAt(clamped))
    }
  }

  const currentLoc = locations[currentIdx]
  const pct = Math.round(progress * 100)

  return (
    <div className="h-full w-full relative rounded-xl overflow-hidden border border-border/50">
      <div ref={mapContainer} className="h-full w-full absolute inset-0 z-0" />

      {isLoading && (
        <div className="absolute inset-0 z-10 bg-muted/80 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && locations.length === 0 && (
        <div className="absolute inset-0 z-10 bg-muted/80 flex items-center justify-center">
          <p className="text-muted-foreground">No location data for this period</p>
        </div>
      )}

      <div className="absolute top-3 left-3 z-[1000] flex items-start gap-2 pointer-events-none">
        <Card className="px-3 py-1.5 bg-background/90 backdrop-blur-sm pointer-events-auto">
          <p className="text-sm font-medium">{vehicleName}</p>
          <p className="text-xs text-muted-foreground">
            {currentIdx + 1} / {totalPoints} points
          </p>
        </Card>
      </div>

      {currentLoc && (
        <div className="absolute top-3 right-3 z-[1000]">
          <Card className="px-3 py-1.5 bg-background/90 backdrop-blur-sm text-xs space-y-0.5">
            <p className="font-mono">
              {currentLoc.lat.toFixed(4)}, {currentLoc.lng.toFixed(4)}
            </p>
            {currentLoc.speed != null && (
              <p className="text-muted-foreground">
                {currentLoc.speed.toFixed(0)} km/h
              </p>
            )}
            <p className="text-muted-foreground">
              {new Date(currentLoc.timestamp).toLocaleTimeString()}
            </p>
          </Card>
        </div>
      )}

      {totalPoints > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-t from-background/90 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 max-w-xl mx-auto pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleSkip(false)}
              disabled={locations.length < 2}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={handlePlayPause}
              disabled={locations.length < 2}
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleSkip(true)}
              disabled={locations.length < 2}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div
              className="flex-1 h-2 bg-muted rounded-full cursor-pointer relative group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-75"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${pct}% - 8px)` }}
              />
            </div>

            <span className="text-xs text-muted-foreground font-mono w-10 text-right shrink-0">
              {pct}%
            </span>

            <div className="flex gap-1 shrink-0">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    speed === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}