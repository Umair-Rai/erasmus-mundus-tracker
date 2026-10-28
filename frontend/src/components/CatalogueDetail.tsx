import type { CatalogueEntry } from "../types";
import { Fact, LinkButtons, Linkified, RelevanceChip } from "./ui";

const PLACEHOLDER = /^check programme site/i;
const real = (value: string) => (PLACEHOLDER.test(value) ? "" : value);

export function CatalogueDetail({ entry: e }: { entry: CatalogueEntry }) {
  return (
    <div className="detail">
      <header>
        <h2>{e.acronym ?? e.title}</h2>
        {e.acronym && <p className="subtitle">{e.title}</p>}
        <div className="chips">
          <RelevanceChip value={e.relevance} />
          <span className="chip neutral">{e.cycle}</span>
        </div>
      </header>

      <LinkButtons
        links={[
          ["Programme website", e.website_url],
          ["EU project record", e.project_url],
          ["EU catalogue", e.catalogue_url],
        ]}
      />

      <dl className="facts">
        <Fact label="Subject area" value={e.subject} />
        <Fact label="Countries" value={real(e.countries)} />
        <Fact label="2027 application" value={e.application_status} />
        <Fact label="2027 scholarship" value={e.scholarship_status} />
        <Fact label="Deadline" value={e.deadline} />
        <Fact label="Funding" value={e.funding} />
        <Fact label="Eligibility" value={real(e.eligibility)} />
        <Fact label="Duration / ECTS" value={real(e.duration)} />
        <Fact label="Language" value={real(e.language)} />
        <Fact label="Checked on" value={e.checked_on} />
      </dl>

      {e.notes.length > 0 && (
        <section>
          <h3>Notes</h3>
          <ul>
            {e.notes.map((n) => (
              <li key={n}>
                <Linkified text={n} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
