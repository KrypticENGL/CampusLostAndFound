# Project Context — Campus Lost & Found

Context for AI agents picking up this codebase. Read this before making changes.

## What it is

A competition/hackathon MVP where students report lost or found items, browse, search and filter listings, open a detail view, contact the other person (mailto:/tel: only, no messaging), and see **deterministic potential matches** between lost and found items.

Judging priorities: working functionality > UI polish > reliability > creative features > extras. Keep changes small and reliable. Don't add auth, chat, notifications, image upload, AI APIs, Docker or extra services unless asked.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + React 19
  - ⚠️ Next 16 has breaking changes versus older training data. `params` and `searchParams` are **Promises** (`await ctx.params`). Use the global `RouteContext<'/path/[id]'>` and `PageProps<'/path'>` / `LayoutProps` helpers. Docs are in `node_modules/next/dist/docs/`. See `AGENTS.md`.
- **Tailwind v4** (CSS-first config in `app/globals.css`, no tailwind.config)
- **shadcn/ui** (style `radix-nova`, imports from the `radix-ui` package). Only button, input, label, select, sheet, sonner and textarea are installed.
  - ⚠️ The shadcn CLI generated `import { cn } from "cn"`, which is broken. After `npx shadcn add ...`, run: `sed -i 's#from "cn"#from "@/lib/utils"#' components/ui/*.tsx`
- **Prisma 6** (deliberately pinned, not 7) + **Supabase Postgres** (project ref `urlyfytckhewupwprqhs`). The app was originally built on SQLite and migrated.
  - `.env` (gitignored) holds `DATABASE_URL` (runtime) and `DIRECT_URL` (migrations). Both currently use the direct host `db.urlyfytckhewupwprqhs.supabase.co:5432`, which is **IPv6-only**. For serverless/IPv4 hosting, set `DATABASE_URL` to the Transaction pooler (port 6543, `&pgbouncer=true`).
  - Search uses `mode: "insensitive"` because Postgres `contains` is case-sensitive.
  - Supabase's data API and service role key are **not used**. All access goes through Prisma, server-side. Never put secrets in client code or commit them.
- **Zod 4** (uses `{ error: "..." }` params, `z.email()`, and refine `when:`)
- **next-themes** (dark mode), **sonner** (toasts), **lucide-react**, **server-only**
- No chart library: the chart is plain CSS bars.

## Commands

```bash
npm install              # postinstall runs prisma generate
npm run db:setup         # prisma migrate deploy && seed (applies prisma/migrations to Supabase)
npm run db:migrate       # prisma migrate dev — for new schema changes
npm run db:seed          # wipe + reseed 16 demo items (tsx prisma/seed.ts)
npm run dev -- -p 3100   # port 3000 is taken by another app on the dev machine
npm run typecheck        # tsc --noEmit
npm run lint             # eslint (includes the strict react-hooks rules)
npm run build
```

Last verified state: typecheck, lint and build are clean, and the API was smoke-tested with curl. After the dashboard redesign, the home page (filters, theme toggle, phone width), login, logout and /admin/users were checked in Chrome. The report form, register and item detail pages have not been re-checked visually since the redesign.

## Architecture

```
app/
  page.tsx                  Dashboard (server, force-dynamic): OpenListingsCard, CategoryChart, RecoveryCard, <ListingExplorer/> in Suspense
  report/page.tsx           Report form page; reads ?type=&name=&category=&location= to prefill
  items/[id]/page.tsx       Detail (server, force-dynamic): facts, ContactActions, MatchList; notFound() for bad or missing ids
  not-found.tsx, error.tsx  Global states
  api/items/route.ts        GET list (query validated) · POST create → 201 {item, matchCount} | 422 {error, details}
  api/items/[id]/route.ts   GET one (400 bad id / 404) · PATCH {status: OPEN|RESOLVED}
  api/items/[id]/matches/   GET ranked matches
  api/stats/route.ts        GET dashboard stats
components/
  items/listing-explorer    CLIENT. Filter state lives in the URL (search/status/category/sort/includeResolved/highlight),
                            300ms debounced search, fetches /api/items. Loading state is derived from a request key (no setState in effects)
  items/item-card           Card + skeleton; "New" ring when ?highlight=<id>; shows matchCount badge (used below lg)
  items/item-table          Desktop (lg+) listings table with the same highlight / resolved / matchCount states
  items/item-meta           TypeBadge, CategoryIcon, CATEGORY_ICON map
  items/match-list          Score ring + ✓/✗ reason chips
  items/contact-actions     CLIENT. mailto (pre-written subject/body) or tel, copy, "Post it as a found item", Mark as reunited (PATCH + router.refresh)
  items/empty-state         Reusable empty/error block
  forms/report-form         CLIENT. Shared Zod schema for client validation; maps server 422 details to fields; toast + redirect to /?highlight=id
  dashboard/stats-cards     DashCard + Pill shells; OpenListingsCard (found/lost/resolved split) and RecoveryCard (recovery-rate meter)
  dashboard/category-chart  "Potential matches" card: lost vs found bars per category (link to category filter)
  layout/site-header        CLIENT. Hero banner: greeting, live stat chips (/api/stats), tab nav, search, theme toggle,
                            auth (initials avatar, admin Users link, logout / Log in), mobile Sheet menu
  layout/fluted-glass       CLIENT. WebGL fluted-glass banner backdrop; pauses off-screen, still frame for reduced motion,
                            falls back to the CSS .hero-bg when WebGL is unavailable
lib/
  items.ts      SERVER-ONLY data layer. All Prisma access goes through here: listItems, getItem, getMatches, createItem,
                updateItemStatus, getStats. DTOs: ItemSummary (no contact info), ItemDetail, MatchDTO, Stats
  matching.ts   Pure deterministic scorer (no DB): scoreMatch, findMatches, tokenize
  validation.ts Zod: createItemSchema, listQuerySchema, updateStatusSchema, fieldErrors(), normalizePhone()
  constants.ts  CATEGORIES, CATEGORY_LABEL, LOCATION_SUGGESTIONS, MATCH_THRESHOLD = 40
  dates.ts      parseDateOnly ("YYYY-MM-DD" → 12:00 UTC), formatDate (UTC), formatRelative, daysBetween
  api.ts        jsonError, serverError (logs, returns generic 500), isValidId (cuid regex)
  db.ts         PrismaClient singleton
prisma/schema.prisma, seed.ts, migrations/
```

Client components import only **types** from `lib/items.ts`, never values (it's `server-only`).

## Users & auth

- Custom auth. No NextAuth and no Supabase Auth. `lib/password.ts` hashes with scrypt from `node:crypto` (`scrypt$salt$hash`). `lib/auth.ts` handles sessions: a random 32-byte token goes in the httpOnly `clf_session` cookie (30 days) and only its SHA-256 is stored in `Session`.
- `getCurrentUser()` is React-`cache`d per request and returns null for expired sessions or deactivated users. The root layout calls it, so every page is dynamic.
- `lib/users.ts`: createUser (throws EmailTakenError on P2002), authenticate (same generic error for unknown email and wrong password), listUsers, updateUser (deactivating deletes that user's sessions).
- `lib/api.ts`: `requireUser()` and `requireAdmin()` return a user or a 401/403 Response.
- Roles: STUDENT and ADMIN. Browsing is public. `/report` and `POST /api/items` need login, and the item is linked via `Item.userId`. The report form is prefilled with the user's name and email. Mark reunited/reopen is allowed for the reporter or an admin (`canManageItem`).
- `/admin/users` is admin-only (anonymous → redirect to login, student → 404): user table with search, role select, deactivate/reactivate, and a create-user form. Admins can't demote or deactivate themselves.
- `/login` and `/register` share `components/forms/auth-page.tsx`, and `?next=` is sanitized by `safeNext`. The banner shows the user's initials avatar, a Users link for admins, and logout; the mobile menu shows the user chip.
- Test accounts: `TEST_USERS` in `prisma/seed.ts`, one admin and one student. The student owns the Black Wallet listing.

## Data model

`Item`: id (cuid), itemType `LOST|FOUND`, status `OPEN|RESOLVED` (default OPEN), name, category `ELECTRONICS|DOCUMENTS|ACCESSORIES|BOOKS|BAGS|OTHER`, location (free text), date (DateTime stored at 12:00 UTC), description, contactName?, contactType `EMAIL|PHONE`, contactValue, createdAt, updatedAt. userId? (FK → User, on delete SET NULL). Indexes: [itemType, status], category, date, createdAt, userId.

`User`: id, name, email (unique, lowercased), passwordHash, role `STUDENT|ADMIN`, active, timestamps. `Session`: tokenHash (unique), userId (cascade delete), expiresAt.

## Business rules

- Every field is required except contactName. Name is 2–80 characters, location 2–80, description 10–1000.
- Date must be a real calendar date, not in the future (one day of slack for time zones), and within the last 365 days.
- Contact is a valid email, or a phone with 7–15 digits and an optional leading +. Phones are stored normalized; emails are lowercased.
- The list shows only OPEN items by default (`includeResolved=true` shows all). Search splits into words; **each word** must match name, description, location or a category label (SQLite LIKE, case-insensitive for ASCII).
- Sort: `newest` (createdAt desc, the default, so new submissions appear first), `oldest`, or `date` (incident date desc).
- Stats: total counts all items. Lost and found count OPEN items only. Resolved is counted separately. potentialMatches = number of OPEN lost×found pairs with score ≥ 40.
- Matching compares only opposite types (same type → 0) and only OPEN items.

## Matching algorithm (lib/matching.ts)

The score is 0–100; the weights sum to 100.

| Signal | Points |
| --- | --- |
| Category equal | 25 |
| Name token overlap coefficient | 30 × similarity |
| Location: exact (normalized) / shared token | 15 / 8 |
| Date: ≤1 day / ≤3 / ≤7 / ≤14 | 15 / 11 / 6 / 2 (0 if found is more than 1 day before lost) |
| Description + name keyword overlap | 15 × min(1, 1.5 × overlap) |

Tokenizer: lowercase, strip punctuation, drop stopwords, naive plural stripping, and a small synonym map (purse→wallet, earphone→earbud, flask→bottle, backpack→bag, …). Each reason has `{label, points, met}`. The seed data produces six clear pairs scoring 57–100; noise stays at 31 or less.

## Design system

- Layout reference: the "Papersky" analytics dashboard on Dribbble. Keep new screens consistent with its layout; colours now use the navy/gold palette below.
- Colours follow a university-style **navy blue + golden yellow** palette. Tokens are in `app/globals.css`: `navy` / `navy-soft` and `gold` / `gold-soft`, plus `gold-foreground` (dark navy) for text on gold. Never put white text on gold. `primary` is navy in light mode and gold in dark mode, and `ring` is gold. `lost` is navy-toned and `found` amber/gold-toned, used as `bg-lost-soft text-lost` and so on. `shell` is the page backdrop and `panel` the dashboard surface. The banner (`.hero-bg` fallback and the `fluted-glass` shader palette) is navy with a gold glow. The Amity University crest (`public/brand/logo.svg`, traced from the owner-supplied PNG with potrace as stacked colour layers) is sampled as a WebGL texture inside the shader scene so the flutes refract it. Without WebGL, an `<img>` plus the CSS `.blinds` overlay is shown instead.
- Look: the whole app sits in one rounded panel (`rounded-[28px]`, `max-w-7xl`) under a dark green hero banner (WebGL fluted glass in `layout/fluted-glass`, CSS fallback `.hero-bg`, legibility overlay `.hero-shade`). Content cards are borderless white `rounded-3xl`; buttons, inputs and segmented controls are pills (`rounded-full`). Geist font.
- Accessibility patterns: skip link, radiogroup semantics for segmented controls, `aria-invalid` / `aria-describedby` on form errors, and visible focus rings.

## Known limitations / ideas not done

- No password reset, email verification or rate limiting on login.
- No image upload and no pagination (the list is capped at 200).
- Match counting is O(lost × found) in memory, which is fine for MVP scale.
- Invalid item ids return a real 404. Don't re-add `app/items/[id]/loading.tsx`: streaming makes notFound() return a 200.
