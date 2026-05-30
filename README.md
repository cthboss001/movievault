<div align="center">
  <br/>
  <h1>🎬 MovieVault</h1>
  <p><em>A Lifetime of Movies.</em></p>

  <p>
    <a href="https://movies.tazim.dev"><strong>movies.tazim.dev</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15"/>
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
    <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma"/>
    <img src="https://img.shields.io/badge/Deployed_on-Vercel-000?style=flat-square&logo=vercel" alt="Vercel"/>
  </p>
</div>

---

## What is MovieVault?

MovieVault is a **personal movie archive** — a single, unified place that holds every film I have ever watched, rated, and collected across **IMDb** and **Letterboxd**.

It is not a social network. It is not a review platform. It is a private, curated collection made public — like walking into someone's personal library and seeing every film they have ever experienced, organized and searchable in an instant.

**Live at** → [movies.tazim.dev](https://movies.tazim.dev)

---

## What It Does

| Feature | Description |
|---|---|
| **Unified Archive** | Merges scattered watch history from IMDb and Letterboxd into one canonical database. Duplicate films across platforms are automatically detected and merged. |
| **Instant Search** | Client-side fuzzy search powered by Fuse.js. Results appear as you type — no server round-trips, no loading spinners. Typo-tolerant. |
| **TMDB Poster Enrichment** | After import, a single click fetches high-resolution movie posters, genres, and runtime data from the TMDB API for every film in the archive. |
| **Smart Sorting** | Movies with posters are surfaced first during browsing. Films can be sorted by rating, year, or title, and filtered by source (IMDb / Letterboxd / Both). |
| **Analytics Dashboard** | A dedicated `/stats` page showing total films watched, lifetime runtime, average rating, genre distribution, and year-by-year watch trends. |
| **Public Portfolio** | The entire site is publicly accessible as a read-only portfolio. No login walls, no sign-up forms. Visitors browse freely. |
| **Hidden Admin** | Import and data management tools are locked behind a secret `/login` route protected by Next.js Edge Middleware. No visible login button exists anywhere on the public site. |

---

## The Hard Problems I Solved

Building this was not as simple as calling an API. Both IMDb and Letterboxd actively resist automated data extraction, so I had to engineer creative solutions for every step.

### 1. Letterboxd: Cloudflare Bot Protection

Letterboxd sits behind Cloudflare's bot detection. Server-side scraping gets blocked instantly — no HTML, no data, just a challenge page.

**Solution:** I wrote a custom **JavaScript bookmarklet** that runs directly inside the user's browser on their Letterboxd profile page. Because the script executes within the user's authenticated browser session, Cloudflare sees it as a normal page interaction. The bookmarklet:
- Scrapes every film across all paginated pages
- Parses star-glyph ratings (★, ½)
- Extracts titles, years, and source URLs
- Downloads a clean `.json` file ready for import

### 2. IMDb: HTTP 202 Gating & No Public API

IMDb returns `HTTP 202` (empty body) to server-side requests — a soft bot gate that makes traditional scraping impossible. IMDb also has no free public API for personal ratings.

**Solution:** I bypassed scraping entirely by leveraging IMDb's native **Ratings CSV Export** feature. Users export their `ratings.csv` directly from IMDb's account settings, then upload it to MovieVault's import page. The parser:
- Handles PapaParse CSV streaming
- Normalizes IMDb's 10-point scale → MovieVault's 5-point scale
- Extracts IMDb IDs (`tt*******`) for deduplication

### 3. Cross-Platform Deduplication

The same movie can exist with slightly different titles, different release years, or different metadata across IMDb and Letterboxd. Naively importing both creates duplicates.

**Solution:** Every movie is normalized through a deterministic pipeline:
```
normalizeTitle(title) + ":" + (year ?? "unknown")
```
Titles are lowercased, stripped of special characters, and collapsed. Source-specific records (`Watch`, `ExternalSourceMap`) are preserved independently while the canonical `Movie` record remains unified.

### 4. Security Without Friction

The site needed to be publicly browsable (portfolio) while keeping import tools completely hidden and protected.

**Solution:** Next.js Edge Middleware intercepts every request at the edge. Only `/import`, `/api/import`, and `/api/enrich` routes require authentication via a server-side cookie. The login page (`/login`) exists but is never linked from anywhere in the UI — it is only accessible by manually typing the URL. There is no logout button, no account menu, nothing that reveals the admin system exists.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Fuse.js  │  │  Filters │  │  Bookmarklet      │  │
│  │ Search   │  │  & Sort  │  │  (Letterboxd)     │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └──────────────┴─────────────────┘             │
└──────────────────────┬───────────────────────────────┘
                       │ fetch /api/movies
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Next.js 15 (Server)                  │
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ /api/movies│  │ /api/import│  │ /api/enrich   │  │
│  │ (public)   │  │ (admin)    │  │ (admin)       │  │
│  └────┬───────┘  └────┬───────┘  └────┬──────────┘  │
│       │               │               │             │
│       │          ┌─────┘               │             │
│       ▼          ▼                     ▼             │
│  ┌─────────────────────────────────────────────┐     │
│  │              Prisma ORM                     │     │
│  └──────────────────┬──────────────────────────┘     │
│                     │                                │
│  ┌──────────────────┐  ┌────────────────────────┐    │
│  │ Edge Middleware  │  │  TMDB API (enrichment) │    │
│  │ (auth guard)     │  │                        │    │
│  └──────────────────┘  └────────────────────────┘    │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  PostgreSQL      │
            │  (Neon)          │
            └──────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server-side rendering, API routes, Edge Middleware |
| Language | TypeScript 5.7 | End-to-end type safety |
| Styling | Tailwind CSS 3.4 | Custom glassmorphism UI with floating glass-card system |
| Database | PostgreSQL (Neon) | Cloud-hosted relational database |
| ORM | Prisma | Type-safe database queries, migrations, schema management |
| Search | Fuse.js | Client-side fuzzy search with weighted fields |
| CSV Parsing | PapaParse | IMDb `ratings.csv` streaming parser |
| HTML Parsing | Cheerio | Server-side HTML scraping for Letterboxd fallback |
| Validation | Zod | Runtime environment variable validation |
| Deployment | Vercel | Edge network, automatic GitHub deploys, SSL |

---

## Database Schema

The database uses 6 models designed around cross-platform movie deduplication:

| Model | Purpose |
|---|---|
| `Movie` | Canonical film record (title, year, poster, runtime, genres) |
| `Watch` | Source-specific watch/rating record (one per platform per film) |
| `Genre` | Genre taxonomy populated via TMDB enrichment |
| `MovieGenre` | Many-to-many join between movies and genres |
| `ExternalSourceMap` | Maps IMDb IDs and Letterboxd slugs to canonical movie records |
| `SyncRun` | Audit log tracking every import operation (counts, status, errors) |

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/cthboss001/movievault.git
cd movievault

# 2. Install
npm install

# 3. Environment
cp .env.example .env
# Fill in: DATABASE_URL, TMDB_API_KEY, ADMIN_PASSWORD

# 4. Database
npx prisma migrate dev

# 5. Launch
npm run dev
```

Navigate to `http://localhost:3000` to browse the public archive.
Navigate to `http://localhost:3000/login` to access the admin dashboard and import your movies.

---

## Security

- **Zero hardcoded secrets.** All keys are managed via environment variables, validated at runtime with Zod.
- **Edge Middleware authentication.** Admin routes are intercepted at Vercel's edge layer before reaching the application server.
- **Server-side cookie verification.** Authentication state is stored in `httpOnly` cookies — not `localStorage`, not JWTs in headers.
- **Parameterized queries.** Prisma ORM prevents SQL injection by design.
- **No public attack surface.** The login page has no inbound links. Import APIs reject unauthenticated requests with redirects, not error messages.

---

## Design Philosophy

MovieVault's UI is intentionally **borderless**. There are no harsh outlines or white borders anywhere on the site. Instead, depth is created through:

- **Glassmorphism** — translucent card surfaces with backdrop blur
- **Soft shadows** — floating depth instead of flat containers
- **Cyan glow accents** — interactive elements emit a subtle teal radiance on hover
- **Floating animations** — badges and interactive elements gently bob with a custom `animate-float` keyframe
- **Poster-first layout** — movies with posters are surfaced first; the poster IS the card

The goal is that when someone visits, it should feel like entering a personal film archive built over many years — not a SaaS dashboard, not a startup landing page.

---

<div align="center">
  <br/>
  <p>Designed and built by <a href="https://www.tazim.dev"><strong>Tazim Hossen</strong></a></p>
  <p>
    <a href="https://www.tazim.dev">Portfolio</a> · <a href="https://movies.tazim.dev">MovieVault</a>
  </p>
</div>
