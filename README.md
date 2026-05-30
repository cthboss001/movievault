<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/film.svg" width="60" alt="Film Icon"/>
  <br/>
  <h1>MovieVault</h1>
  <p><strong>A Lifetime of Movies.</strong></p>
  <p>A premium, borderless, blazing-fast personal movie archive deployed at <a href="https://movies.tazim.dev">movies.tazim.dev</a>.</p>
</div>

---

## 🎬 Overview

MovieVault is a highly-curated, read-only public portfolio that aggregates a lifetime of watched films from both **IMDb** and **Letterboxd** into a single, unified database. 

It features a stunning, glassmorphism-inspired "borderless" UI, instant client-side fuzzy searching, and automated TMDB metadata enrichment for gorgeous poster displays.

### ✨ Features
- **Public Portfolio**: A beautiful, read-only public view for guests to explore your movie history.
- **Hidden Admin Dashboard**: A strictly protected `/import` route secured by Next.js Edge Middleware for managing the archive.
- **Universal Import Engine**: Custom JavaScript bookmarklets and CSV parsers to merge scattered IMDb and Letterboxd data flawlessly.
- **Automated Enrichment**: Background TMDB API integration automatically fetches high-resolution posters, genres, and exact runtimes for every imported movie.
- **Instant Search & Filters**: Built with `fuse.js` for instant, typo-tolerant search, sorting by rating/year, and genre filtering.
- **Analytics**: A dedicated `/stats` page showing watch patterns, genre distribution, and lifetime runtime calculations.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom floating glass-card UI)
- **Database:** PostgreSQL via [Neon](https://neon.tech/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Search Engine:** [Fuse.js](https://fusejs.io/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 🚀 Running Locally

MovieVault is designed to be easily self-hosted or run locally.

1. **Clone & Install**
   ```bash
   git clone https://github.com/cthboss001/movievault.git
   cd movievault
   npm install
   ```

2. **Configure Environment**
   Duplicate the example environment file and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *You will need a PostgreSQL URL, a free TMDB API key, and a custom Admin Password.*

3. **Initialize Database**
   ```bash
   npm run prisma:migrate
   ```

4. **Launch**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000/login` to access the admin dashboard and begin importing your movies.

---

## 🔐 Security Note

This repository contains **no sensitive keys or secrets**. All authentication, database connections, and API keys are strictly managed via environment variables. The public site is entirely read-only, and state-mutating actions are locked behind a server-side cookie verification system.

---

<div align="center">
  <i>Designed and developed by <a href="https://www.tazim.dev">Tazim Hossen</a>.</i>
</div>
