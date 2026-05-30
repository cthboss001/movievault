// Randomise between a few realistic Chrome UA strings to reduce bot fingerprinting
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
];

function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export type FetchOptions = {
  /** Referer header — pass the previous page URL for paginated scrapers */
  referer?: string;
  /** Cookies captured from a previous response in the same session */
  cookies?: string;
};

export type FetchResult = {
  html: string;
  /** Cookies from set-cookie response headers — pass to the next request */
  cookies: string;
};

/** Parse Set-Cookie headers into a single Cookie string */
function parseSetCookies(response: Response, existing: string): string {
  // Node's fetch exposes multiple set-cookie headers via getSetCookie() in Node 18+,
  // but we can also iterate headers. We use a Map keyed by cookie name to dedupe.
  const cookieMap = new Map<string, string>();

  // Seed with any existing cookies
  for (const pair of existing.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    cookieMap.set(trimmed.slice(0, eqIdx).trim(), trimmed.slice(eqIdx + 1).trim());
  }

  // Merge new cookies from response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setCookieHeaders: string[] = typeof (response.headers as any).getSetCookie === "function"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (response.headers as any).getSetCookie()
    : [];

  for (const header of setCookieHeaders) {
    // Each header looks like: name=value; Path=/; HttpOnly; ...
    const firstPart = header.split(";")[0].trim();
    const eqIdx = firstPart.indexOf("=");
    if (eqIdx === -1) continue;
    cookieMap.set(firstPart.slice(0, eqIdx).trim(), firstPart.slice(eqIdx + 1).trim());
  }

  return [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function buildHeaders(url: string, options: FetchOptions = {}): Record<string, string> {
  const parsed = new URL(url);
  const isImdb = parsed.hostname.includes("imdb.com");

  const base: Record<string, string> = {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": options.referer ? "same-origin" : "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": randomUserAgent()
  };

  if (options.referer) {
    base["Referer"] = options.referer;
  }

  if (options.cookies) {
    base["Cookie"] = options.cookies;
  }

  if (isImdb) {
    base["DNT"] = "1";
    base["Connection"] = "keep-alive";
  }

  return base;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

export async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch HTML from a URL, returning the HTML and any cookies set by the response.
 * Pass the returned cookies back in subsequent requests to maintain session state.
 */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const result = await fetchHtmlWithCookies(url, options);
  return result.html;
}

export async function fetchHtmlWithCookies(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: buildHeaders(url, options),
        redirect: "follow",
        signal: AbortSignal.timeout(30_000)
      });

      // Capture cookies from this response
      const cookies = parseSetCookies(response, options.cookies ?? "");

      if (response.status === 202) {
        lastError = new Error(
          `IMDb returned HTTP 202 (bot-gated) for ${url}. This usually means the IP address is being rate-limited. The Letterboxd sync can still proceed.`
        );
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
      }

      const html = await response.text();

      if (!html.trim()) {
        throw new Error(`Empty response body from ${url}`);
      }

      return { html, cookies };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const msg = lastError.message;
      // Don't retry on hard blocks
      if (msg.includes("HTTP 404") || msg.includes("HTTP 403")) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts`);
}

export function toAbsoluteUrl(baseUrl: string, href: string) {
  return new URL(href, baseUrl).toString();
}
