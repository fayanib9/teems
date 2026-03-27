# TEEMS — Toada Events & Exhibitions Management System

## Project Overview
Back-office operational system for Toada (شركة تؤدة لهندسة المشاريع) managing the full lifecycle of events and exhibitions. Not attendee-facing — this is internal team software.

## Stack
- **Next.js 16** (App Router, Server + Client Components)
- **PostgreSQL** via Drizzle ORM (pg-core)
- **Tailwind CSS v4** with custom theme
- **Lucide React** icons
- **Zod** validation
- **JWT + bcrypt** cookie-based auth
- Brand color: Toada Purple `#312C6A`

## Key Patterns

### Server → Client Component Pattern
- `page.tsx` files are Server Components that fetch data
- `*-client.tsx` files are Client Components that handle interactivity
- **Never pass functions or class instances** from Server to Client Components — use plain objects/strings
- For icons, pass `iconName: string` and resolve via `ICON_MAP` in the client component

### Auth
- Session via JWT in `teems_token` cookie (7-day expiry)
- Permission model: `module:action` (e.g., `events:create`, `tasks:edit`)
- `super_admin` role bypasses all permission checks
- Use `getSession()` and `hasPermission(session, module, action)` from `@/lib/auth`

### Database
- snake_case column names
- Monetary values stored as integers (halalas), displayed as SAR
- Soft delete via `is_active: false` or `is_archived: true`
- Next.js 16 route params: `params: Promise<{ id: string }>` — must `await`

### API Routes
- All routes validate session
- `POST`/`PATCH` accept JSON body
- `DELETE` soft-deletes (sets `is_active: false`)
- Return `NextResponse.json()` with appropriate status codes

## Database
PostgreSQL on Docker (local: `postgresql://teems:teems@localhost:5432/teems`)
Schema: `src/db/schema.ts` (~35 tables)
Push schema: `npm run db:push`
Seed: `npm run db:seed`

## Running Locally
```bash
npm run dev          # starts on port 3003 (turbopack)
npm run db:push      # push schema changes
npm run db:seed      # seed default roles + demo data
```

## Deployment
- Target: `teems.momentumworld.me` via Coolify on Hetzner VPS
- `docker-compose up --build` for full stack
- Standalone Next.js output enabled in `next.config.ts`
- Uploads stored in `data/uploads/` (Docker volume)

## Login
- Default admin: `admin@toada.com` / `admin123`
