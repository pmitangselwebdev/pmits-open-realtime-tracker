"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Map,
  Truck,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Gauge,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useDashboardStore } from "@/stores/dashboard-store"
import { useEffect } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/map", label: "Map", icon: Map },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: Truck },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useDashboardStore()

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024)
  }, [setSidebarOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [setSidebarOpen])

  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [sidebarOpen])

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 72,
          x: sidebarOpen ? 0 : window.innerWidth < 1024 ? -256 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border flex flex-col",
          "lg:translate-x-0"
        )}
      >
        <div className="flex items-center h-16 px-4 gap-3">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="logo-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 flex-1"
              >
                <div className="gradient-accent p-2 rounded-lg shrink-0">
                  <Gauge className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg gradient-text">Tracker</span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                <div className="gradient-accent p-2 rounded-lg">
                  <Gauge className="h-5 w-5 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Separator />

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false)
                }}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "gradient-accent text-white shadow-lg shadow-red-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <AnimatePresence mode="wait">
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            )
          })}
        </nav>

        <Separator />

        <div className="p-3">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 cursor-pointer",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card shadow-md hidden lg:flex"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </motion.aside>
    </>
  )
}
