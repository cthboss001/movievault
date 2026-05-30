# MovieVault

MovieVault is a personal movie database for `movies.tazim.dev`. It syncs watched films from public IMDb and Letterboxd profile pages, stores them in PostgreSQL with Prisma, and searches the local browser index with Fuse.js.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Fuse.js
- Vercel

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
```

Required environment variables:

```txt
DATABASE_URL
SYNC_SECRET
```

No movie API keys are used. The sync system scrapes publicly accessible profile pages only.

## Sync

Browser sync:

```bash
npm run dev
```

Open `http://localhost:3000` and press **Sync**. In local development, the button can trigger sync without an auth header.

Manual local sync for both sources:

```bash
npm run sync
```

Protected API sync:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer YOUR_SYNC_SECRET"
```

Vercel Cron is configured in `vercel.json` to call `/api/sync` daily at 03:00 UTC.

Production browser sync is intentionally protected when `SYNC_SECRET` is configured. Local development remains one-click for convenience.

Current public sources:

```txt
IMDb Ratings: https://www.imdb.com/user/p.dpsmlayfts2irmpiigksc4a5ly/ratings/
Letterboxd Films: https://letterboxd.com/cthboss001/films/
```

The scraper providers live in:

```txt
lib/sync/providers/
  imdb.ts
  letterboxd.ts
  index.ts
```

Each provider returns:

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

IMDb ratings are normalized from a 10-point scale to MovieVault's 5-point rating scale so both sources can be compared consistently.

Example command output:

```txt
Synced 842 movies
Added 17 new movies
Updated 4 movies
Skipped 821 existing movies
Sources: IMDb 612, Letterboxd 701
```

## Current MVP

- Search homepage with client-side Fuse.js
- Movie cards with poster, title, year, watched status, rating, and genres
- Stats page with totals, runtime, average rating, genres, and yearly counts
- Prisma schema for movies, watches, genres, sync runs, and external source maps
- Public IMDb ratings scraper
- Public Letterboxd films scraper
- Provider-based sync architecture
- Protected sync API route
