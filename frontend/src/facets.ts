import type { Programme } from "./types";

export type Verdict = "yes" | "no" | "verify" | "unknown";
export type FeeBand = "free" | "low" | "mid" | "high" | "unknown";

export function pakistanVerdict(text: string): Exclude<Verdict, "unknown"> {
  const t = text.trim();
  if (/^no\b/i.test(t) && !/nationality not restriction/i.test(t)) return "no";
  if (/^yes\b/i.test(t) && !/in principle/i.test(t)) return "yes";
  return "verify";
}

export function moiVerdict(text: string): Verdict {
  const t = text.trim();
  if (/^yes\b/i.test(t)) return "yes";
  if (/^no\b/i.test(t) || /alone not sufficient|not enough/i.test(t)) return "no";
  if (!t || /^(—|-|tba|not (verified|confirmed)( for \d{4})?)$/i.test(t)) return "unknown";
  return "verify";
}

const STALE_OR_UNSURE = /older|prior|historical|verify|tba|not (verified|published)|unverified/i;

export function ieltsBand(text: string): number | null {
  if (STALE_OR_UNSURE.test(text)) return null;
  const band = text.match(/\b([5-8](?:\.[05])?)\b/);
  return band && /ielts|overall|academic|b2/i.test(text) ? Number(band[1]) : null;
}

export function feeBand({ fee_year_eur: yearly }: Programme): FeeBand {
  if (yearly === null || yearly === undefined) return "unknown";
  if (yearly === 0) return "free";
  if (yearly <= 5000) return "low";
  return yearly <= 9000 ? "mid" : "high";
}

const SINGLE_WORD_COUNTRIES = new Set([
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France",
  "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Israel", "Italy", "Latvia", "Lithuania", "Luxembourg",
  "Malta", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
  "Switzerland", "Turkey", "Serbia", "Montenegro", "Albania", "Kenya", "Japan", "Canada", "Brazil", "Taiwan",
  "Lebanon", "Morocco",
]); // fmt: skip
const MULTI_WORD_COUNTRIES = ["United Kingdom", "North Macedonia"];

export function countriesOf(text: string): string[] {
  const found = new Set(MULTI_WORD_COUNTRIES.filter((name) => text.includes(name)));
  for (const word of text.split(/[^A-Za-z]+/)) if (SINGLE_WORD_COUNTRIES.has(word)) found.add(word);
  return [...found];
}
