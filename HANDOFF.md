# MovieVault Project Handoff

## Project Overview

MovieVault is a production-oriented personal movie database for `movies.tazim.dev`.

The goal is to build a fast searchable website that syncs watched/rated movies from public profile pages, stores them locally in PostgreSQL, and provides instant search across the user's movie history.

Current sources:

- IMDb Ratings: `https://www.imdb.com/user/p.dpsmlayfts2irmpiigksc4a5ly/ratings/`
- Letterboxd Films: `https://letterboxd.com/cthboss001/films/`

Important constraint: no API keys, no TMDb API, and no manual CSV exports. Sync must work from publicly accessible profile pages only.

### Current Architecture

The app is a Next.js 15 App Router project with a PostgreSQL database accessed through Prisma.

Core layers:

- `app/`: pages and API routes.
- `components/`: reusable UI components.
- `lib/`: database access, stats queries, sync logic, scraper providers.
- `prisma/`: Prisma schema, seed file, and migrations.
- `scripts/`: command-line sync entrypoint.
- `types/`: shared TypeScript types.

Data flow:

1. Browser loads the homepage.
2. Homepage fetches `/api/movies`.
3. Movie data is loaded into the browser.
4. Fuse.js performs instant client-side fuzzy search.
5. The user can press the homepage **Sync** button.
6. The button calls `/api/sync`.
7. `/api/sync` runs public-profile scrapers.
8. Scraped items are normalized, deduplicated, and upserted into PostgreSQL.
9. The homepage reloads the movie search index after sync.

### Technology Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Fuse.js
- Cheerio for HTML parsing
- Zod for environment parsing
- ESLint flat config
- Vercel deployment target

### Major Design Decisions

- Search is client-side with Fuse.js for instant interaction.
- PostgreSQL is the source of truth.
- Scrapers are provider-based so new sources can be added without rewriting sync.
- IMDb ratings are normalized from a 10-point scale to MovieVault's 5-point rating scale.
- Letterboxd ratings are parsed from star glyphs.
- Movies are deduplicated by normalized title plus year.
- Source-specific records are still stored through `Watch` and `ExternalSourceMap`.
- Local development allows one-click browser sync without an auth header.
- Production sync remains protected by `SYNC_SECRET`.
- No TMDb/API-key enrichment is currently used.

## Current Progress

### Completed

- Next.js 15 app scaffold.
- TypeScript configuration.
- Tailwind CSS setup.
- ESLint flat config.
- Prisma schema for movies, watches, genres, source maps, and sync runs.
- Initial SQL migration.
- Seed file with a sample movie.
- Homepage search UI.
- Movie cards.
- Client-side Fuse.js search.
- Stats page.
- `/api/movies` route.
- `/api/stats` route.
- `/api/sync` route.
- Browser-visible **Sync** button.
- Public Letterboxd provider.
- Public IMDb provider.
- Provider index export.
- Shared normalized movie type.
- Unified sync command: `npm run sync`.
- Vercel cron configuration for `/api/sync`.
- README setup and sync instructions.
- Verification commands pass:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

### Partially Completed

- Letterboxd scraping:
  - Static Letterboxd HTML was accessible from the development environment.
  - Provider parses film cards, ratings, title/year, source URL, and pagination.
  - It has not yet been tested against a live PostgreSQL database in this repo because `DATABASE_URL` is not configured.

- IMDb scraping:
  - Provider supports several parsing strategies:
    - `__NEXT_DATA__` JSON extraction.
    - Modern list-card selectors.
    - Older IMDb list markup.
    - `paginationKey` / next-link pagination.
  - The current environment returned HTTP `202` with an empty body for IMDb. This is likely bot-gating.
  - The provider exists but needs validation from a normal browser/server environment.

- Database:
  - Prisma schema and migration exist.
  - Local database is not configured yet.
  - App currently reports: `DATABASE_URL is missing`.

- Homepage sync:
  - Button is implemented and visible.
  - It calls `/api/sync`.
  - It shows status/errors in the UI.
  - It will work after database setup and migration.

### Not Yet Implemented

- Real local/production PostgreSQL provisioning.
- Running migrations against a real database.
- Live sync validation with persisted data.
- Full production deployment on Vercel.
- Domain configuration for `movies.tazim.dev`.
- Robust scraper test fixtures.
- Movie detail pages.
- Advanced filters.
- Admin/auth UI.
- Poster/overview/runtime enrichment without API keys.
- Background sync status UI.
- Retry/backoff strategy for scraper failures.
- Proper production protection for browser-triggered sync beyond bearer-token API access.

## Folder Structure

Important files and folders:

```txt
app/
  layout.tsx
  page.tsx
  globals.css
  stats/page.tsx
  api/movies/route.ts
  api/stats/route.ts
  api/sync/route.ts

components/
  bar-list.tsx
  movie-card.tsx
  movie-grid.tsx
  search-experience.tsx
  stats-card.tsx

lib/
  db.ts
  env.ts
  movies.ts
  stats/get-stats.ts
  sync/
    normalizers/movie.ts
    providers/http.ts
    providers/imdb.ts
    providers/index.ts
    providers/letterboxd.ts
    sync-runner.ts
    types.ts

prisma/
  schema.prisma
  seed.ts
  migrations/20260530090000_phase_2_public_profile_sync/migration.sql

scripts/
  sync.ts

types/
  movie.ts
  stats.ts

README.md
NEXT_STEPS.md
PROJECT_STATE.json
HANDOFF.md
package.json
vercel.json
```

### `app/`

Contains App Router pages and API routes.

- `app/layout.tsx`: root layout, navigation, metadata.
- `app/page.tsx`: homepage shell, renders `SearchExperience`.
- `app/globals.css`: Tailwind imports and global styling.
- `app/stats/page.tsx`: stats dashboard page.
- `app/api/movies/route.ts`: returns compact movie index for Fuse.js.
- `app/api/stats/route.ts`: returns aggregate stats.
- `app/api/sync/route.ts`: protected production sync endpoint and local development sync endpoint.

### `components/`

Reusable React UI.

- `search-experience.tsx`: client component for loading movies, searching with Fuse.js, and triggering sync.
- `movie-card.tsx`: individual movie result card.
- `movie-grid.tsx`: responsive movie grid.
- `stats-card.tsx`: compact stat display card.
- `bar-list.tsx`: simple bar visualization for genre/year stats.

### `lib/`

Business logic and data access.

- `db.ts`: Prisma client singleton.
- `env.ts`: Zod environment parsing. `DATABASE_URL` is optional at build time so Vercel builds do not fail before env injection.
- `movies.ts`: database query for search index.
- `stats/get-stats.ts`: stats aggregation queries.

### `lib/sync/`

Public profile sync architecture.

- `types.ts`: normalized movie type and provider contracts.
- `sync-runner.ts`: runs providers, deduplicates movies, upserts records, logs sync runs.
- `normalizers/movie.ts`: title normalization, slug helpers, year parsing.
- `providers/http.ts`: shared fetch helpers and absolute URL resolution.
- `providers/letterboxd.ts`: Letterboxd public films scraper.
- `providers/imdb.ts`: IMDb public ratings scraper.
- `providers/index.ts`: exports providers.

### `prisma/`

Database ownership.

- `schema.prisma`: canonical schema.
- `seed.ts`: creates a sample Fight Club record.
- `migrations/.../migration.sql`: initial SQL migration.

### `scripts/`

CLI entrypoints.

- `sync.ts`: runs both providers and logs sync statistics.

### `types/`

Shared frontend/backend type contracts.

- `movie.ts`: movie search/card types.
- `stats.ts`: stats response types.

## Database

The database is PostgreSQL via Prisma.

### Current Prisma Models

#### `Movie`

Canonical movie record.

Fields:

- `id`
- `title`
- `normalizedTitle`
- `year`
- `overview`
- `posterUrl`
- `runtimeMinutes`
- `tmdbId`
- `imdbId`
- `lastSyncedAt`
- `createdAt`
- `updatedAt`

Relationships:

- `genres`: many-to-many through `MovieGenre`
- `sourceMaps`: one-to-many to `ExternalSourceMap`
- `watches`: one-to-many to `Watch`

Indexes:

- `tmdbId` unique
- `imdbId` unique
- `(normalizedTitle, year)` index

Note: `tmdbId` exists from the earlier architecture but is not populated because TMDb/API-key enrichment was removed.

#### `Watch`

Source-specific watch/rating record.

Fields:

- `id`
- `movieId`
- `source`
- `watchedDate`
- `rating`
- `sourceUrl`
- `sourceEntryId`
- `lastSyncedAt`
- `createdAt`
- `updatedAt`

Relationships:

- belongs to `Movie`

Indexes:

- unique `(source, sourceEntryId)`
- `movieId`
- `(source, watchedDate)`

#### `Genre`

Genre table.

Fields:

- `id`
- `name`
- `slug`
- `createdAt`

Relationships:

- many-to-many to `Movie` through `MovieGenre`

Note: genres are not currently populated by public scrapers.

#### `MovieGenre`

Join table between `Movie` and `Genre`.

Primary key:

- `(movieId, genreId)`

#### `ExternalSourceMap`

Maps source-specific movie IDs/URLs to canonical Movie rows.

Fields:

- `id`
- `source`
- `sourceMovieId`
- `sourceUrl`
- `movieId`
- `lastSyncedAt`
- `createdAt`
- `updatedAt`

Indexes:

- unique `(source, sourceMovieId)`
- `movieId`

#### `SyncRun`

Logs provider-level sync runs.

Fields:

- `id`
- `source`
- `status`
- `startedAt`
- `finishedAt`
- `importedCount`
- `updatedCount`
- `skippedCount`
- `errorMessage`

Indexes:

- `(source, startedAt)`

### Enums

```prisma
enum WatchSource {
  LETTERBOXD
  IMDB
}

enum SyncStatus {
  RUNNING
  SUCCESS
  FAILED
}
```

### Pending Database Work

- Configure a real `DATABASE_URL`.
- Run `npm.cmd run prisma:migrate`.
- Optionally run `npm.cmd run db:seed`.
- Validate actual inserted rows after browser sync.
- Consider removing unused TMDb fields if the no-API-key constraint is permanent.
- Consider adding a `Source` enum/table if many future providers are expected.
- Consider adding a unique composite constraint on `(normalizedTitle, year)` after dedupe confidence improves.

## Search System

### Current Implementation

Search is implemented in `components/search-experience.tsx`.

Flow:

1. Client component loads `/api/movies`.
2. `/api/movies` calls `getMovieSearchIndex()` in `lib/movies.ts`.
3. The API returns compact movie records.
4. The browser builds a Fuse.js index.
5. Search updates immediately as the user types.

Current search item shape:

```ts
{
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  watched: boolean;
  watchedDate: string | null;
  rating: number | null;
  genres: string[];
}
```

Fuse configuration:

- weighted title search
- genre search
- year search
- threshold `0.35`
- `ignoreLocation: true`
- `minMatchCharLength: 2`

### How Data Flows

Database -> Prisma -> `/api/movies` -> browser state -> Fuse.js -> `MovieGrid`.

After sync completes, the homepage calls `loadMovies()` again and refreshes the local index.

### Planned Optimizations

- Add filters for source, year, rating, and watched date.
- Add virtualized rendering if the list becomes very large.
- Add local cache with invalidation based on latest `lastSyncedAt`.
- Add a server-side fallback search endpoint for very large collections.
- Add search aliases/alternate titles if available.

## Sync System

### Current Letterboxd Work

Provider: `lib/sync/providers/letterboxd.ts`

Source URL:

```txt
https://letterboxd.com/cthboss001/films/
```

Parsing strategy:

- Uses Cheerio.
- Parses `.griditem` and `.poster-container`.
- Looks for:
  - `data-item-name`
  - `data-film-name`
  - `data-item-full-display-name`
  - `data-item-link`
  - `data-target-link`
  - `data-film-slug`
  - `.rating`
- Parses year from display name like `Movie Title (2023)`.
- Parses rating from Letterboxd star glyphs.
- `watchedDate` is currently `null` because the public films grid does not expose exact watched date.

Pagination strategy:

- Starts at `/cthboss001/films/`.
- Follows `.pagination a.next` or `.paginate-nextprev a.next`.
- Max page limit: `250`.

Known Letterboxd limitations:

- Exact watched dates are not available from the films grid.
- Posters are not currently stored from Letterboxd because current movie card expects `posterUrl`, but the sync normalized structure does not include poster.
- Some Letterboxd markup may change over time.
- Rating parsing depends on star glyph text.

### Current IMDb Work

Provider: `lib/sync/providers/imdb.ts`

Source URL:

```txt
https://www.imdb.com/user/p.dpsmlayfts2irmpiigksc4a5ly/ratings/
```

Parsing strategy:

- Uses Cheerio.
- First tries to parse `#__NEXT_DATA__`.
- Then falls back to selectors:
  - `li.ipc-metadata-list-summary-item`
  - `.lister-item`
  - `[data-testid='title-list-item']`
- Extracts title links matching `/title/tt...`.
- Parses year from text.
- Parses user rating from text and normalizes IMDb 10-point ratings to MovieVault 5-point ratings.
- Attempts to parse watched/rated date from `Rated on Month Day, Year`.

Pagination strategy:

- Follows:
  - `a[aria-label='Next']`
  - `a.ipc-see-more__button`
  - links containing `paginationKey`
  - `.lister-page-next.next-page`
- Max page limit: `250`.

Known IMDb limitations:

- In the Codex environment, IMDb returned HTTP `202` with empty body.
- This is likely IMDb bot-gating.
- Provider needs validation from a normal local machine/server environment.
- IMDb may require cookies, different user agent handling, or a browser-based fetch strategy if it continues to gate server-side requests.

### Deduplication Strategy

Sync runner: `lib/sync/sync-runner.ts`

Current dedupe key:

```txt
normalizeTitle(title) + ":" + (year ?? "unknown")
```

This groups IMDb and Letterboxd entries for the same movie into one canonical `Movie`.

For each source record:

- `ExternalSourceMap` is upserted by `(source, sourceMovieId)`.
- `Watch` is upserted by `(source, sourceEntryId)`.

Source ID extraction:

- IMDb: extracts `tt...` from `/title/tt...`.
- Letterboxd: uses the final URL path segment.

Known dedupe limitations:

- Remakes with same title and missing year can collide.
- Alternate titles may fail to dedupe.
- Different release years across sources may create duplicates.
- A stronger future dedupe strategy may need IMDb IDs, Letterboxd slugs, or manual merge tools.

## Environment Variables

Existing `.env.example`:

```txt
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/movievault?schema=public"
SYNC_SECRET="replace-with-a-long-random-secret"
```

### Required

- `DATABASE_URL`: required at runtime for Prisma/database access.
- `SYNC_SECRET`: required for protected production sync.

### Optional

None currently.

Important: no `TMDB_API_KEY`, no Letterboxd username env var, and no IMDb env var are currently used. Source URLs are hardcoded in providers.

## Commands

### Development

```bash
npm.cmd install
npm.cmd run dev
```

Local app:

```txt
http://127.0.0.1:3000
```

### Build and Verification

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

### Sync

Browser sync:

1. Run `npm.cmd run dev`.
2. Open `http://127.0.0.1:3000`.
3. Press **Sync**.

CLI sync:

```bash
npm.cmd run sync
```

API sync:

```bash
curl -X POST http://localhost:3000/api/sync ^
  -H "Authorization: Bearer YOUR_SYNC_SECRET"
```

In local development, `/api/sync` allows browser sync without an auth header.

In production, `/api/sync` requires:

```txt
Authorization: Bearer <SYNC_SECRET>
```

### Database

Generate Prisma client:

```bash
npm.cmd run prisma:generate
```

Run migration:

```bash
npm.cmd run prisma:migrate
```

Seed database:

```bash
npm.cmd run db:seed
```

Open Prisma Studio:

```bash
npx.cmd prisma studio
```

## Known Issues

### Bugs / Runtime Issues

- `DATABASE_URL` is not currently configured in this workspace, so movie loading and sync fail until database setup is completed.
- IMDb returned HTTP `202` with empty body in the Codex environment.
- Production browser sync UX is not fully designed; the endpoint is protected, but there is no login/admin UI.
- When the dev server is running, Prisma generation/build may fail on Windows due to a locked query engine DLL. Stop Node/dev server processes before running `npm.cmd run build`.

### Incomplete Features

- No real database has been migrated in this environment.
- No live sync has been persisted yet.
- No production deployment.
- No domain setup.
- No scraper fixture tests.
- No detail page.
- No advanced filters.
- No source-specific status panel.
- No background job progress display.
- No poster enrichment.
- No genre/runtime/overview enrichment from public sources.

### Technical Debt

- `tmdbId`, `imdbId`, `overview`, `posterUrl`, and `runtimeMinutes` remain from the original architecture, but public scraper sync does not populate most of them.
- Source URLs are hardcoded in provider files.
- Deduplication is title/year based.
- Sync runner writes provider-level `SyncRun` rows but final dedupe stats are not written back into a global sync run.
- Provider failures are collected as warnings, but if all providers fail the result can show zero synced movies without a stronger failure state.

## Next Tasks (Priority Ordered)

1. Immediate next task:
   - Configure PostgreSQL by adding `DATABASE_URL` to `.env`.
   - Run `npm.cmd run prisma:migrate`.
   - Open the app and press **Sync**.
   - Confirm rows appear in `Movie`, `Watch`, `ExternalSourceMap`, and `SyncRun`.

2. MVP completion tasks:
   - Validate Letterboxd sync end-to-end against the real database.
   - Validate IMDb sync outside the Codex environment.
   - If IMDb still returns `202`, implement a more robust fetch/browser strategy or gracefully disable IMDb with a visible warning.
   - Add scraper fixture tests for saved Letterboxd and IMDb HTML samples.
   - Improve homepage empty/error states after database setup.
   - Add source counts and last synced time to the UI.
   - Add `lastSyncedAt` display somewhere in the app.

3. Production readiness tasks:
   - Provision production Postgres.
   - Configure Vercel environment variables:
     - `DATABASE_URL`
     - `SYNC_SECRET`
   - Run production migration.
   - Deploy to Vercel.
   - Configure `movies.tazim.dev`.
   - Confirm Vercel cron calls `/api/sync`.
   - Add production sync protection UX or admin-only access.
   - Add logging/monitoring for scraper failures.
   - Add rate limiting or cooldown for manual sync.

4. Future enhancements:
   - Movie detail pages.
   - Filters by source, year, rating, and watched date.
   - Manual merge/split tools for duplicate movies.
   - Public sharing mode.
   - Import from additional providers.
   - Poster enrichment from source pages or public embedded metadata.
   - Runtime/genre enrichment from public non-key sources if legally and technically suitable.
   - Better charts for stats.
   - Rewatch tracking.
   - Search index caching.

## AI Handoff Context

This section is addressed to the next AI coding assistant.

You are continuing development on MovieVault, a Next.js 15 personal movie database. The user wants a production-quality app but is currently prioritizing a simple browser workflow: open the app, press **Sync**, and have the system scrape public IMDb/Letterboxd profile pages into PostgreSQL.

Do not reintroduce TMDb or API-key-based enrichment unless the user explicitly reverses the no-API-key requirement. The current requirement is scraper-only ingestion from public pages.

### Current State You Should Assume

- The app compiles.
- Lint/typecheck/build passed before this handoff.
- The homepage has a Sync button.
- The Sync button calls `/api/sync`.
- `/api/sync` runs both providers.
- Local development allows `/api/sync` without Authorization.
- Production requires `SYNC_SECRET`.
- No database is configured yet in this workspace.
- The immediate blocker is missing `DATABASE_URL`.

### Coding Conventions

- Use TypeScript strictly.
- Prefer existing project structure.
- Keep sync code provider-based.
- Keep scraper output normalized to:

```ts
{
  title: string;
  year: number | null;
  rating: number | null;
  watchedDate: Date | null;
  source: "imdb" | "letterboxd";
  sourceUrl: string;
}
```

- Use Cheerio for static HTML parsing.
- Use Prisma for database writes.
- Use Fuse.js for browser search.
- Use Tailwind for UI.
- Use `npm.cmd` on Windows if PowerShell blocks npm shims.
- Use `apply_patch` or normal file edits carefully; do not wipe user changes.

### Architectural Principles

- PostgreSQL is the source of truth.
- Browser search should stay instant.
- Sync providers should be independent and reusable.
- One provider failing should not destroy data from another provider.
- Source-specific data belongs in `Watch` and `ExternalSourceMap`.
- Canonical movie data belongs in `Movie`.
- Avoid duplicate `Movie` rows where possible, but keep the dedupe logic understandable.

### Constraints

- No TMDb.
- No IMDb API.
- No Letterboxd API.
- No manual CSV export flow.
- No API keys for movie metadata.
- Must work from public profile pages.
- Must be usable through the browser Sync button.

### Things That Must Not Be Changed Without User Approval

- Do not remove the browser Sync button.
- Do not replace client-side Fuse search with server-only search.
- Do not remove the provider-based scraper architecture.
- Do not require manual CSV exports.
- Do not add authentication complexity before the MVP works locally.
- Do not change the source URLs unless the user asks.

### Future Direction

The next productive path is:

1. Make database setup real.
2. Confirm Letterboxd sync persists movies.
3. Confirm IMDb sync from an environment that is not blocked.
4. Add scraper tests and fixtures.
5. Improve production safety and deployment.
6. Add richer UI once data ingestion is reliable.

If you need to rediscover project state quickly, read these files first:

1. `PROJECT_STATE.json`
2. `NEXT_STEPS.md`
3. `README.md`
4. `lib/sync/sync-runner.ts`
5. `lib/sync/providers/letterboxd.ts`
6. `lib/sync/providers/imdb.ts`
7. `prisma/schema.prisma`

