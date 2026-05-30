import * as cheerio from "cheerio";
import { fetchHtml, toAbsoluteUrl } from "@/lib/sync/providers/http";
import type { NormalizedMovie, SyncSourceAdapter } from "@/lib/sync/types";

const IMDB_BASE_URL = "https://www.imdb.com";
const IMDB_RATINGS_URL =
  "https://www.imdb.com/user/p.dpsmlayfts2irmpiigksc4a5ly/ratings/";
const MAX_PAGES = 250;

type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export const imdbProvider: SyncSourceAdapter = {
  source: "imdb",
  async fetchMovies() {
    const movies: NormalizedMovie[] = [];
    const seenUrls = new Set<string>();
    let nextUrl: string | null = IMDB_RATINGS_URL;

    for (let page = 1; nextUrl && page <= MAX_PAGES; page += 1) {
      const html = await fetchHtml(nextUrl);
      const $ = cheerio.load(html);
      const pageMovies = parseImdbPage($);

      for (const movie of pageMovies) {
        if (seenUrls.has(movie.sourceUrl)) {
          continue;
        }

        seenUrls.add(movie.sourceUrl);
        movies.push(movie);
      }

      nextUrl = findNextUrl($, nextUrl);
    }

    return movies;
  }
};

function parseImdbPage($: cheerio.CheerioAPI): NormalizedMovie[] {
  const fromJson = parseNextData($);

  if (fromJson.length > 0) {
    return fromJson;
  }

  const movies: NormalizedMovie[] = [];
  const selectors = [
    "li.ipc-metadata-list-summary-item",
    ".lister-item",
    "[data-testid='title-list-item']"
  ];

  $(selectors.join(",")).each((_, element) => {
    const row = $(element);
    const titleLink = row.find("a[href*='/title/tt']").first();
    const title = titleLink.text().trim() || row.find("h3").text().trim();
    const sourceUrl = titleLink.attr("href");

    if (!title || !sourceUrl) {
      return;
    }

    movies.push({
      title: cleanImdbTitle(title),
      year: parseYear(row.text()),
      rating: parseImdbRating(row.text()),
      watchedDate: parseWatchedDate(row.text()),
      source: "imdb",
      sourceUrl: toAbsoluteUrl(IMDB_BASE_URL, sourceUrl)
    });
  });

  return dedupeByUrl(movies);
}

function parseNextData($: cheerio.CheerioAPI): NormalizedMovie[] {
  const rawJson = $("#__NEXT_DATA__").text();

  if (!rawJson) {
    return [];
  }

  try {
    const json = JSON.parse(rawJson) as JsonValue;
    return extractMoviesFromJson(json);
  } catch {
    return [];
  }
}

function extractMoviesFromJson(value: JsonValue): NormalizedMovie[] {
  const movies: NormalizedMovie[] = [];

  walkJson(value, (node) => {
    const object = node as Record<string, JsonValue>;
    const url = getString(object.url) ?? getString(object.href) ?? getTitleUrl(object);
    const title =
      getString(object.titleText) ??
      getNestedString(object, ["title", "titleText", "text"]) ??
      getNestedString(object, ["titleText", "text"]) ??
      getString(object.originalTitleText);

    if (!url?.includes("/title/tt") || !title) {
      return;
    }

    movies.push({
      title: cleanImdbTitle(title),
      year:
        getNumber(object.releaseYear) ??
        getNestedNumber(object, ["title", "releaseYear", "year"]) ??
        getNestedNumber(object, ["releaseYear", "year"]),
      rating: getNumber(object.userRating) ?? getNestedNumber(object, ["userRating", "value"]),
      watchedDate: null,
      source: "imdb",
      sourceUrl: toAbsoluteUrl(IMDB_BASE_URL, url)
    });
  });

  return dedupeByUrl(movies);
}

function findNextUrl($: cheerio.CheerioAPI, currentUrl: string) {
  const nextHref =
    $("a[aria-label='Next'], a.ipc-see-more__button, a[href*='paginationKey']")
      .filter((_, element) => {
        const text = $(element).text().trim().toLowerCase();
        const href = $(element).attr("href") ?? "";
        return text.includes("next") || href.includes("paginationKey");
      })
      .first()
      .attr("href") ??
    $(".lister-page-next.next-page").first().attr("href");

  if (nextHref) {
    return toAbsoluteUrl(currentUrl, nextHref);
  }

  return null;
}

function walkJson(value: JsonValue, visit: (node: JsonValue) => void) {
  if (!value || typeof value !== "object") {
    return;
  }

  visit(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      walkJson(item, visit);
    }
    return;
  }

  for (const item of Object.values(value)) {
    walkJson(item, visit);
  }
}

function getTitleUrl(object: Record<string, JsonValue>) {
  const id =
    getString(object.id) ??
    getNestedString(object, ["title", "id"]) ??
    getNestedString(object, ["title", "titleId"]);

  return id?.startsWith("tt") ? `/title/${id}/` : null;
}

function getString(value: JsonValue | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return getString(value.text);
  }

  return null;
}

function getNumber(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNestedString(object: Record<string, JsonValue>, path: string[]) {
  const value = getNestedValue(object, path);
  return getString(value);
}

function getNestedNumber(object: Record<string, JsonValue>, path: string[]) {
  const value = getNestedValue(object, path);
  return getNumber(value);
}

function getNestedValue(object: Record<string, JsonValue>, path: string[]) {
  let current: JsonValue | undefined = object;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function cleanImdbTitle(value: string) {
  return value.replace(/^\d+\.\s*/, "").replace(/\s+/g, " ").trim();
}

function parseYear(value: string) {
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function parseImdbRating(value: string) {
  const patterns = [
    /Your rating\s*([0-9]{1,2})/i,
    /Rated\s*([0-9]{1,2})/i,
    /([0-9]{1,2})\/10/
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const rating = match ? Number.parseFloat(match[1]) : null;

    if (rating !== null && rating >= 0 && rating <= 10) {
      return rating / 2;
    }
  }

  return null;
}

function parseWatchedDate(value: string) {
  const match = value.match(/Rated on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

  if (!match) {
    return null;
  }

  const date = new Date(match[1]);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dedupeByUrl(movies: NormalizedMovie[]) {
  const seen = new Set<string>();

  return movies.filter((movie) => {
    if (seen.has(movie.sourceUrl)) {
      return false;
    }

    seen.add(movie.sourceUrl);
    return true;
  });
}
