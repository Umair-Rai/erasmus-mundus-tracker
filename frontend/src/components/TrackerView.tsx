import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { deadlineSortKey, formatDay, startOfToday, timingOf, type Timing, type TimingKind } from "../dates";
import { countriesOf, feeBand, ieltsBand, moiVerdict, pakistanVerdict, type FeeBand, type Verdict } from "../facets";
import type { Note, Programme } from "../types";
import { STATUSES, STATUS_LABELS, trackerKey, useWishlist } from "../wishlist";
import { WishlistStar } from "./Account";
import { Dialog } from "./Dialog";
import { TrackerDetail } from "./TrackerDetail";
import { EmptyState, FilterToggle, Notes, PriorityChip, SearchBox, Select, Toolbar } from "./ui";

type TimingFilter = "all" | TimingKind;
type SortKey = "sheet" | "start" | "deadline" | "priority";

interface Row {
  programme: Programme;
  timing: Timing;
  haystack: string;
  pakistan: Exclude<Verdict, "unknown">;
  moi: Verdict;
  ielts: number | null;
  feeBand: FeeBand;
  countries: string[];
}

const ALL = "all";
const NO_ROUTE = "none";

const TIMING_TABS: [TimingFilter, string][] = [
  ["all", "All"],
  ["open", "Open"],
  ["upcoming", "Opening soon"],
  ["tbd", "Dates TBA"],
  ["closed", "Closed"],
];

const SORT_OPTIONS: [SortKey, string][] = [
  ["sheet", "Spreadsheet order"],
  ["deadline", "Deadline (soonest)"],
  ["start", "Start date (soonest)"],
  ["priority", "Priority"],
];

const MATCHERS = {
  priority: (v: string, r: Row) => String(r.programme.priority) === v,
  pakistan: (v: string, r: Row) => r.pakistan === v,
  moi: (v: string, r: Row) => r.moi === v,
  ielts: (v: string, r: Row) => (v === "unknown" ? r.ielts === null : r.ielts !== null && (v === "known" || r.ielts <= Number(v))),
  fee: (v: string, r: Row) => r.feeBand === v,
  country: (v: string, r: Row) => (v === NO_ROUTE ? r.countries.length === 0 : r.countries.includes(v)),
};
type FilterKey = keyof typeof MATCHERS;
const FILTER_KEYS = Object.keys(MATCHERS) as FilterKey[];

const FILTER_FIELDS: { key: Exclude<FilterKey, "country">; label: string; options: [string, string][] }[] = [
  { key: "pakistan", label: "Pakistan eligible", options: [["yes", "Yes"], ["verify", "Verify"], ["no", "No"]] },
  { key: "moi", label: "MOI accepted", options: [["yes", "Accepted"], ["verify", "Case by case"], ["no", "Not accepted"], ["unknown", "Not verified"]] },
  { key: "ielts", label: "IELTS needed", options: [["6.0", "Up to 6.0"], ["6.5", "Up to 6.5"], ["known", "Any published band"], ["unknown", "Not published"]] },
  { key: "fee", label: "Tuition fee", options: [["free", "No tuition"], ["low", "Up to €5,000 / yr"], ["mid", "€5,001–9,000 / yr"], ["high", "Over €9,000 / yr"], ["unknown", "Not published"]] },
  { key: "priority", label: "Priority", options: [["1", "Priority 1"], ["2", "Priority 2"], ["3", "Priority 3"]] },
];

interface Filters extends Record<FilterKey, string> {
  query: string;
  timing: TimingFilter;
  windowOnly: boolean;
  sort: SortKey;
  mine: string;
  mineStatus: string;
}

const DEFAULTS: Filters = {
  query: "",
  timing: ALL,
  windowOnly: false,
  sort: "sheet",
  mine: ALL,
  mineStatus: ALL,
  priority: ALL,
  pakistan: ALL,
  moi: ALL,
  ielts: ALL,
  fee: ALL,
  country: ALL,
};

const REQUIREMENT_COLUMNS: { key: "ielts" | "moi" | "gre" | "stipend" | "pakistan_eligible"; label: string; className: string }[] = [
  { key: "ielts", label: "IELTS", className: "col-ielts" },
  { key: "moi", label: "MOI accepted", className: "col-moi" },
  { key: "gre", label: "GRE", className: "col-gre" },
  { key: "pakistan_eligible", label: "Pakistan eligible", className: "col-pakistan" },
  { key: "stipend", label: "Stipend", className: "col-stipend" },
];

function deadlineCell({ programme: p, timing }: Row) {
  const main = p.deadline_on ? formatDay(p.deadline_on) : p.deadline || "—";
  let sub = timing.label;
  if (timing.kind === "tbd") sub = "Dates to be confirmed";
  return { main, sub };
}

export function TrackerView({ items, notes }: { items: Programme[]; notes: Note[] }) {
  const today = useMemo(startOfToday, []);
  const [filters, setFilters] = useState(DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(() => window.matchMedia("(min-width: 721px)").matches);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { enabled: accountsEnabled, user } = useAuth();
  const { entries: mine } = useWishlist();

  useEffect(() => {
    if (!user) setFilters((f) => (f.mine === ALL && f.mineStatus === ALL ? f : { ...f, mine: ALL, mineStatus: ALL }));
  }, [user]);

  const set =<K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const rows = useMemo<Row[]>(
    () =>
      items.map((programme) => ({
        programme,
        timing: timingOf(programme, today),
        haystack: [
          programme.acronym,
          programme.title,
          programme.countries,
          programme.call_status,
          programme.stipend,
          programme.fee,
          programme.fee_note,
          programme.ielts,
          programme.moi,
          programme.gre,
          programme.pakistan_eligible,
          ...programme.suggestions,
        ]
          .join(" ")
          .toLowerCase(),
        pakistan: pakistanVerdict(programme.pakistan_eligible),
        moi: moiVerdict(programme.moi),
        ielts: ieltsBand(programme.ielts),
        feeBand: feeBand(programme),
        countries: countriesOf(programme.countries),
      })),
    [items, today],
  );

  const counts = useMemo(() => {
    const result: Record<TimingFilter, number> = { all: rows.length, open: 0, upcoming: 0, tbd: 0, closed: 0 };
    for (const row of rows) result[row.timing.kind]++;
    return result;
  }, [rows]);

  const fields = useMemo(() => {
    const withCounts = (key: FilterKey, options: [string, string][]): [string, string][] => [
      [ALL, "Any"],
      ...options.map(([value, label]): [string, string] => [value, `${label} (${rows.filter((r) => MATCHERS[key](value, r)).length})`]),
    ];
    const countryNames = [...new Set(rows.flatMap((r) => r.countries))].sort();
    const countryOptions: [string, string][] = countryNames.map((c) => [c, c]);
    if (rows.some((r) => r.countries.length === 0)) countryOptions.push([NO_ROUTE, "Route not published"]);
    return [
      ...FILTER_FIELDS.map((f) => ({ key: f.key as FilterKey, label: f.label, options: withCounts(f.key, f.options) })),
      { key: "country" as FilterKey, label: "Study in", options: withCounts("country", countryOptions) },
    ];
  }, [rows]);

  const mineFields = useMemo<[string, string, [string, string][]][]>(() => {
    const saved = rows.filter((r) => mine[trackerKey(r.programme)]).length;
    const inStatus = (s: string) => rows.filter((r) => mine[trackerKey(r.programme)]?.status === s).length;
    return [
      ["mine", "My list", [[ALL, "Any"], ["saved", `Saved (${saved})`], ["unsaved", `Not saved (${rows.length - saved})`]]],
      ["mineStatus", "My status", [[ALL, "Any"], ...STATUSES.map((s): [string, string] => [s, `${STATUS_LABELS[s]} (${inStatus(s)})`])]],
    ];
  }, [rows, mine]);

  const visible = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const result = rows.filter((r) => {
      const entry = mine[trackerKey(r.programme)];
      return (
        (!q || r.haystack.includes(q)) &&
        (filters.timing === ALL || r.timing.kind === filters.timing) &&
        (!filters.windowOnly || r.programme.in_window) &&
        FILTER_KEYS.every((k) => filters[k] === ALL || MATCHERS[k](filters[k], r)) &&
        (filters.mine === ALL || (filters.mine === "saved") === Boolean(entry)) &&
        (filters.mineStatus === ALL || entry?.status === filters.mineStatus)
      );
    });
    if (filters.sort === "deadline") {
      result.sort((a, b) =>
        deadlineSortKey(a.programme, a.timing).localeCompare(deadlineSortKey(b.programme, b.timing)),
      );
    } else if (filters.sort === "priority") {
      result.sort((a, b) => (a.programme.priority ?? 9) - (b.programme.priority ?? 9));
    } else if (filters.sort === "start") {
      result.sort((a, b) => (a.programme.opens_on ?? "9999-12-31").localeCompare(b.programme.opens_on ?? "9999-12-31"));
    }
    return result;
  }, [rows, filters, mine]);

  const hasWindow = items.some((p) => p.in_window);
  const selected = rows.find((r) => r.programme.id === selectedId);
  const activeFilters =
    FILTER_KEYS.filter((k) => filters[k] !== ALL).length +
    (filters.windowOnly ? 1 : 0) +
    (filters.mine !== ALL ? 1 : 0) +
    (filters.mineStatus !== ALL ? 1 : 0);
  const dirty = (Object.keys(DEFAULTS) as (keyof Filters)[]).some((k) => filters[k] !== DEFAULTS[k]);
  const reset = () => setFilters(DEFAULTS);

  return (
    <>
      <div className="segmented" role="group" aria-label="Filter by status">
        {TIMING_TABS.map(([key, label]) => (
          <button key={key} aria-pressed={filters.timing === key} onClick={() => set("timing", key)}>
            {label} <span>{counts[key]}</span>
          </button>
        ))}
      </div>

      <Toolbar>
        <SearchBox value={filters.query} onChange={(v) => set("query", v)} />
        <Select label="Sort by" value={filters.sort} onChange={(v) => set("sort", v as SortKey)} options={SORT_OPTIONS} />
        <FilterToggle open={panelOpen} active={activeFilters} controls="filters-panel" onClick={() => setPanelOpen((o) => !o)} />
      </Toolbar>

      {panelOpen && (
        <div className="filters-panel" id="filters-panel">
          <div className="filters-grid">
            {user && mineFields.map(([key, label, options]) => (
              <Select key={key} label={label} value={filters[key as "mine" | "mineStatus"]} onChange={(v) => set(key as "mine" | "mineStatus", v)} options={options} />
            ))}
            {fields.map((f) => (
              <Select key={f.key} label={f.label} value={filters[f.key]} onChange={(v) => set(f.key, v)} options={f.options} />
            ))}
          </div>
          {hasWindow && (
            <label className="toggle">
              <input type="checkbox" checked={filters.windowOnly} onChange={(e) => set("windowOnly", e.target.checked)} />
              Oct 28 – Dec 31 window
            </label>
          )}
        </div>
      )}

      <div className="results-bar"><p className="count" role="status">{visible.length} of {rows.length} programmes</p><button className="text-button" onClick={reset} disabled={!dirty}>Reset filters</button></div>

      {visible.length === 0 ? (
        <EmptyState onReset={reset} />
      ) : (
        <ul className={`list tracker${accountsEnabled ? " has-stars" : ""}`}>
          <li className="head" aria-hidden="true">
            <span>Programme</span>
            <span>Countries</span>
            <span>Opens</span>
            <span>Deadline</span>
            {REQUIREMENT_COLUMNS.map((c) => <span key={c.key} className={c.className}>{c.label}</span>)}
            <span>Tuition fee</span>
            <span>Priority</span>
          </li>
          {visible.map((row) => {
            const p = row.programme;
            const { main, sub } = deadlineCell(row);
            const entry = mine[trackerKey(p)];
            return (
              <li key={p.id}>
                <WishlistStar itemKey={trackerKey(p)} name={p.acronym ?? p.title} />
                <button className="row" onClick={() => setSelectedId(p.id)}>
                  <span className="cell name">
                    <strong>{p.acronym ?? p.title}</strong>
                    {p.acronym && <span className="muted">{p.title}</span>}
                    {entry && <span className={`chip mine status-${entry.status}`}>{STATUS_LABELS[entry.status]}</span>}
                  </span>
                  <span className="cell countries clamp" title={p.countries}><span className="mobile-label">Countries</span>{p.countries || "To be confirmed"}</span>
                  <span className="cell start-date" title={p.opens || "Start date to be announced"}>
                    <span className="mobile-label">Opens</span>
                    <strong>{p.opens_on ? formatDay(p.opens_on) : p.opens || "To be announced"}</strong>
                  </span>
                  <span className="cell deadline" title={p.deadline}>
                    <span className="mobile-label">Deadline</span>
                    <strong>{main}</strong>
                    <span className={`sub ${row.timing.kind}`}>{sub}</span>
                  </span>
                  {REQUIREMENT_COLUMNS.map((c) => (
                    <span key={c.key} className={`cell requirement clamp ${c.className}`} title={p[c.key]}>
                      <span className="mobile-label">{c.label}</span>
                      {p[c.key] || "—"}
                    </span>
                  ))}
                  <span className={`cell fee fee-${p.fee_status || "none"}`} title={p.fee_detail}>
                    <span className="mobile-label">Tuition fee</span>
                    <strong>{p.fee || "—"}</strong>
                    {p.fee_note && <span className="sub">{p.fee_note}</span>}
                    {p.fee_status === "unverified" && <span className="flag">unverified</span>}
                  </span>
                  <span className="cell prio">
                    <PriorityChip value={p.priority} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Notes notes={notes} />

      {selected && (
        <Dialog label={selected.programme.acronym ?? selected.programme.title} onClose={() => setSelectedId(null)}>
          <TrackerDetail programme={selected.programme} timing={selected.timing} />
        </Dialog>
      )}
    </>
  );
}
