# MovieVault Next Steps

## ✅ Recently Completed
- Configured Neon PostgreSQL database and schema.
- Built bulletproof `/import` infrastructure that bypasses Cloudflare/IMDb bot-gating.
- Created Letterboxd Bookmarklet scraper.
- Built native IMDb CSV Export uploader with robust parsing (`papaparse`).
- Data flows flawlessly into the database, normalizing titles and updating deduplicated watches.

---

## Priority 1: Poster & Metadata Enrichment (TMDB)

Because the initial import only brings in titles, years, and ratings, the app needs rich metadata (like posters, genres, and runtimes).

1. **Get API Key**: Create a free account at [themoviedb.org](https://www.themoviedb.org/) and generate an API key. Add it to your `.env` as `TMDB_API_KEY`.
2. **Build TMDB Client**: Create a service in `lib/tmdb/client.ts` that searches TMDB by `title` and `year`.
3. **Background Enrichment**: Create an API route (e.g., `/api/enrich`) that finds movies in the database where `posterUrl IS NULL`.
4. **Update DB**: Call the TMDB client for these movies and update the `posterUrl`, `tmdbId`, `overview`, and `genres` in the Prisma database (the columns already exist!).
5. **UI Updates**: Update the movie grid in `app/page.tsx` to render `<Image src={posterUrl} />` instead of just text.

## Priority 2: Secure Deployment to Vercel

Before exposing this database to the live web, the app needs basic security.

1. **Vercel Account**: Connect your GitHub repository to a free Vercel account.
2. **Environment Variables**: Add `DATABASE_URL` (your Neon Postgres string) and `TMDB_API_KEY` to the Vercel dashboard. **Never commit `.env` to GitHub.**
3. **Add Dual-Role Password Middleware**: To protect your vault while still allowing you to show it off, build a simple Next.js Middleware (`middleware.ts`) with two access levels:
   - **Admin Login**: Uses an `ADMIN_PASSWORD` env var. Grants full access to view movies and use the `/import` route to manage the database.
   - **Guest Login**: Uses a `GUEST_PASSWORD` env var. Grants read-only access to view the movie grid and stats, but blocks access to the `/import` page. *(Note: Guests are fully allowed to use the search bar, sorting, and filters, as these are safe read-only actions.)*
4. **Deploy**: Hit Deploy on Vercel to get a live URL.

## Priority 3: Add Tests & Refinements

1. Add unit tests for the CSV parsing edge cases.
2. Add pagination for the main Movie Grid (currently it renders all movies at once, which will slow down if you have thousands).
3. Improve search: Add Fuse.js or PostgreSQL full-text search.
4. Add filters to the UI (Filter by Source, Year, Rating, Genre).
5. Build Movie detail pages (`/movie/[id]`) showing the overview and TMDB metadata.
6. Build a Stats page (e.g. "Most watched years", "Average rating").
