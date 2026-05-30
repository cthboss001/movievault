# MovieVault

MovieVault is a personal movie database. It imports your watched films and ratings from IMDb and Letterboxd, stores them in a Neon PostgreSQL database using Prisma, and provides a blazing-fast, client-side searchable interface.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **CSV Parsing**: PapaParse (for IMDb exports)
- **Hosting Target**: Vercel

## The Import Engine

Due to strict bot-protection on Letterboxd (Cloudflare) and IMDb (HTTP 202 gating), server-side scraping is highly unreliable. MovieVault solves this with a **bulletproof, client-side import engine**:

1. **Letterboxd**: Uses a custom **Bookmarklet**. You run the script directly on your `letterboxd.com/.../films/` profile page. It uses your active browser session to scrape all pages instantly and downloads a formatted `.json` file.
2. **IMDb**: Bypasses scraping entirely by leveraging IMDb's native **Ratings Export** feature, which provides a `ratings.csv` file. 

You then upload either file to the `/import` page, where MovieVault normalizes titles, converts IMDb's 10-point scale to a 5-point scale, deduplicates entries, and merges everything into a unified database.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env and add your DATABASE_URL

# 3. Setup Database
npm run prisma:migrate

# 4. Run Development Server
npm run dev
```

Open `http://localhost:3000/import` to begin importing your movies.

## Future Roadmap

The application is currently in active development. Planned features include:

- **Poster & Metadata Enrichment**: Integrating the **TMDB API** via a background job to automatically fetch movie posters, overviews, and genres based on imported titles and years.
- **Secure Dual-Role Middleware**: Adding a Next.js Middleware to protect the app when deployed to the public web.
  - **Admin**: Full access (requires `ADMIN_PASSWORD`).
  - **Guest**: Read-only access to browse, search, and view stats (requires `GUEST_PASSWORD`).
- **Stats Dashboard**: Advanced visual analytics for most watched years, average ratings, and top genres.
- **Advanced UI**: Pagination, dynamic routing (`/movie/[id]`), and deep filtering by source and rating.

## License
MIT
