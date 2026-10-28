import type { Dataset, DatasetInfo } from "./types";

// "static" builds (GitHub Pages) read the JSON written by backend/export_static.py instead of calling the API.
const STATIC = import.meta.env.MODE === "static";
const UNREACHABLE = STATIC ? "Couldn't load the programme data." : "Can't reach the API. Is the backend running on port 8000?";

async function get<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? UNREACHABLE);
  }
  return res.json();
}

const staticUrl = (name: string) => `${import.meta.env.BASE_URL}data/${encodeURIComponent(name)}.json`;

export const fetchDatasets = (signal: AbortSignal) =>
  get<DatasetInfo[]>(STATIC ? staticUrl("datasets") : "/api/datasets", signal);

export const fetchDataset = (id: string, signal: AbortSignal) =>
  get<Dataset>(STATIC ? staticUrl(id) : `/api/datasets/${encodeURIComponent(id)}`, signal);
