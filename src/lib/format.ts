export function money(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(n % 1e9 ? 1 : 0) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
}

const CAT_COVER: Record<string, string> = {
  fintech: "1533234944761-2f5337579079",
  healthcare: "1519494026892-80bbd2d6fd0d",
};

export function heroImageUrl(heroImageId: string | null | undefined, verticalSlug: string): string {
  const id = heroImageId || CAT_COVER[verticalSlug] || CAT_COVER.fintech;
  return `https://images.unsplash.com/photo-${id}?w=1600&q=70&auto=format&fit=crop`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

// Compact relative-time string, e.g. "3 days ago" / "just now" / "2 months ago".
export function timeAgo(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);

  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 45) return plural(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return plural(hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return plural(days, "day");
  const months = Math.round(days / 30);
  if (months < 12) return plural(months, "month");
  const years = Math.round(days / 365);
  return plural(years, "year");
}
