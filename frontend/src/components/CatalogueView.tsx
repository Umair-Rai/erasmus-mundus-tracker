import { useMemo, useState } from "react";
import type { CatalogueEntry } from "../types";
import { CatalogueDetail } from "./CatalogueDetail";
import { Dialog } from "./Dialog";
import { EmptyState, RelevanceChip, SearchBox, Select, Toolbar } from "./ui";

const ALL = "all";

const unique = (values: string[]): [string, string][] => [
  [ALL, "All"],
  ...[...new Set(values.filter(Boolean))].sort().map((v): [string, string] => [v, v]),
];

export function CatalogueView({ items }: { items: CatalogueEntry[] }) {
  const [query, setQuery] = useState("");
  const [relevance, setRelevance] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [cycle, setCycle] = useState(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(
    () => items.map((entry) => ({ entry, haystack: [entry.acronym, entry.title, entry.subject, entry.countries].join(" ").toLowerCase() })),
    [items],
  );

  const options = useMemo(
    () => ({
      relevance: unique(items.map((e) => e.relevance)),
      subject: unique(items.map((e) => e.subject)),
      cycle: unique(items.map((e) => e.cycle)),
    }),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(
        ({ entry: e, haystack }) =>
          (!q || haystack.includes(q)) &&
          (relevance === ALL || e.relevance === relevance) &&
          (subject === ALL || e.subject === subject) &&
          (cycle === ALL || e.cycle === cycle),
      )
      .map((r) => r.entry);
  }, [rows, query, relevance, subject, cycle]);

  const selected = items.find((e) => e.id === selectedId);

  const reset = () => {
    setQuery("");
    setRelevance(ALL);
    setSubject(ALL);
    setCycle(ALL);
  };

  return (
    <>
      <Toolbar>
        <SearchBox value={query} onChange={setQuery} />
        <Select label="Relevance" value={relevance} onChange={setRelevance} options={options.relevance} />
        <Select label="Subject" value={subject} onChange={setSubject} options={options.subject} />
        <Select label="Source" value={cycle} onChange={setCycle} options={options.cycle} />
      </Toolbar>

      <div className="results-bar"><p className="count" role="status">{visible.length} of {items.length} programmes</p><button className="text-button" onClick={reset} disabled={!query && relevance === ALL && subject === ALL && cycle === ALL}>Reset filters</button></div>

      {visible.length === 0 ? (
        <EmptyState onReset={reset} />
      ) : (
        <ul className="list catalogue">
          <li className="head" aria-hidden="true">
            <span>Programme</span>
            <span className="col-countries">Countries</span>
            <span>Subject area</span>
            <span>Relevance</span>
            <span className="col-deadline">Deadline</span>
            <span>Source</span>
          </li>
          {visible.map((e) => (
            <li key={e.id}>
              <button className="row" onClick={() => setSelectedId(e.id)}>
                <span className="cell name">
                  <strong>{e.acronym ?? e.title}</strong>
                  {e.acronym && <span className="muted">{e.title}</span>}
                </span>
                <span className="cell requirement clamp col-countries" title={e.countries}>{e.countries || "—"}</span>
                <span className="cell subject clamp">{e.subject}</span>
                <span className="cell relevance">
                  <RelevanceChip value={e.relevance} />
                </span>
                <span className="cell requirement clamp col-deadline" title={e.deadline}>{e.deadline || "—"}</span>
                <span className="cell cycle clamp">{e.cycle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <Dialog label={selected.acronym ?? selected.title} onClose={() => setSelectedId(null)}>
          <CatalogueDetail entry={selected} />
        </Dialog>
      )}
    </>
  );
}
