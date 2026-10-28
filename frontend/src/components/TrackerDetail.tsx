import type { Timing } from "../dates";
import { formatDay } from "../dates";
import type { Programme } from "../types";
import { Fact, LinkButtons, Linkified, PriorityChip, TimingChip } from "./ui";

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
