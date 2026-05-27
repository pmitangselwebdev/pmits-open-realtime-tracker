# Skills — Open Realtime Tracker

## Project Setup Guide

### Prerequisites
- Node.js 22+
- pnpm
- Docker (PostgreSQL + Redis)
- Expo CLI (for mobile)

### Quick Start
```bash
# Install dependencies
pnpm install

# Start database
docker compose up -d

# Run migrations
pnpm -F web prisma:migrate

# Start dev servers
pnpm dev
```

### Environment Variables
```env
# apps/web/.env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracker"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
WS_URL="ws://localhost:3000/ws"
```

## How to Add a New Feature

### 1. Web Dashboard Feature
1. Create page in `apps/web/src/app/dashboard/<feature>/page.tsx`
2. Create components in `apps/web/src/components/dashboard/`
3. Add API route in `apps/web/src/app/api/<feature>/route.ts`
4. Add types in `packages/shared/src/types.ts`
5. Add validation in `packages/shared/src/validation.ts`
6. Add query/mutation in hooks
7. Register sidebar link in `sidebar.tsx`

### 2. New API Endpoint
1. Create route file in `apps/web/src/app/api/<name>`
2. Add Zod validation schema
3. Add Prisma query
4. Add rate limiting if POST/PUT/DELETE
5. Return typed response

### 3. New Real-time Event
1. Define event type in `packages/shared/src/types.ts`
2. Add handler in WebSocket server
3. Add client handler in `use-websocket.ts`
4. Update Zustand store if needed

## Code Review Checklist

### Common Issues
- [ ] TypeScript strict — any usage?
- [ ] Tailwind responsive — mobile view broken?
- [ ] Loading/error/empty states handled?
- [ ] Animations smooth on low-end devices?
- [ ] WebSocket reconnect logic?
- [ ] Offline support (mobile)?
- [ ] API validation (Zod)?
- [ ] Rate limiting on write endpoints?
- [ ] No secrets/keys exposed client-side?
- [ ] Proper error boundaries?

### Performance
- [ ] Map component lazy loaded?
- [ ] Unnecessary re-renders? (check React DevTools)
- [ ] Large lists virtualized?
- [ ] Images optimized?
- [ ] Redis cache hit?

## Debugging Checklist

### WebSocket Issues
1. Check WS connection: `ws://localhost:3000/ws?token=xxx`
2. Check JWT token validity
3. Check Redis is running
4. Check browser console for errors
5. Check server logs

### GPS Tracking Issues (Mobile)
1. Check background location permission
2. Check battery optimization disabled for app
3. Check foreground service notification visible
4. Check network connectivity
5. Check rate limiter not blocking

### Performance Issues
1. Check number of WebSocket messages per second
2. Check React re-renders (React DevTools profiler)
3. Check PostgreSQL query performance (EXPLAIN ANALYZE)
4. Check Redis memory usage

## Testing Strategy
- Unit tests: Vitest for utils, hooks, validation
- Component tests: React Testing Library
- E2E: Playwright (web), Detox (mobile)
- API tests: Supertest
- Manual: Test on real device for GPS

## Deployment Notes
- Web: Vercel (serverless) or Docker (self-hosted)
- Mobile: EAS Build → app stores or sideload
- Database: Neon (serverless PG), Supabase, or self-hosted
- Redis: Upstash (serverless) or self-hosted
- WS: Vercel supports WebSocket via Edge Runtime

## Dev Workflow (CRITICAL)
- **Dev server**: `pnpm dev` or `pnpm -F web dev` (HMR, hot reload otomatis)
- **Type checking**: Gunakan `pnpm check` atau `pnpm -F web typecheck` — **JANGAN** `pnpm build` saat development
- `pnpm build` cuma untuk production — nge-overwrite output dan bikin dev server 404
- Setelah selesai nulis kode, selalu jalankan `pnpm check` untuk validasi types

## Project Conventions (IMPORTANT)
- **NEVER** use any UI library besides shadcn/ui (no MUI, Chakra, Antd)
- **NEVER** add a dependency without checking if it's needed
- **ALWAYS** read context.md before making changes
- **ALWAYS** check existing patterns before creating new files
- **ALWAYS** handle loading, empty, error, success states
- **ALWAYS** use TypeScript strict — no `any`
- **KEEP** animations smooth but not excessive
- **TEST** on mobile viewport for all UI changes
