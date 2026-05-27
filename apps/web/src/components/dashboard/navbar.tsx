"use client"

import { useDashboardStore } from "@/stores/dashboard-store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Search, Bell, Menu } from "lucide-react"

export function Navbar() {
  const { searchQuery, setSearchQuery, toggleSidebar } = useDashboardStore()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="lg:hidden shrink-0"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-accent/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
        </Button>
        <ThemeToggle />
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
          <div className="h-8 w-8 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
        </div>
      </div>
    </header>
  )
}
