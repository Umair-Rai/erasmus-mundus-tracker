import type { Programme } from "./types";

const MS_PER_DAY = 86_400_000;

export type TimingKind = "open" | "upcoming" | "closed" | "tbd";

export interface Timing {
  kind: TimingKind;
  label: string;
}

const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function parseDay(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export const formatDay = (iso: string) => formatter.format(parseDay(iso));

const daysBetween = (later: Date, earlier: Date) => Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

export function timingOf(p: Programme, today: Date): Timing {
  const opens = p.opens_on ? parseDay(p.opens_on) : null;
  const deadline = p.deadline_on ? parseDay(p.deadline_on) : null;

  if (deadline && today > deadline) return { kind: "closed", label: "Closed" };

  if (opens && today < opens) {
    const days = daysBetween(opens, today);
    return { kind: "upcoming", label: days === 1 ? "Opens tomorrow" : `Opens in ${plural(days, "day")}` };
  }

  if (deadline) {
    const days = daysBetween(deadline, today);
    return { kind: "open", label: days === 0 ? "Open · last day" : `Open · ${plural(days, "day")} left` };
  }

  if (opens) return { kind: "open", label: "Open · deadline TBA" };

  return { kind: "tbd", label: "Dates TBA" };
}

export function deadlineSortKey(p: Programme, timing: Timing): string {
  if (timing.kind === "closed") return "9999-12-31";
  return p.deadline_on ?? "9999-12-30";
}
