"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"

interface VehicleFormData {
  name: string
  plate: string
  uniqueId: string
  color: string
}

interface VehicleDialogProps {
  mode: "add" | "edit"
  initialData?: VehicleFormData & { id: string }
  onSave: (data: VehicleFormData) => Promise<void>
  onDelete?: () => Promise<void>
  trigger?: React.ReactNode
}

export function VehicleDialog({
  mode,
  initialData,
  onSave,
  onDelete,
  trigger,
}: VehicleDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialData?.name ?? "")
  const [plate, setPlate] = useState(initialData?.plate ?? "")
  const [uniqueId, setUniqueId] = useState(initialData?.uniqueId ?? "")
  const [color, setColor] = useState(initialData?.color ?? "#dc2626")
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
      await onSave({ name, plate, uniqueId, color })
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete()
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
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Vehicle Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Honda Civic"
            />
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
            {mode === "edit" && onDelete && (
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
}
