import type { ReactNode } from "react";
import type { Timing } from "../dates";
import { Icon } from "./Icon";

export function PriorityChip({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">—</span>;
  return (
    <span className={`chip p${value}`} title={`Priority ${value}`}>
      P{value}
    </span>
  );
}

export function RelevanceChip({ value }: { value: string }) {
  const kind = value.startsWith("Direct") ? "direct" : value.startsWith("Adjacent") ? "adjacent" : "other";
  return <span className={`chip relevance ${kind}`}>{value}</span>;
}

export function TimingChip({ timing }: { timing: Timing }) {
  return <span className={`chip timing ${timing.kind}`}>{timing.label}</span>;
}

export function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>
        <Linkified text={value} />
      </dd>
    </div>
  );
}

const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

export function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noreferrer">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function LinkButtons({ links }: { links: [string, string][] }) {
  const byUrl = new Map<string, string[]>();
  for (const [label, url] of links) {
    if (/^https?:\/\//.test(url)) byUrl.set(url, [...(byUrl.get(url) ?? []), label]);
  }
  if (byUrl.size === 0) return null;
  return (
    <div className="links">
      {[...byUrl].map(([url, labels], i) => (
        <a key={url} className={i === 0 ? "button primary" : "button"} href={url} target="_blank" rel="noreferrer">
          {labels.join(" / ")} ↗
        </a>
      ))}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

export function FilterToggle({ open, active, controls, onClick }: { open: boolean; active: number; controls: string; onClick: () => void }) {
  return (
    <button className="filter-toggle" aria-expanded={open} aria-controls={controls} onClick={onClick}>
      Filters
      {active > 0 && <span className="filter-badge" aria-label={`${active} active`}>{active}</span>}
    </button>
  );
}

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="search-wrap"><Icon name="search" /><input
      className="search"
      type="search"
      placeholder="Search programmes…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search programmes"
    /></div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [value: string, label: string][];
}

export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Notes({ notes }: { notes: { label: string; text: string }[] }) {
  if (notes.length === 0) return null;
  return (
    <details className="notes">
      <summary>Notes &amp; legend ({notes.length})</summary>
      <dl>
        {notes.map((n) => (
          <div key={n.label}>
            <dt>{n.label}</dt>
            <dd>
              <Linkified text={n.text} />
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="empty">
      <p>No programmes match your filters.</p>
      <button className="button" onClick={onReset}>
        Clear filters
      </button>
    </div>
  );
}
