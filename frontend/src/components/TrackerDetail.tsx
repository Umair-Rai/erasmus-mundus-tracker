import type { Timing } from "../dates";
import { formatDay } from "../dates";
import type { Programme } from "../types";
import { Fact, LinkButtons, Linkified, PriorityChip, TimingChip } from "./ui";

const FEE_STATUS_LABEL = {
  published: "From the programme's pages",
  unverified: "Unverified: confirm on the programme site",
  not_found: "No fee published",
} as const;

function FeeBlock({ programme: p }: { programme: Programme }) {
  if (!p.fee) return null;
  return (
    <section className={`fee-block fee-${p.fee_status || "none"}`}>
      <div className="fee-head">
        <h3>Tuition fee</h3>
        {p.fee_status && <span className="flag">{FEE_STATUS_LABEL[p.fee_status]}</span>}
      </div>
      <p className="fee-amount">
        {p.fee}
        {p.fee_note && <span>{p.fee_note}</span>}
      </p>
      <p>{p.fee_detail}</p>
      {p.fee_source && (
        <p className="fee-meta">
          <a href={p.fee_source} target="_blank" rel="noreferrer">Source ↗</a>
          {p.fee_checked && <> · checked {formatDay(p.fee_checked)}</>}
        </p>
      )}
    </section>
  );
}

function dateText(raw: string, iso: string | null) {
  return iso ? raw.replace(iso, formatDay(iso)) : raw;
}

export function TrackerDetail({ programme: p, timing }: { programme: Programme; timing: Timing }) {
  return (
    <div className="detail">
      <header>
        <h2>{p.acronym ?? p.title}</h2>
        {p.acronym && <p className="subtitle">{p.title}</p>}
        <div className="chips">
          <PriorityChip value={p.priority} />
          <TimingChip timing={timing} />
        </div>
        {p.call_status && <p className="status">{p.call_status}</p>}
      </header>

      {p.alerts.map((a) => (
        <div className="alert" key={a.label}>
          <strong>{a.label}</strong>
          <p>
            <Linkified text={a.text} />
          </p>
        </div>
      ))}

      <LinkButtons
        links={[
          ["Apply", p.apply_url],
          ["Admission info", p.admission_url],
          ["Official source", p.source_url],
        ]}
      />

      <FeeBlock programme={p} />

      <dl className="facts">
        <Fact label="Countries / mobility" value={p.countries} />
        <Fact label="Start Date · Applications open" value={dateText(p.opens, p.opens_on) || "To be announced"} />
        <Fact label="Deadline" value={dateText(p.deadline, p.deadline_on)} />
        <Fact label="Stipend / funding" value={p.stipend} />
        <Fact label="IELTS" value={p.ielts} />
        <Fact label="MOI accepted" value={p.moi} />
        <Fact label="GRE" value={p.gre} />
        <Fact label="Pakistan eligible" value={p.pakistan_eligible} />
        <Fact label="Admission type" value={p.admission_type} />
      </dl>

      {p.suggestions.length > 0 && (
        <section>
          <h3>Suggestions</h3>
          <ul>
            {p.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
