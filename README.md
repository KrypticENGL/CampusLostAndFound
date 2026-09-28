# Campus Lost & Found

Report, search and reunite lost items on campus, with deterministic lost ↔ found matching.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Lucide · Prisma 6 · Supabase Postgres · Zod

## Run

```bash
npm install            # also runs `prisma generate`
cp .env.example .env   # fill in your Supabase DATABASE_URL and DIRECT_URL
npm run db:setup       # apply migrations + seed 16 demo listings
npm run dev            # http://localhost:3000  (use `npm run dev -- -p 3100` if 3000 is busy)
```

`npm run db:seed` resets the demo data.

## Test accounts

`npm run db:seed` creates a test admin and a test student. Their emails and passwords are in `TEST_USERS` in `prisma/seed.ts`. The student owns the "Black Wallet" listing. **Change or delete these accounts before a public deployment.**

## API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/items?search=&status=ALL\|LOST\|FOUND&category=&sort=newest\|oldest\|date&includeResolved=` | Filtered list with per-item match counts (no contact details) |
| POST | `/api/items` | Zod-validated create → `201 { item, matchCount }`, `422 { error, details }` |
| GET | `/api/items/:id` | `400` bad id, `404` missing |
| PATCH | `/api/items/:id` | `{ status: "OPEN" \| "RESOLVED" }` to mark an item as reunited |
| GET | `/api/items/:id/matches` | Ranked opposite-type matches with reasons |
| GET | `/api/stats` | Dashboard counters and category breakdown |
| POST | `/api/auth/register` | Public sign-up (always STUDENT), signs in → 201, 409 duplicate email |
| POST | `/api/auth/login` · `/api/auth/logout` | Session cookie login/logout (401 bad credentials, 403 deactivated) |
| GET | `/api/auth/me` | Current user or null |
| GET/POST | `/api/users` | Admin only: list / create users with a role |
| PATCH | `/api/users/:id` | Admin only: `{ role?, active? }`, can't demote or deactivate self |

Creating an item requires login (401). Changing an item's status requires the reporter or an admin (403).

## Matching (`lib/matching.ts`)

A pure function scores a LOST/FOUND pair from 0 to 100. Listings of the same type always score 0.

| Signal | Points |
| --- | --- |
| Same category | 25 |
| Name token overlap (with synonyms such as earphones ≈ earbuds) | 30 |
| Same or nearby location | 15 |
| Date proximity (0 if "found" is well before "lost") | 15 |
| Description keyword overlap | 15 |

Pairs scoring 40 or more are shown, each with ✓/✗ reasons. Resolved items are left out of matching.
