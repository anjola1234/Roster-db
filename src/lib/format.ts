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
