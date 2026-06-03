const COLOR_OFFLINE = "#6b7280"
const ROOF_COLOR = "#f1f3f5"
const ROOF_SHADOW = "rgba(0,0,0,0.06)"

const RED_CROSS = `<g fill="${0}">
  <rect x="5" y="11" width="6" height="18" rx="1.2" />
  <rect x="2" y="14" width="12" height="12" rx="1.2" />
</g>`

const LIGHT_BAR = `<rect x="-1" y="-1" width="18" height="5" rx="1.5" fill="#ff6b35"/>
<rect x="1" y="0" width="4" height="3" rx="0.8" fill="#fff" fill-opacity="0.4"/>
<rect x="7" y="0" width="4" height="3" rx="0.8" fill="#fff" fill-opacity="0.4"/>
<rect x="13" y="0" width="4" height="3" rx="0.8" fill="#fff" fill-opacity="0.4"/>`

export function getVehicleType(name: string): string {
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

const VEHICLE_SVGS: Record<string, string> = {
  ambulance: `<g>
  <rect x="12" y="4" width="16" height="32" rx="3" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <rect x="12" y="4" width="16" height="10" fill="rgba(0,0,0,0.04)"/>
  <path d="M14,6 L18,12 L22,12 L26,6 Z" fill="rgba(0,0,0,0.08)"/>
  <rect x="14" y="14" width="12" height="18" rx="1" fill="rgba(0,0,0,0.02)"/>
  <!-- Red Cross on roof -->
  <g transform="translate(14, 15)" fill="${0}">
    <rect x="2" y="3" width="4" height="10" rx="1"/>
    <rect x="0" y="5" width="8" height="6" rx="1"/>
  </g>
  <!-- Emergency light bar at front -->
  <rect x="14" y="3" width="12" height="3" rx="1" fill="#ff6b35"/>
  <circle cx="16" cy="4.5" r="0.8" fill="#fff" fill-opacity="0.5"/>
  <circle cx="20" cy="4.5" r="0.8" fill="#fff" fill-opacity="0.5"/>
  <circle cx="24" cy="4.5" r="0.8" fill="#fff" fill-opacity="0.5"/>
  <!-- Rear door lines -->
  <line x1="20" y1="28" x2="20" y2="34" stroke="rgba(0,0,0,0.08)" stroke-width="0.5"/>
</g>`,
  rescue: `<g>
  <path d="M10,38 L6,28 L5,14 Q5,6 11,4 L29,4 Q35,6 35,14 L34,28 L30,38 Z" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <path d="M9,14 L9,26 L12,34 L28,34 L31,26 L31,14 Z" fill="rgba(0,0,0,0.03)"/>
  <path d="M11,6 Q9,8 9,13 L9,14 L31,14 L31,13 Q31,8 29,6 Z" fill="rgba(0,0,0,0.08)"/>
  <path d="M12,8 L12,12 L17,12 L17,8 Z" fill="rgba(0,0,0,0.04)"/>
  <path d="M23,8 L23,12 L28,12 L28,8 Z" fill="rgba(0,0,0,0.04)"/>
  <!-- Red Cross on hood -->
  <g transform="translate(10, 19)" fill="${0}">
    <rect x="5" y="0" width="4" height="10" rx="1"/>
    <rect x="3" y="2" width="8" height="6" rx="1"/>
  </g>
  <!-- Light bar on roof -->
  <rect x="13" y="3.5" width="14" height="3" rx="1" fill="#2563eb"/>
  <rect x="13" y="3.5" width="7" height="3" rx="1" fill="#dc2626"/>
  <rect x="15" y="4" width="3" height="2" rx="0.5" fill="#fff" fill-opacity="0.4"/>
  <rect x="22" y="4" width="3" height="2" rx="0.5" fill="#fff" fill-opacity="0.4"/>
  <!-- Bull bar front -->
  <rect x="14" y="2" width="12" height="1" fill="rgba(0,0,0,0.1)"/>
  <!-- Roof rack side bars -->
  <rect x="10" y="6" width="2" height="12" rx="0.5" fill="rgba(0,0,0,0.06)"/>
  <rect x="28" y="6" width="2" height="12" rx="0.5" fill="rgba(0,0,0,0.06)"/>
  <!-- Wheels -->
  <rect x="8" y="10" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="29" y="10" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="8" y="28" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="29" y="28" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
</g>`,
  tanker: `<g>
  <rect x="8" y="4" width="12" height="22" rx="2" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <path d="M10,6 L10,12 L18,12 L18,6 Z" fill="rgba(0,0,0,0.05)"/>
  <path d="M10,13 L10,22 L18,22 L18,13 Z" fill="rgba(0,0,0,0.02)"/>
  <!-- Cylindrical tank -->
  <rect x="20" y="2" width="14" height="26" rx="7" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <rect x="22" y="6" width="10" height="18" rx="5" fill="rgba(0,0,0,0.03)"/>
  <!-- Tank bands -->
  <rect x="20" y="4" width="14" height="1.5" fill="rgba(0,0,0,0.04)"/>
  <rect x="20" y="24.5" width="14" height="1.5" fill="rgba(0,0,0,0.04)"/>
  <!-- Red Cross on tank -->
  <g transform="translate(22, 9)" fill="${0}">
    <rect x="2" y="2" width="3" height="8" rx="0.8"/>
    <rect x="0.5" y="3.5" width="6" height="5" rx="0.8"/>
  </g>
  <!-- Manhole on top -->
  <circle cx="27" cy="15" r="2.5" fill="rgba(0,0,0,0.05)"/>
  <circle cx="27" cy="15" r="1.5" fill="rgba(0,0,0,0.08)"/>
  <!-- Wheels -->
  <rect x="9" y="20" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="16" y="20" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="22" y="22" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="29" y="22" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <!-- Hose on top -->
  <path d="M24,20 Q26,22 30,20" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>
</g>`,
  command: `<g>
  <rect x="10" y="4" width="20" height="32" rx="3" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <rect x="12" y="6" width="16" height="12" rx="1" fill="rgba(0,0,0,0.03)"/>
  <path d="M12,6 L16,12 L24,12 L28,6 Z" fill="rgba(0,0,0,0.05)"/>
  <rect x="12" y="18" width="16" height="14" rx="1" fill="rgba(0,0,0,0.02)"/>
  <!-- Red Cross large on roof -->
  <g transform="translate(13, 20)" fill="${0}">
    <rect x="3" y="1" width="4" height="12" rx="1.2"/>
    <rect x="1" y="3" width="8" height="8" rx="1.2"/>
  </g>
  <!-- Antennas -->
  <line x1="15" y1="4" x2="14" y2="0" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
  <line x1="25" y1="4" x2="26" y2="0" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
  <circle cx="14" cy="0" r="1" fill="${0}" fill-opacity="0.6"/>
  <circle cx="26" cy="0" r="1.2" fill="${0}" fill-opacity="0.6"/>
  <!-- Satellite dish on roof -->
  <ellipse cx="20" cy="6" rx="3" ry="2" fill="rgba(0,0,0,0.04)"/>
  <path d="M20,4 L20,2" stroke="rgba(0,0,0,0.15)" stroke-width="0.8"/>
  <!-- Equipment boxes on roof -->
  <rect x="16" y="10" width="2" height="3" rx="0.3" fill="rgba(0,0,0,0.06)"/>
  <rect x="22" y="10" width="2" height="3" rx="0.3" fill="rgba(0,0,0,0.06)"/>
  <!-- Wheels -->
  <rect x="10" y="10" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="27" y="10" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="10" y="28" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="27" y="28" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
</g>`,
  car: `<g>
  <path d="M14,36 L8,28 L7,18 Q7,8 12,6 L28,6 Q33,8 33,18 L32,28 L26,36 Z" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <path d="M10,18 L10,26 L14,32 L26,32 L30,26 L30,18 Z" fill="rgba(0,0,0,0.03)"/>
  <path d="M12,8 Q10,10 10,16 L10,18 L30,18 L30,16 Q30,10 28,8 Z" fill="rgba(0,0,0,0.08)"/>
  <path d="M11,10 L11,14 L15,14 L15,10 Z" fill="rgba(0,0,0,0.04)"/>
  <path d="M25,10 L25,14 L29,14 L29,10 Z" fill="rgba(0,0,0,0.04)"/>
  <!-- Small Red Cross on roof -->
  <g transform="translate(16, 18)" fill="${0}" fill-opacity="0.5">
    <rect x="2" y="1" width="2" height="6" rx="0.5"/>
    <rect x="1" y="2" width="4" height="4" rx="0.5"/>
  </g>
  <rect x="10" y="10" width="4" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="26" y="10" width="4" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="10" y="28" width="4" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="26" y="28" width="4" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
</g>`,
  suv: `<g>
  <path d="M12,38 L6,28 L5,16 Q5,6 11,4 L29,4 Q35,6 35,16 L34,28 L28,38 Z" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <path d="M8,16 L8,26 L13,34 L27,34 L32,26 L32,16 Z" fill="rgba(0,0,0,0.03)"/>
  <path d="M10,6 Q8,8 8,14 L8,16 L32,16 L32,14 Q32,8 30,6 Z" fill="rgba(0,0,0,0.08)"/>
  <rect x="12" y="22" width="16" height="3" rx="1" fill="rgba(255,255,255,0.08)"/>
  <!-- Red Cross on SUV -->
  <g transform="translate(15, 10)" fill="${0}" fill-opacity="0.6">
    <rect x="2" y="1" width="3" height="8" rx="0.8"/>
    <rect x="0.5" y="2.5" width="6" height="5" rx="0.8"/>
  </g>
  <rect x="9" y="10" width="3.5" height="1.5" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="27.5" y="10" width="3.5" height="1.5" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="9" y="28" width="3.5" height="1.5" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="27.5" y="28" width="3.5" height="1.5" rx="0.5" fill="rgba(0,0,0,0.25)"/>
</g>`,
  van: `<g>
  <path d="M13,38 L7,28 L6,10 Q6,6 10,4 L30,4 Q34,6 34,10 L33,28 L27,38 Z" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <path d="M8,10 L8,26 L14,34 L26,34 L32,26 L32,10 Z" fill="rgba(0,0,0,0.03)"/>
  <rect x="9" y="6" width="22" height="4" rx="1.5" fill="rgba(0,0,0,0.06)"/>
  <!-- Red Cross on van -->
  <g transform="translate(15, 16)" fill="${0}" fill-opacity="0.5">
    <rect x="2" y="1" width="3" height="8" rx="0.8"/>
    <rect x="0.5" y="2.5" width="6" height="5" rx="0.8"/>
  </g>
  <rect x="11" y="18" width="18" height="5" rx="1" fill="rgba(255,255,255,0.08)"/>
  <rect x="9" y="28" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="28" y="28" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="9" y="10" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="28" y="10" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
</g>`,
  truck: `<g>
  <rect x="8" y="4" width="12" height="24" rx="2" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <path d="M10,6 L10,13 L18,13 L18,6 Z" fill="rgba(0,0,0,0.05)"/>
  <rect x="20" y="3" width="14" height="26" rx="1.5" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <rect x="22" y="6" width="10" height="20" rx="1" fill="rgba(0,0,0,0.02)"/>
  <!-- Red Cross on cargo box -->
  <g transform="translate(23, 10)" fill="${0}">
    <rect x="2" y="2" width="3" height="8" rx="0.8"/>
    <rect x="0.5" y="3.5" width="6" height="5" rx="0.8"/>
  </g>
  <!-- Cargo lines -->
  <line x1="22" y1="18" x2="32" y2="18" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
  <line x1="22" y1="22" x2="32" y2="22" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
  <!-- Wheels -->
  <rect x="8" y="20" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="17" y="20" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="22" y="22" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="31" y="22" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
</g>`,
  pickup: `<g>
  <path d="M14,36 L8,28 L6,6 Q6,4 12,2 L22,2 L22,16 L34,16 L34,28 L26,36 Z" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <path d="M8,6 L8,14 L20,14 L20,4 Q14,4 12,4 Z" fill="rgba(0,0,0,0.06)"/>
  <path d="M9,8 L9,12 L19,12 L19,8 Z" fill="rgba(0,0,0,0.03)"/>
  <!-- Bed area -->
  <rect x="23" y="6" width="9" height="22" rx="0.5" fill="rgba(0,0,0,0.02)"/>
  <line x1="23" y1="12" x2="32" y2="12" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
  <line x1="23" y1="18" x2="32" y2="18" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
  <!-- Red Cross on pickup bed -->
  <g transform="translate(25, 7)" fill="${0}" fill-opacity="0.5">
    <rect x="1" y="1" width="2" height="6" rx="0.5"/>
    <rect x="0" y="2" width="4" height="4" rx="0.5"/>
  </g>
  <rect x="8" y="22" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="29" y="22" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="8" y="10" width="3" height="2" rx="0.5" fill="rgba(0,0,0,0.25)"/>
</g>`,
  motor: `<g>
  <rect x="19" y="2" width="2" height="36" rx="1" fill="${ROOF_COLOR}"/>
  <circle cx="20" cy="6" r="4.5" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <circle cx="20" cy="34" r="4.5" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <circle cx="20" cy="6" r="2.5" fill="rgba(0,0,0,0.1)"/>
  <circle cx="20" cy="34" r="2.5" fill="rgba(0,0,0,0.1)"/>
  <path d="M16,8 L14,18 L18,18 Z" fill="rgba(0,0,0,0.04)"/>
  <path d="M24,8 L26,18 L22,18 Z" fill="rgba(0,0,0,0.04)"/>
  <rect x="11" y="18" width="18" height="4" rx="2" fill="${ROOF_COLOR}" stroke="${ROOF_SHADOW}" stroke-width="0.5"/>
  <rect x="11" y="18" width="18" height="2" rx="1" fill="rgba(0,0,0,0.03)"/>
  <!-- Red Cross on top box -->
  <g transform="translate(12, 19)" fill="${0}" fill-opacity="0.5">
    <rect x="1" y="0" width="2" height="4" rx="0.5"/>
    <rect x="0" y="1" width="4" height="2" rx="0.5"/>
  </g>
  <rect x="12" y="19" width="2" height="2" fill="rgba(0,0,0,0.1)"/>
  <rect x="26" y="19" width="2" height="2" fill="rgba(0,0,0,0.1)"/>
</g>`,
}

export function getVehicleSvg(type: string, color: string, online: boolean): string {
  const template = VEHICLE_SVGS[type] ?? VEHICLE_SVGS.car
  const accent = online ? color : COLOR_OFFLINE
  const shadowColor = online ? color : "rgba(107,114,128,0.3)"
  let svg = template.replace(/\$\{0\}/g, accent)

  if (online) {
    svg = `<g>
  <ellipse cx="20" cy="21" rx="20" ry="22" fill="${shadowColor}" fill-opacity="0.2" filter="url(#glow)"/>
  <ellipse cx="19" cy="22" rx="14" ry="18" fill="rgba(0,0,0,0.06)"/>
  ${svg}
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
</g>`
  } else {
    svg = `<g opacity="0.35">
  <ellipse cx="20" cy="21" rx="20" ry="22" fill="${shadowColor}" fill-opacity="0.15"/>
  <ellipse cx="19" cy="22" rx="14" ry="18" fill="rgba(0,0,0,0.04)"/>
  ${svg}
</g>`
  }

  return svg
}

export function createMarkerHtml(
  vehicle: {
    id: string
    name: string
    color?: string | null
    online?: boolean
    latestLocation?: { heading?: number | null; lat: number; lng: number } | null
  },
  isSelected: boolean
): string {
  const loc = vehicle.latestLocation
  if (!loc) return ""

  const heading = loc.heading ?? 0
  const color = vehicle.color ?? "#dc2626"
  const type = getVehicleType(vehicle.name)
  const svg = getVehicleSvg(type, color, vehicle.online ?? false)
  const size = isSelected ? 52 : 42

  return `<div style="
    width:${size}px;height:${size}px;
    cursor:pointer;position:relative;
    will-change:transform;
    transition:width 0.2s,height 0.2s;
  ">
    <svg viewBox="0 0 40 40" width="100%" height="100%"
      style="display:block;will-change:transform;transform:rotate(${heading}deg);filter:drop-shadow(0 3px 8px rgba(0,0,0,0.35));">
      ${svg}
    </svg>
    ${vehicle.online ? `<div style="
      position:absolute;top:-3px;right:-3px;
      width:10px;height:10px;border-radius:50%;
      background:#22c55e;
      box-shadow:0 0 8px rgba(34,197,94,0.7);
    "></div>` : ""}
  </div>`
}
