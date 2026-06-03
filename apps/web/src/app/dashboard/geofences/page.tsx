"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Circle, Hexagon, MapPin, Plus } from "lucide-react"

interface Geofence {
  id: string
  name: string
  type: string
  radius: number | null
  vertices: { lat: number; lng: number }[]
  color: string
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"]

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"circle" | "polygon">("circle")
  const [radius, setRadius] = useState("500")
  const [lat, setLat] = useState("-6.2088")
  const [lng, setLng] = useState("106.8456")
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    fetchGeofences()
  }, [])

  async function fetchGeofences() {
    try {
      const res = await fetch("/api/geofences")
      if (res.ok) setGeofences(await res.json())
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setError("")
    if (!name.trim()) { setError("Name is required"); return }

    const center = { lat: parseFloat(lat), lng: parseFloat(lng) }
    if (isNaN(center.lat) || isNaN(center.lng)) { setError("Invalid coordinates"); return }

    const body: Record<string, unknown> = { name, type, color, vertices: [center] }
    if (type === "circle") body.radius = parseInt(radius) || 500

    try {
      const res = editing
        ? await fetch("/api/geofences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing, ...body }) })
        : await fetch("/api/geofences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) { setError("Failed to save"); return }
      setShowForm(false)
      setEditing(null)
      setName("")
      fetchGeofences()
    } catch { setError("Network error") }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/geofences?id=${id}`, { method: "DELETE" })
      fetchGeofences()
    } catch {}
  }

  function editGeofence(g: Geofence) {
    setName(g.name)
    setType(g.type as "circle" | "polygon")
    setRadius(String(g.radius ?? 500))
    setLat(String(g.vertices[0]?.lat ?? -6.2088))
    setLng(String(g.vertices[0]?.lng ?? 106.8456))
    setColor(g.color)
    setEditing(g.id)
    setShowForm(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48"><span className="text-muted-foreground">Loading...</span></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Geofences</h1>
          <p className="text-muted-foreground text-sm">Define geographic zones for alerts</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditing(null); setName(""); setType("circle"); setRadius("500"); setLat("-6.2088"); setLng("106.8456"); setColor(COLORS[0]) }}>
          <Plus className="h-4 w-4 mr-2" /> Add Geofence
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{editing ? "Edit" : "New"} Geofence</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Warehouse" />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Shape</label>
                <div className="flex gap-2">
                  <Button variant={type === "circle" ? "default" : "outline"} size="sm" onClick={() => setType("circle")}>
                    <Circle className="h-4 w-4 mr-1" /> Circle
                  </Button>
                  <Button variant={type === "polygon" ? "default" : "outline"} size="sm" onClick={() => setType("polygon")} disabled>
                    <Hexagon className="h-4 w-4 mr-1" /> Polygon
                  </Button>
                </div>
              </div>
              {type === "circle" && (
                <div className="space-y-2">
                  <label className="text-sm">Radius (meters)</label>
                  <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} min="10" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm">Center Latitude</label>
                <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Center Longitude</label>
                <Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button onClick={handleSave}>{editing ? "Update" : "Create"} Geofence</Button>
          </CardContent>
        </Card>
      )}

      {geofences.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No geofences yet</p>
            <p className="text-sm text-muted-foreground/60">Create your first geofence to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {geofences.map((g) => (
            <Card key={g.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                  <h3 className="font-medium truncate flex-1">{g.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editGeofence(g)}>
                      <span className="text-xs">✎</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(g.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Type: {g.type}</p>
                  {g.type === "circle" && <p>Radius: {g.radius}m</p>}
                  <p className="truncate">
                    {g.vertices[0]?.lat.toFixed(4)}, {g.vertices[0]?.lng.toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
