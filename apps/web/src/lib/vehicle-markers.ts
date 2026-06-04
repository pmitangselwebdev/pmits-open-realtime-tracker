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
  },
  isSelected: boolean,
  heading?: number | null
): string {
  const type = getVehicleType(vehicle.name, vehicle.icon)
  const emoji = VEHICLE_EMOJI[type] ?? VEHICLE_EMOJI.car
  const fontSize = isSelected ? "36px" : "28px"
  const online = vehicle.online ?? false
  const onlineDot = online
    ? `<div style="position:absolute;bottom:-2px;right:-4px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #1e293b;box-shadow:0 0 6px rgba(34,197,94,0.6);"></div>`
    : ""
  const deg = heading ?? 0

  return `<div style="
    width:${isSelected ? "48px" : "36px"};height:${isSelected ? "48px" : "36px"};
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    position:relative;
    filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    font-size:${fontSize};line-height:1;
    transition:transform 0.15s;
    transform:${isSelected ? "scale(1.2)" : "scale(1)"};
  ">
    <div class="marker-rotate" style="transform:rotate(${deg}deg)">${emoji}</div>
    ${onlineDot}
  </div>`
}
