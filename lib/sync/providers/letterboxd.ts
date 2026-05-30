import * as cheerio from "cheerio";
import { parseNullableYear } from "@/lib/sync/normalizers/movie";
import { fetchHtmlWithCookies, sleep, toAbsoluteUrl } from "@/lib/sync/providers/http";
import type { NormalizedMovie, SyncSourceAdapter } from "@/lib/sync/types";

const LETTERBOXD_BASE_URL = "https://letterboxd.com";
const LETTERBOXD_FILMS_URL = "https://letterboxd.com/cthboss001/films/";
const MAX_PAGES = 250;

export const letterboxdProvider: SyncSourceAdapter = {
  source: "letterboxd",
  async fetchMovies() {
    const movies: NormalizedMovie[] = [];
    const seenUrls = new Set<string>();
    let nextUrl: string | null = LETTERBOXD_FILMS_URL;
    let referer = LETTERBOXD_BASE_URL;
    let cookies = "";

    for (let page = 1; nextUrl && page <= MAX_PAGES; page += 1) {
      if (page > 1) {
        await sleep(1500 + Math.random() * 800);
      }

      let html: string;
      try {
        const result = await fetchHtmlWithCookies(nextUrl, { referer, cookies });
        cookies = result.cookies;
        html = result.html;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        // Cloudflare blocks server-side requests to paginated pages.
        // Gracefully stop — keep the movies we already fetched from earlier pages.
        if (msg.includes("HTTP 403") || msg.includes("HTTP 429")) {
          console.warn(
            `[letterboxd] Stopped at page ${page} (${msg}). ` +
            `Returning ${movies.length} movies fetched so far.`
          );
          break;
        }

        throw error; // re-throw unexpected errors
      }

      const $ = cheerio.load(html);
      const pageMovies = parseLetterboxdPage($);

      for (const movie of pageMovies) {
        if (seenUrls.has(movie.sourceUrl)) continue;
        seenUrls.add(movie.sourceUrl);
        movies.push(movie);
      }

      const nextHref = $(".pagination a.next, .paginate-nextprev a.next")
        .first()
        .attr("href");

      referer = nextUrl;
      nextUrl = nextHref ? toAbsoluteUrl(LETTERBOXD_BASE_URL, nextHref) : null;
    }

    return movies;
  }
};

function parseLetterboxdPage($: cheerio.CheerioAPI): NormalizedMovie[] {
  const movies: NormalizedMovie[] = [];

  $(".griditem, .poster-container").each((_, element) => {
    const poster = $(element)
      .find("[data-item-name], [data-film-name], [data-target-link]")
      .first();
    const rawTitle =
      poster.attr("data-item-name") ??
      poster.attr("data-film-name") ??
      poster.find("img").attr("alt");
    const fullDisplayName = poster.attr("data-item-full-display-name");
    const filmSlug = poster.attr("data-film-slug");
    const href =
      poster.attr("data-item-link") ??
      poster.attr("data-target-link") ??
      (filmSlug ? `/film/${filmSlug}/` : undefined);

    const title = stripYear(rawTitle);
    const year =
      parseYearFromDisplayName(fullDisplayName) ??
      parseNullableYear(poster.attr("data-film-release-year"));

    if (!title || !href) return;

    movies.push({
      title,
      year,
      rating: parseLetterboxdRating($(element).find(".rating").first().text()),
      watchedDate: null,
      source: "letterboxd",
      sourceUrl: toAbsoluteUrl(LETTERBOXD_BASE_URL, href)
    });
  });

  return movies;
}

function stripYear(value: string | undefined) {
  if (!value) return "";
  return value.replace(/\s+\(\d{4}\)$/, "").trim();
}

function parseYearFromDisplayName(value: string | undefined) {
  if (!value) return null;
  const match = value.match(/\((\d{4})\)\s*$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseLetterboxdRating(value: string) {
  const ratingText = value.trim();
  if (!ratingText) return null;

  let rating = 0;
  for (const character of ratingText) {
    if (character === "★") rating += 1;
    if (character === "½") rating += 0.5;
  }

  return rating > 0 ? rating : null;
}
