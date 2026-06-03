"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: number
  unit?: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean }
  className?: string
}

export function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  className,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress)
      const current = Math.round(start + (end - start) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        prevValue.current = end
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          "group hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300",
          className
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{displayValue}</span>
                {unit && (
                  <span className="text-sm text-muted-foreground">{unit}</span>
                )}
              </div>
              {trend && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      trend.positive ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {trend.positive ? "+" : "-"}
                    {trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs yesterday
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
