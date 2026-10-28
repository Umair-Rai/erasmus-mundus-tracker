import { useMemo, useState } from "react";
import { deadlineSortKey, formatDay, startOfToday, timingOf, type Timing, type TimingKind } from "../dates";
import type { Note, Programme } from "../types";
import { Dialog } from "./Dialog";
import { TrackerDetail } from "./TrackerDetail";
import { EmptyState, Notes, PriorityChip, SearchBox, Select, Toolbar } from "./ui";

type TimingFilter = "all" | TimingKind;
type SortKey = "sheet" | "start" | "deadline" | "priority";

interface Row {
  programme: Programme;
  timing: Timing;
  haystack: string;
}

const TIMING_TABS: [TimingFilter, string][] = [
  ["all", "All"],
  ["open", "Open"],
  ["upcoming", "Opening soon"],
  ["tbd", "Dates TBA"],
  ["closed", "Closed"],
];

const PRIORITY_OPTIONS: [string, string][] = [
  ["all", "All"],
  ["1", "Priority 1"],
  ["2", "Priority 2"],
  ["3", "Priority 3"],
];

const SORT_OPTIONS: [SortKey, string][] = [
  ["sheet", "Spreadsheet order"],
  ["deadline", "Deadline (soonest)"],
  ["start", "Start date (soonest)"],
  ["priority", "Priority"],
];

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
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [timing, setTiming] = useState<TimingFilter>("all");
  const [windowOnly, setWindowOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("sheet");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      })),
    [items, today],
  );

  const counts = useMemo(() => {
    const result: Record<TimingFilter, number> = { all: rows.length, open: 0, upcoming: 0, tbd: 0, closed: 0 };
    for (const row of rows) result[row.timing.kind]++;
    return result;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = rows.filter(
      (r) =>
        (!q || r.haystack.includes(q)) &&
        (priority === "all" || String(r.programme.priority) === priority) &&
        (timing === "all" || r.timing.kind === timing) &&
        (!windowOnly || r.programme.in_window),
    );
    if (sort === "deadline") {
      result.sort((a, b) =>
        deadlineSortKey(a.programme, a.timing).localeCompare(deadlineSortKey(b.programme, b.timing)),
      );
    } else if (sort === "priority") {
      result.sort((a, b) => (a.programme.priority ?? 9) - (b.programme.priority ?? 9));
    } else if (sort === "start") {
      result.sort((a, b) => (a.programme.opens_on ?? "9999-12-31").localeCompare(b.programme.opens_on ?? "9999-12-31"));
    }
    return result;
  }, [rows, query, priority, timing, windowOnly, sort]);

  const hasWindow = items.some((p) => p.in_window);
  const selected = rows.find((r) => r.programme.id === selectedId);

  const reset = () => {
    setQuery("");
    setPriority("all");
    setTiming("all");
    setWindowOnly(false);
    setSort("sheet");
  };

  return (
    <>
      <div className="segmented" role="group" aria-label="Filter by status">
        {TIMING_TABS.map(([key, label]) => (
          <button key={key} aria-pressed={timing === key} onClick={() => setTiming(key)}>
            {label} <span>{counts[key]}</span>
          </button>
        ))}
      </div>

      <Toolbar>
        <SearchBox value={query} onChange={setQuery} />
        <Select label="Priority" value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
        <Select label="Sort by" value={sort} onChange={(v) => setSort(v as SortKey)} options={SORT_OPTIONS} />
        {hasWindow && (
          <label className="toggle">
            <input type="checkbox" checked={windowOnly} onChange={(e) => setWindowOnly(e.target.checked)} />
            Oct 28 – Dec 31 window
          </label>
        )}
      </Toolbar>

      <div className="results-bar"><p className="count" role="status">{visible.length} of {rows.length} programmes</p><button className="text-button" onClick={reset} disabled={!query && priority === "all" && timing === "all" && !windowOnly && sort === "sheet"}>Reset filters</button></div>

      {visible.length === 0 ? (
        <EmptyState onReset={reset} />
      ) : (
        <ul className="list tracker">
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
            return (
              <li key={p.id}>
                <button className="row" onClick={() => setSelectedId(p.id)}>
                  <span className="cell name">
                    <strong>{p.acronym ?? p.title}</strong>
                    {p.acronym && <span className="muted">{p.title}</span>}
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
