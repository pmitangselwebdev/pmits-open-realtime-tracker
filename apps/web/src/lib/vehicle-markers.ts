export const VEHICLE_EMOJI: Record<string, string> = {
  ambulance: "🚑",
  rescue: "🚙",
  tanker: "🚚",
  command: "📡",
  truck: "📦",
  van: "🚐",
  suv: "🛻",
  pickup: "🚛",
  motor: "🏍️",
  car: "🚗",
}

const VEHICLE_TYPES = Object.keys(VEHICLE_EMOJI) as VehicleIconType[]
export type VehicleIconType = keyof typeof VEHICLE_EMOJI

export function getVehicleType(name: string, explicitType?: string | null): VehicleIconType {
  if (explicitType && explicitType in VEHICLE_EMOJI) return explicitType as VehicleIconType
  const n = name.toLowerCase()
  if (["ambulan", "ambulance", "amb", "mobil jenazah", "jenazah", "korban"].some((k) => n.includes(k))) return "ambulance"
  if (["tanker", "tandon", "water", "air bersih", "tangki"].some((k) => n.includes(k))) return "tanker"
  if (["command", "posko", "pos komando", "hq", "komunikasi", "radio", "pks"].some((k) => n.includes(k))) return "command"
  if (["logistik", "logistic", "dapur umum", "dapur", "distribusi", "bantuan", "sembako", "cargo", "kargo"].some((k) => n.includes(k))) return "truck"
  if (["rescue", "sar", "tim respon", "respon", "patroli", "patrol", "assessment", "assess", "rover", "range rover"].some((k) => n.includes(k))) return "rescue"
  if (["truck", "truk", "colt", "elf", "dyna", "canter", "tronton", "fuso", "wingbox", "box"].some((k) => n.includes(k))) return "truck"
  if (["van", "hiace", "bus", "travel", "combi", "elf long"].some((k) => n.includes(k))) return "van"
  if (["suv", "jeep", "pajero", "fortuner", "crv", "terios", "rush", "x-trail", "innova", "land cruiser"].some((k) => n.includes(k))) return "suv"
  if (["pickup", "hilux", "strada", "triton", "d-max"].some((k) => n.includes(k))) return "pickup"
  if (["motor", "supra", "vario", "beat", "nmax", "scooter", "klx", "crf"].some((k) => n.includes(k))) return "motor"
  return "car"
}

export function createMarkerHtml(
  vehicle: {
    id: string
    name: string
    color?: string | null
    icon?: string | null
    online?: boolean
    latestLocation?: { heading?: number | null; lat: number; lng: number } | null
  },
  isSelected: boolean
): string {
  const loc = vehicle.latestLocation
  if (!loc) return ""

  const color = vehicle.color ?? "#dc2626"
  const type = getVehicleType(vehicle.name, vehicle.icon)
  const emoji = VEHICLE_EMOJI[type] ?? VEHICLE_EMOJI.car
  const size = isSelected ? 52 : 42
  const online = vehicle.online ?? false
  const borderColor = online ? color : "#6b7280"
  const onlineDot = online
    ? `<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #1e293b;box-shadow:0 0 8px rgba(34,197,94,0.7);"></div>`
    : ""

  return `<div style="
    width:${size}px;height:${size}px;
    cursor:pointer;position:relative;
    will-change:transform;
  ">
    <div style="
      width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;
      background:${online ? `${color}25` : "#1e293b"};
      border:2px solid ${borderColor};
      border-radius:50%;
      box-shadow:${online ? `0 0 12px ${color}40` : "0 2px 8px rgba(0,0,0,0.2)"};
      transition:all 0.2s;
      font-size:${isSelected ? "24px" : "20px"};
      line-height:1;
    ">${emoji}</div>
    ${onlineDot}
  </div>`
}
