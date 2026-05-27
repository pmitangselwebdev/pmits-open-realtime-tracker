import { create } from "zustand"

interface DashboardState {
  sidebarOpen: boolean
  selectedVehicleId: string | null
  vehicleDetailOpen: boolean
  searchQuery: string
  filter: "all" | "online" | "offline"

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  selectVehicle: (id: string | null) => void
  setVehicleDetailOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setFilter: (filter: "all" | "online" | "offline") => void
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  sidebarOpen: true,
  selectedVehicleId: null,
  vehicleDetailOpen: false,
  searchQuery: "",
  filter: "all",

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectVehicle: (id) =>
    set({ selectedVehicleId: id, vehicleDetailOpen: id !== null }),
  setVehicleDetailOpen: (open) => set({ vehicleDetailOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
}))
