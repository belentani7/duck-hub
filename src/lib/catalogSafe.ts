/** Encode catalog data before interpolation into HTML markup. */
const htmlEntities: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

export function parseCents(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export function catalogLicenseState(availability: unknown, nonExclusivePrice: unknown, exclusivePrice: unknown) {
  const nonExclusiveCents = parseCents(nonExclusivePrice);
  const exclusiveCents = parseCents(exclusivePrice);
  const initialLicense = nonExclusiveCents !== null
    ? "non_exclusive"
    : exclusiveCents !== null ? "exclusive" : null;
  return {
    nonExclusiveCents,
    exclusiveCents,
    initialLicense,
    canBuy: availability === "available" && initialLicense !== null,
  };
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
