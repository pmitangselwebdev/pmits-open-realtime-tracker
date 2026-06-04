"use client"

import { useState, memo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import type { VehicleIconType } from "@/lib/vehicle-markers"

interface VehicleFormData {
  name: string
  plate: string
  uniqueId: string
  color: string
  icon: string
}

interface VehicleDialogProps {
  mode: "add" | "edit"
  initialData?: VehicleFormData & { id: string }
  trigger?: React.ReactNode
}

const TYPES: { value: VehicleIconType; label: string; emoji: string }[] = [
  { value: "ambulance", label: "Ambulance", emoji: "🚑" },
  { value: "rescue", label: "Rescue / Patroli", emoji: "🚙" },
  { value: "tanker", label: "Tanker Air", emoji: "🚚" },
  { value: "command", label: "Pos Komando", emoji: "📡" },
  { value: "truck", label: "Truck Logistik", emoji: "📦" },
  { value: "van", label: "Van / Bus", emoji: "🚐" },
  { value: "suv", label: "SUV / 4x4", emoji: "🛻" },
  { value: "pickup", label: "Pickup", emoji: "🚛" },
  { value: "motor", label: "Motor", emoji: "🏍️" },
  { value: "car", label: "Mobil / Sedan", emoji: "🚗" },
]

export const VehicleDialog = memo(function VehicleDialog({
  mode,
  initialData,
  trigger,
}: VehicleDialogProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialData?.name ?? "")
  const [plate, setPlate] = useState(initialData?.plate ?? "")
  const [uniqueId, setUniqueId] = useState(initialData?.uniqueId ?? "")
  const [color, setColor] = useState(initialData?.color ?? "#dc2626")
  const [type, setType] = useState<string>(initialData?.icon ?? "car")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name || !plate) {
      setError("Name and plate are required")
      return
    }
    if (mode === "add" && !uniqueId) {
      setError("Unique ID is required")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        mode === "add" ? "/api/vehicles" : `/api/vehicles/${initialData!.id}`,
        {
          method: mode === "add" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, plate, uniqueId, color, icon: type }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to save")
      }
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (mode !== "edit" || !initialData) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/vehicles/${initialData.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete vehicle")
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Vehicle" : "Edit Vehicle"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new vehicle to your fleet"
              : "Edit vehicle details"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Vehicle Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ambulans PMI 01"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-xs transition-all border ${
                    type === t.value
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-accent"
                  }`}
                  title={t.label}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight text-center">
                    {t.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate">Plate Number</Label>
            <Input
              id="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="e.g. B 1234 XYZ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uniqueId">Unique ID (device identifier)</Label>
            <Input
              id="uniqueId"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
              placeholder="e.g. TRK-A7X3K9"
              disabled={mode === "edit"}
            />
            <p className="text-xs text-muted-foreground">
              Device uses this ID to send GPS data. Auto-generated if left
              empty.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <span className="text-sm text-muted-foreground font-mono">
                {color}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "add" ? "Create Vehicle" : "Save Changes"}
            </Button>
            {mode === "edit" && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}, (prev, next) => {
  return prev.mode === next.mode && prev.initialData?.id === next.initialData?.id
})