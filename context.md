# Open Realtime Tracker — Context

## Project Description
Open source real-time vehicle tracking system with web dashboard (Next.js) and mobile client (Expo). Mirip Traccar tapi self-built from scratch.

## Core Goals
- Real-time vehicle position tracking via GPS mobile app
- Web dashboard with modern UI/UX, smooth animations, real-time updates
- Self-built — no dependency on third-party tracking solutions (but uses open source libraries)
- Scalable architecture with caching layer

## Tech Stack

### Web Dashboard
| Tech | Version | Purpose |
|---|---|---|
| Next.js | 14+ (App Router) | Fullstack framework |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3.4+ | Styling |
| shadcn/ui | latest | UI components (copy-paste) |
| framer-motion | latest | Page & micro animations |
| lucide-react | latest | Icons |
| MapLibre GL JS | latest | Map rendering |
| Zustand | 4+ | Global state management |
| TanStack React Query | 5+ | Server state & caching |
| ws | latest | WebSocket client |
| Zod | 3+ | Schema validation (shared) |

### Backend (within Next.js)
| Tech | Purpose |
|---|---|
| Next.js Route Handlers | REST API |
| Prisma | ORM |
| PostgreSQL + PostGIS | Database + geospatial |
| Redis | Cache + Pub/Sub |
| NextAuth.js (Auth.js) | Authentication |
| ws | WebSocket server |

### Mobile Client
| Tech | Purpose |
|---|---|
| Expo (SDK 52+) | React Native framework |
| expo-location | GPS tracking |
| expo-task-manager | Background task |
| expo-sqlite | Offline buffer |
| Zustand | State management |
| TanStack React Query | API & offline cache |

## Architecture & Data Flow

```
Mobile (Expo)
  ├─ Background GPS → POST /api/locations (HTTP, reliable)
  └─ WebSocket status heartbeat

Next.js API
  ├─ Zod validation → Prisma → PostgreSQL
  ├─ Update Redis cache
  ├─ Redis Pub/Sub → WS Broadcast
  └─ Rate limiting

Web Dashboard
  ├─ REST query via React Query (initial data)
  └─ WebSocket → Zustand (real-time updates)
      └─ MapLibre markers with lerp interpolation
```

## Folder Structure

```
open-realtime-tracker/
├── apps/
│   ├── web/                  # Next.js dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── register/page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx          # Overview
│   │   │   │   │   ├── map/page.tsx
│   │   │   │   │   ├── vehicles/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── history/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── locations/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── vehicles/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/           # shadcn
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── navbar.tsx
│   │   │   │   │   ├── stat-card.tsx
│   │   │   │   │   ├── vehicle-list.tsx
│   │   │   │   │   ├── vehicle-detail-panel.tsx
│   │   │   │   │   ├── map-view.tsx
│   │   │   │   │   ├── map-marker.tsx
│   │   │   │   │   ├── status-badge.tsx
│   │   │   │   │   └── theme-toggle.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-websocket.ts
│   │   │   │   ├── use-vehicles.ts
│   │   │   │   └── use-locations.ts
│   │   │   ├── lib/
│   │   │   │   ├── ws.ts
│   │   │   │   ├── utils.ts
│   │   │   │   └── api.ts
│   │   │   └── stores/
│   │   │       └── dashboard-store.ts
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.js
│   │   └── package.json
│   └── mobile/               # Expo tracker client
│       ├── src/
│       │   ├── tracking/
│       │   │   ├── location-task.ts
│       │   │   ├── api-client.ts
│       │   │   └── offline-buffer.ts
│       │   ├── screens/
│       │   ├── stores/
│       │   └── hooks/
│       ├── app.json
│       └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types.ts
│       │   └── validation.ts
│       └── package.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker-compose.yml
├── context.md
├── skills.md
├── package.json (root)
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json (root)
```

## Database Schema

```prisma
model User {
  id       String    @id @default(cuid())
  email    String    @unique
  name     String
  password String
  vehicles Vehicle[]
  createdAt DateTime @default(now())
}

model Vehicle {
  id        String     @id @default(cuid())
  name      String
  plate     String
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  locations Location[]
  icon      String?
  color     String?    @default("#3b82f6")
  createdAt DateTime   @default(now())

  @@index([userId])
}

model Location {
  id        String   @id @default(cuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  lat       Float
  lng       Float
  speed     Float?
  heading   Float?
  accuracy  Float?
  battery   Float?
  timestamp DateTime @default(now())

  @@index([vehicleId, timestamp])
  @@index([timestamp])
}
```

## UI/UX Guidelines

### Design Tokens
- Dark mode default: bg slate-950, card slate-800/80 backdrop-blur, accent gradient blue→purple
- Light mode: bg slate-50, card white, accent blue-600
- Success: emerald-400/500
- Danger: red-500
- Warning: amber-500
- Text: slate-100 (dark), slate-900 (light), muted: slate-400/500

### Animations
- Page transitions: Fade 200ms + slide 30px (framer-motion AnimatePresence)
- Sidebar: Collapse/expand 300ms ease-in-out
- Stat cards: Counter animation on mount, hover lift + shadow
- Map markers: requestAnimationFrame lerp interpolation
- Slide-over panel: Slide from right 300ms + backdrop-blur
- Toast: Slide from top, auto-dismiss with progress bar
- Buttons: Scale 0.97 on click
- Badge online: Pulse glow animation
- Skeleton: Wave/shimmer animation

### Layout
- Desktop: Fixed sidebar (collapsible) + top navbar + main content
- Mobile: Bottom tab nav, full-width map
- Sidebar: Icons + text, active state with gradient indicator
- Content: Max-w 7xl centered, padding 6

### States
Every component must handle: loading, empty, error, success states.
- Loading: Skeleton shimmer
- Empty: Illustration + message + CTA
- Error: Alert with retry button
- Success: Data displayed with animations

## Security Rules
- All API routes require JWT auth (except auth endpoints)
- Rate limit: 1 request per 3 seconds per device on POST locations
- Input validation: Zod on all API inputs
- WebSocket: JWT token in query param `?token=`
- No secrets in client-side code
- CORS: Strict origin whitelist in production
- Prisma parameterized queries (SQL injection safe)
- NextAuth.js session for web dashboard

## State Management Patterns
- Zustand stores: UI state (sidebar, theme, selected vehicle, filters)
- React Query: Server data (vehicles, history) with staleTime
- WebSocket: Invalidate/update React Query cache directly
- Mobile Zustand: Tracking state (isTracking, interval, battery saver)

## Coding Conventions
- TypeScript strict mode
- File naming: kebab-case for files, camelCase for functions/vars
- Components: PascalCase, one component per file
- Imports order: React → Next → Libraries → Local components → Utils → Types → Styles
- Export named functions, arrow functions for callbacks
- Props interface defined in component file (or types file if shared)
- No `any` — use proper types or `unknown` + narrowing
- Tailwind classes order: layout → spacing → sizing → typography → colors → borders → effects → animations
- Comments only when necessary — code should be self-documenting

## Performance Guidelines
- Debounce search inputs (300ms)
- Lazy load map component (dynamic import with ssr: false)
- Throttle WebSocket updates (max 10 updates/sec per vehicle)
- Batch PostgreSQL inserts (every 5s, not per request)
- React Query staleTime: vehicles 30s, history 5min
- MapLibre: enable terrain, limit max zoom, cluster markers at low zoom
- Use `useMemo`/`useCallback` only when necessary (profile first)
- Image optimization via Next.js Image component

## Error Handling
- API: Return `{ error: string, code: string }` with appropriate HTTP status
- WebSocket: Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Mobile: Queue failed POSTs to SQLite, retry when online
- Unhandled errors: Global error boundary on web, Sentry/console on mobile
- Network errors: Retry with backoff, show toast notification
