const DEFAULT_HEADERS = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 MovieVault/0.2"
};

export async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    redirect: "follow"
  });

  if (!response.ok || response.status === 202) {
    throw new Error(`Fetch failed for ${url} with status ${response.status}.`);
  }

  const html = await response.text();

  if (!html.trim()) {
    throw new Error(`Fetch returned an empty response for ${url}.`);
  }

  return html;
}

export function toAbsoluteUrl(baseUrl: string, href: string) {
  return new URL(href, baseUrl).toString();
}
