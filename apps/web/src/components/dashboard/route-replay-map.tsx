"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Play, Pause, SkipBack, SkipForward, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MapStyleSwitcher } from "./map-style-switcher"
import type { MapStyle } from "@/lib/map-styles"
import { getMapStyle } from "@/lib/map-styles"

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
  isLoading: boolean
  route?: [number, number][] | null
}

const SPEEDS = [1, 2, 5, 10] as const

function createAnimatedMarker(color: string) {
  const el = document.createElement("div")
  el.innerHTML = `
    <div style="
      width: 28px; height: 28px;
      position: relative;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
      transition: transform 0.05s linear;
    ">
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <path d="M6 5Q6 3 9 3L15 3Q18 3 18 5L18 19Q18 21 15 21L9 21Q6 21 6 19Z" fill="${color}"/>
        <path d="M8 7L16 7Q17 7 17 8L17 11L7 11L7 8Q7 7 8 7Z" fill="rgba(0,0,0,0.15)"/>
      </svg>
      <div style="
        position:absolute;top:-3px;right:-3px;
        width:10px;height:10px;border-radius:50%;
        background:#22c55e;
        box-shadow:0 0 8px rgba(34,197,94,0.8);
      "></div>
    </div>
  `
  return el
}

export function RouteReplayMap({
  locations,
  vehicleName,
  vehicleColor,
  isLoading,
  route,
}: RouteReplayMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const animRef = useRef<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(2)
  const [progress, setProgress] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [styleId, setStyleId] = useState("street")
  const progressRef = useRef(0)
  const currentIdxRef = useRef(0)

  const totalPoints = locations.length

  const routeSourceId = "route-line"

  const drawRoute = useCallback((map: maplibregl.Map) => {
    if (locations.length < 2) return

    const coords = route ?? locations.map((l) => [l.lng, l.lat] as [number, number])

    const src = map.getSource(routeSourceId) as maplibregl.GeoJSONSource
    if (src) {
      try {
        src.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        })
      } catch {}
    } else {
      try {
        map.addSource(routeSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        })

        map.addLayer({
          id: `${routeSourceId}-line`,
          type: "line",
          source: routeSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.85,
          },
        })

        map.addLayer({
          id: `${routeSourceId}-glow`,
          type: "line",
          source: routeSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 10,
            "line-opacity": 0.2,
          },
        })
      } catch {}
    }
  }, [locations, route])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const initialStyle = getMapStyle(styleId)
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle.style as any,
      center: locations.length > 0
        ? [locations[0].lng, locations[0].lat]
        : [106.865, -6.2088],
      zoom: 13,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")

    map.on("load", () => {
      map.resize()
      drawRoute(map)

      if (locations.length > 0) {
        const el = createAnimatedMarker(vehicleColor)
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([locations[0].lng, locations[0].lat])
          .addTo(map)
      }
    })

    mapRef.current = map

    return () => {
      stopAnimation()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    drawRoute(map)
  }, [locations, drawRoute])

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  const startAnimation = useCallback(() => {
    if (locations.length < 2) return

    let lastTime = performance.now()
    let lastHeading: number | null = locations[0]?.heading ?? null

    function easeInOutQuad(t: number): number {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    function lerpAngle(a: number, b: number, t: number): number {
      let diff = b - a
      if (diff > 180) diff -= 360
      if (diff < -180) diff += 360
      return a + diff * t
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

      const lat = current.lat + (next.lat - current.lat) * easedT
      const lng = current.lng + (next.lng - current.lng) * easedT

      markerRef.current?.setLngLat([lng, lat])

      const currentHeading = current.heading ?? lastHeading ?? 0
      const nextHeading = next.heading ?? currentHeading
      const smoothHeading = lerpAngle(currentHeading, nextHeading, easedT)
      lastHeading = smoothHeading

      markerRef.current?.getElement().querySelector("svg")?.style.setProperty(
        "transform",
        `rotate(${smoothHeading}deg)`
      )

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
    lastHeading = locations[0]?.heading ?? null
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
        if (locations.length > 0 && markerRef.current) {
          markerRef.current.setLngLat([locations[0].lng, locations[0].lat])
        }
      }
      setPlaying(true)
    }
  }

  function handleSkip(forward: boolean) {
    const step = forward ? 20 : -20
    const newIdx = Math.max(0, Math.min(locations.length - 1, currentIdxRef.current + step))
    currentIdxRef.current = newIdx
    setCurrentIdx(newIdx)
    setProgress(newIdx / (locations.length - 1))
    if (locations[newIdx]) {
      markerRef.current?.setLngLat([locations[newIdx].lng, locations[newIdx].lat])
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
    if (locations[clamped]) {
      markerRef.current?.setLngLat([locations[clamped].lng, locations[clamped].lat])
      const map = mapRef.current
      if (map) {
        map.flyTo({
          center: [locations[clamped].lng, locations[clamped].lat],
          zoom: 14,
          duration: 400,
        })
      }
    }
  }

  useEffect(() => {
    if (locations.length > 0 && markerRef.current) {
      markerRef.current.setLngLat([locations[0].lng, locations[0].lat])
      const map = mapRef.current
      if (map) {
        map.fitBounds(
          locations.reduce(
            (b, l) => b.extend([l.lng, l.lat]),
            new maplibregl.LngLatBounds([locations[0].lng, locations[0].lat], [locations[0].lng, locations[0].lat])
          ),
          { padding: 60, maxZoom: 15 }
        )
      }
    }
  }, [locations])

  const currentLoc = locations[currentIdx]

  const handleStyleChange = useCallback(
    (style: MapStyle) => {
      setStyleId(style.id)
      const map = mapRef.current
      if (!map) return
      map.setStyle(style.style as any)
      map.once("style.load", () => {
        if (locations.length > 0) {
          const existed = markerRef.current
          if (existed) {
            existed.addTo(map)
          } else {
            const el = createAnimatedMarker(vehicleColor)
            markerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat([locations[currentIdxRef.current]?.lng ?? locations[0].lng, locations[currentIdxRef.current]?.lat ?? locations[0].lat])
              .addTo(map)
          }
          drawRoute(map)
        }
      })
    },
    [vehicleColor, locations, drawRoute]
  )

  if (isLoading) {
    return (
      <div className="h-full rounded-xl bg-muted animate-pulse flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="h-full rounded-xl bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No location data for this period</p>
      </div>
    )
  }

  const pct = Math.round(progress * 100)

  return (
    <div className="h-full w-full relative rounded-xl overflow-hidden border border-border/50">
      <div ref={mapContainer} className="h-full w-full" />

      <div className="absolute top-3 left-3 z-10 flex items-start gap-2">
        <MapStyleSwitcher
          currentStyle={styleId}
          onStyleChange={handleStyleChange}
        />
        <Card className="px-3 py-1.5 bg-background/90 backdrop-blur-sm">
          <p className="text-sm font-medium">{vehicleName}</p>
          <p className="text-xs text-muted-foreground">
            {currentIdx + 1} / {totalPoints} points
          </p>

        </Card>
      </div>

      {currentLoc && (
        <div className="absolute top-3 right-3 z-10">
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
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-background/90 to-transparent">
          <div className="flex items-center gap-3 max-w-xl mx-auto">
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
