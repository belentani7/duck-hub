/** Encode catalog data before interpolation into HTML markup. */
const htmlEntities: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

export function safeCents(value: unknown): number {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : 0;
}

export function safeBpm(value: unknown): string {
  const bpm = Number(value);
  return Number.isInteger(bpm) && bpm >= 1 && bpm <= 300 ? String(bpm) : "—";
}

export function catalogDetailsUrl(base: string, title: string): string {
  const prefix = base.endsWith("/") ? base : base + "/";
  return prefix + "catalog/?beat=" + encodeURIComponent(title);
}
