# Open Realtime Tracker — Manual

Real-time vehicle tracking system. Dashboard (Next.js) + Mobile (Expo).

## Architecture

```
Mobile (Expo)
  └─ Background GPS → POST /api/locations

Vercel (Next.js)
  ├─ Route Handlers    → REST API
  ├─ Prisma            → Vercel Postgres (PostGIS)
  ├─ Vercel KV         → Rate limiting + cache
  ├─ Supabase (opt.)   → Real-time broadcast
  └─ React Query       → Server state + polling fallback

Web Dashboard
  ├─ MapLibre GL       → Map rendering (60fps lerp)
  ├─ Zustand           → UI state
  └─ TanStack Query    → Data fetching
```

## Deploy ke Vercel (Single Deployment)

### 1. Buat Project

```
Vercel Dashboard → Add New → Import Git Repository
```

Pilih repo `pmits-open-realtime-tracker`. Framework otomatis terdeteksi sebagai Next.js.

### 2. Setup Storage

**Vercel Postgres (Database):**

```
Dashboard → Storage → Create Database → "Postgres"
```

Setelah jadi, klik **Connect** → pilih project → env vars otomatis terisi.

**Vercel KV (Redis untuk rate limiting):**

```
Dashboard → Storage → Create KV → Connect ke project yang sama
```

### 3. Set Environment Variables

Di Vercel Dashboard → Project → Settings → Environment Variables, tambahkan:

| Variable | Value | Keterangan |
|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` | Required, generate sendiri |
| `NEXTAUTH_URL` | `https://project-xi.vercel.app` | URL Vercel project |

`DATABASE_URL` dan `KV_URL` sudah otomatis terisi oleh Vercel Storage.

### 4. Deploy

Push ke `main` → Vercel otomatis build & deploy.

Setelah deploy pertama sukses, jalankan migration:

```bash
# Via Vercel CLI
npx vercel env pull .env.production
pnpm db:migrate:deploy

# Atau via terminal Vercel (Dashboard → Project → Terminal)
pnpm db:migrate:deploy
```

### 5. Verify

Buka URL Vercel → Register → Dashboard siap.

---

## Local Development

### Prasyarat

- Node.js 22+
- pnpm 10+
- Docker (untuk PostgreSQL + Redis lokal)

### Setup

```bash
# Clone & install
git clone https://github.com/pmitangselwebdev/pmits-open-realtime-tracker.git
cd pmits-open-realtime-tracker
pnpm install

# Start database
pnpm docker:up

# Copy env & sesuaikan
cp apps/web/.env.example apps/web/.env

# Generate Prisma client
pnpm db:generate

# Run migration
pnpm db:migrate:deploy

# Seed data
pnpm db:seed

# Start development
pnpm dev
```

Buka `http://localhost:3000`.

### Database Management

```bash
pnpm db:studio        # Prisma Studio (GUI database)
pnpm db:push         # Push schema tanpa migration
pnpm db:migrate      # Create + apply migration
pnpm db:seed         # Seed data
```

---

## Mobile Client (Expo)

### Setup

```bash
cd apps/mobile
pnpm install

# Copy env
cp .env.example .env

# Edit .env — sesuaikan API_URL ke Vercel deployment
# EXPO_PUBLIC_API_URL=https://project-xi.vercel.app
```

### Run

```bash
pnpm ios    # iOS Simulator
pnpm android  # Android Emulator
pnpm start   # Expo dev
```

### Konfigurasi Tracking

Di `apps/mobile/src/tracking/location-task.ts`:

```ts
const config = {
  interval: 5000,       // ms antar kirim
  batterySaver: true,   // throttle saat baterai < 20%
}
```

Setiap 5 detik, GPS dikirim ke `POST /api/locations` dengan format:

```json
{
  "uniqueId": "TRK-001",
  "lat": -6.2,
  "lng": 106.8,
  "speed": 50,
  "heading": 180,
  "accuracy": 10,
  "battery": 85
}
```

---

## Environment Variables

### Required

| Variable | Source | Contoh |
|---|---|---|
| `DATABASE_URL` | Vercel Postgres | `postgresql://user:pass@host:5432/db` |
| `KV_URL` | Vercel KV | `redis://default:pass@host:6379` |
| `AUTH_SECRET` | Generate sendiri | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Vercel URL | `https://project.vercel.app` |

### Optional

| Variable | Fungsi | Default |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Real-time broadcast | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real-time auth | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Server broadcast | — |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | — |
| `SENTRY_ORG` | Sentry org | — |
| `SENTRY_PROJECT` | Sentry project | — |
| `CORS_ORIGINS` | Allowed origins | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

Tanpa Supabase, dashboard fallback ke polling 10 detik.

---

## API Endpoints

### Locations

| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/locations` | uniqueId / Session | Kirim GPS |
| GET | `/api/locations` | JWT | Ambil lokasi |

**POST /api/locations — Device Mode:**

```json
{
  "uniqueId": "TRK-001",
  "lat": -6.2,
  "lng": 106.8,
  "speed": 50,
  "heading": 180,
  "accuracy": 10,
  "battery": 85
}
```

**POST /api/locations — Web Mode:**

```json
{
  "vehicleId": "abc123",
  "lat": -6.2,
  "lng": 106.8,
  "speed": 50,
  "heading": 180,
  "accuracy": 10,
  "battery": 85
}
```

**GET /api/locations — Query Parameters:**

| Parameter | Type | Default | Max |
|---|---|---|---|
| `vehicleId` | string | — | — |
| `limit` | number | 100 | 1,000 |
| `before` | ISO date | — | — |
| `after` | ISO date | — | 7 days max |
| `cursor` | string (ID) | — | — |
| `replay` | `true` | — | 5,000 pts |

**Response:**
```json
{
  "locations": [
    {
      "id": "loc_abc",
      "vehicleId": "vhc_123",
      "lat": -6.2,
      "lng": 106.8,
      "speed": 50,
      "heading": 180,
      "accuracy": 10,
      "battery": null,
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ],
  "hasMore": false
}
```

### Vehicles

| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/vehicles` | JWT | Daftar kendaraan |
| GET | `/api/vehicles/[id]` | JWT | Detail kendaraan |

---

## Dashboard Fitur

### Map
- Live tracking dengan 60fps interpolasi (easeOutCubic)
- Marker otomatis update via Supabase Realtime atau polling
- Differential DOM update (tidak rebuild ulang semua marker)

### Route Replay
- Pilih kendaraan + rentang tanggal
- Play / Pause / Speed (1x, 2x, 5x, 10x)
- Seek bar untuk lompat waktu
- Animasi marker dengan easeInOutQuad per segmen
- Max 7 hari, 5,000 titik per replay

### Vehicle Detail
- Posisi terkini di map
- Statistik: speed, heading, accuracy, battery
- History lokasi

### Settings
- Notifikasi (push)
- Preferred map style
- Theme (dark/light)

---

## Rate Limiting

- **1 request per 3 detik per device** pada `POST /api/locations`
- Menggunakan Vercel KV di production, in-memory fallback di development
- Response `429 Too Many Requests` dengan header `Retry-After`

## Keamanan

- JWT via NextAuth.js untuk semua API (kecuali auth)
- Device mode (`uniqueId`) tidak perlu session
- Zod validation di semua input
- CORS whitelist via `CORS_ORIGINS`

## Troubleshooting

**Build gagal di Vercel:**
```
Error: PrismaClientInitializationError
```
→ Jalankan `pnpm db:migrate:deploy` setelah build.

**Map tidak muncul:**
```
Error: Map is not defined
```
→ Pastikan map component di-load dengan `dynamic(() => import(...), { ssr: false })`.

**Real-time tidak jalan:**
→ Cek `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Tanpa ini, dashboard polling tiap 10 detik.
