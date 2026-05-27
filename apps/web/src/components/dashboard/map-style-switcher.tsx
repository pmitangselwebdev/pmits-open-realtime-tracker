"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Layers, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { mapStyles, type MapStyle } from "@/lib/map-styles"

interface MapStyleSwitcherProps {
  currentStyle: string
  onStyleChange: (style: MapStyle) => void
}

export function MapStyleSwitcher({
  currentStyle,
  onStyleChange,
}: MapStyleSwitcherProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
        className="glass shadow-md backdrop-blur-xl gap-2 h-9"
      >
        <Layers className="h-4 w-4" />
        <span className="text-xs">
          {mapStyles.find((s) => s.id === currentStyle)?.name ?? "Style"}
        </span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 w-44 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="p-1.5 space-y-0.5">
              {mapStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    onStyleChange(style)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200",
                    currentStyle === style.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded border shrink-0",
                      style.id === "dark"
                        ? "bg-slate-900 border-slate-700"
                        : style.id === "light"
                        ? "bg-slate-100 border-slate-300"
                        : style.id === "street"
                        ? "bg-blue-100 border-blue-300"
                        : style.id === "satellite"
                        ? "bg-emerald-800 border-emerald-600"
                        : "bg-amber-100 border-amber-300"
                    )}
                  />
                  <span className="flex-1 text-left">{style.name}</span>
                  {currentStyle === style.id && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
