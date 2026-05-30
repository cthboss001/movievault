# MovieVault Next Steps

## Priority 1: Make Sync Work End-to-End

1. Add a real PostgreSQL connection string to `.env`.
2. Run:

```bash
npm.cmd run prisma:migrate
```

3. Start the app:

```bash
npm.cmd run dev
```

4. Open:

```txt
http://127.0.0.1:3000
```

5. Press **Sync**.
6. Verify rows exist in:

```txt
Movie
Watch
ExternalSourceMap
SyncRun
```

Use Prisma Studio if helpful:

```bash
npx.cmd prisma studio
```

## Priority 2: Validate Scrapers

1. Confirm Letterboxd sync imports all pages.
2. Confirm ratings parse correctly.
3. Confirm duplicate prevention works by pressing **Sync** twice.
4. Validate IMDb from a non-Codex environment.
5. If IMDb still returns HTTP `202`, add a fallback strategy or visible source warning.

## Priority 3: Add Tests

1. Save sample Letterboxd HTML fixture.
2. Save sample IMDb HTML/JSON fixture.
3. Add parser unit tests for:
   - title
   - year
   - rating
   - source URL
   - pagination URL extraction
4. Add sync-runner tests for deduplication.

## Priority 4: Improve UI

1. Show last synced time.
2. Show per-source sync status.
3. Show source counts after sync.
4. Improve empty database state.
5. Add filters:
   - source
   - year
   - rating
   - watched date

## Priority 5: Production Readiness

1. Provision production PostgreSQL.
2. Add Vercel env vars:
   - `DATABASE_URL`
   - `SYNC_SECRET`
3. Deploy to Vercel.
4. Configure `movies.tazim.dev`.
5. Confirm Vercel cron calls `/api/sync`.
6. Add rate limiting/cooldown for manual sync.
7. Add logging for scraper failures.

## Priority 6: Future Enhancements

1. Movie detail pages.
2. Duplicate merge/split tools.
3. Search index caching.
4. Poster enrichment from public source pages if feasible.
5. Better stats visualizations.
6. Rewatch tracking.
7. Additional providers.

