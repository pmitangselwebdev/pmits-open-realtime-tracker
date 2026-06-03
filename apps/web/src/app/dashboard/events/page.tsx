"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Trash2 } from "lucide-react"

interface EventItem {
  id: string
  type: string
  message: string
  timestamp: string
  attributes: Record<string, unknown> | null
  vehicle: { name: string; plate: string } | null
  geofence: { name: string } | null
}

const EVENT_ICONS: Record<string, { label: string; color: string }> = {
  geofence_enter: { label: "Entered Zone", color: "bg-emerald-500" },
  geofence_exit: { label: "Left Zone", color: "bg-red-500" },
  device_online: { label: "Online", color: "bg-emerald-500" },
  device_offline: { label: "Offline", color: "bg-red-500" },
  device_moving: { label: "Moving", color: "bg-blue-500" },
  device_stopped: { label: "Stopped", color: "bg-amber-500" },
  speed_exceed: { label: "Speeding", color: "bg-red-500" },
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchEvents() {
    try {
      const params = filter ? `?type=${filter}` : ""
      const res = await fetch(`/api/events${params}`)
      if (res.ok) setEvents(await res.json())
    } catch {} finally { setLoading(false) }
  }

  async function handleClear() {
    try {
      await fetch("/api/events", { method: "DELETE" })
      setEvents([])
    } catch {}
  }

  const types = [...new Set(events.map((e) => e.type))]

  if (loading) {
    return <div className="flex items-center justify-center h-48"><span className="text-muted-foreground">Loading...</span></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground text-sm">Real-time vehicle events and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button variant={!filter ? "default" : "outline"} size="sm" onClick={() => setFilter(null)}>All</Button>
            {types.slice(0, 4).map((t) => (
              <Button key={t} variant={filter === t ? "default" : "outline"} size="sm" onClick={() => setFilter(filter === t ? null : t)}>
                {EVENT_ICONS[t]?.label ?? t}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear}><Trash2 className="h-4 w-4 mr-1" /> Clear</Button>
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No events yet</p>
            <p className="text-sm text-muted-foreground/60">Events appear here when your vehicles move</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full ${EVENT_ICONS[ev.type]?.color ?? "bg-slate-500"} flex items-center justify-center shrink-0`}>
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{ev.message}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {EVENT_ICONS[ev.type]?.label ?? ev.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{new Date(ev.timestamp).toLocaleString()}</span>
                    {ev.vehicle && <span>• {ev.vehicle.name} ({ev.vehicle.plate})</span>}
                    {ev.geofence && <span>• {ev.geofence.name}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
