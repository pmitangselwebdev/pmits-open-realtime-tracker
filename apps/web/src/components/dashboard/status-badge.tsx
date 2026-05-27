"use client"

import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  online: boolean
  className?: string
}

export function StatusBadge({ online, className }: StatusBadgeProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "relative flex h-2 w-2",
          online && "animate-pulse"
        )}
      >
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full",
            online
              ? "bg-emerald-400 animate-ping opacity-75"
              : "bg-muted-foreground"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            online ? "bg-emerald-400" : "bg-muted-foreground"
          )}
        />
      </span>
      <span className="text-xs font-medium">
        {online ? "Online" : "Offline"}
      </span>
    </div>
  )
}
