"use client"

import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Navbar } from "@/components/dashboard/navbar"
import { VehicleDetailPanel } from "@/components/dashboard/vehicle-detail-panel"
import { useDashboardStore } from "@/stores/dashboard-store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <main
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"
        }`}
      >
        <Navbar />
        <div className="flex-1 min-h-0 p-4 lg:p-6 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 min-h-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <VehicleDetailPanel />
    </div>
  )
}
