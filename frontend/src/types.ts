export interface Note {
  label: string;
  text: string;
}

export interface Programme {
  id: string;
  acronym: string | null;
  title: string;
  countries: string;
  priority: number | null;
  opens: string;
  opens_on: string | null;
  deadline: string;
  deadline_on: string | null;
  admission_type: string;
  stipend: string;
  ielts: string;
  moi: string;
  gre: string;
  pakistan_eligible: string;
  admission_url: string;
  apply_url: string;
  suggestions: string[];
  call_status: string;
  source_url: string;
  in_window: boolean;
  alerts: Note[];
}

export interface CatalogueEntry {
  id: string;
  acronym: string | null;
  title: string;
  subject: string;
  relevance: string;
  cycle: string;
  application_status: string;
  scholarship_status: string;
  deadline: string;
  duration: string;
  countries: string;
  language: string;
  eligibility: string;
  funding: string;
  website_url: string;
  project_url: string;
  catalogue_url: string;
  checked_on: string;
  notes: string[];
}

export interface DatasetInfo {
  id: string;
  label: string;
  kind: "tracker" | "catalogue";
  count: number;
}

export type Dataset =
  | { id: string; label: string; kind: "tracker"; notes: Note[]; items: Programme[] }
  | { id: string; label: string; kind: "catalogue"; notes: Note[]; items: CatalogueEntry[] };
