export function normalizeTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return normalizeTitle(value).replace(/\s+/g, "-");
}

export function parseNullableYear(value: string | undefined) {
  if (!value) {
    return null;
  }

  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) ? year : null;
}
