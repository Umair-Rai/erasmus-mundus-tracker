import { useEffect, useState } from "react";
import { fetchDataset, fetchDatasets } from "./api";
import { CatalogueView } from "./components/CatalogueView";
import { AccountMenu } from "./components/Account";
import { ThemeToggle } from "./components/ThemeToggle";
import { TrackerView } from "./components/TrackerView";
import { useAsync } from "./useAsync";

function DatasetView({ id }: { id: string }) {
  const { data, error, loading } = useAsync((signal) => fetchDataset(id, signal), [id]);

  if (loading) return <div className="state" role="status"><span className="loader" />Loading programmes…</div>;
  if (error || !data) return <p className="state error" role="alert">{error || "Unable to load this collection."}</p>;
  return data.kind === "tracker" ? (
    <TrackerView items={data.items} notes={data.notes} />
  ) : (
    <CatalogueView items={data.items} />
  );
}

const descriptions: Record<string, string> = {
  direct: "Computer science and AI programmes, with application dates.",
  adjacent: "Programmes where computing meets other disciplines.",
  catalogue: "The full Erasmus Mundus programme catalogue.",
};

export default function App() {
  const datasets = useAsync(fetchDatasets, []);
  const [hash, setHash] = useState(() => window.location.hash.slice(1));

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const tabs = datasets.data ?? [];
  const activeId = tabs.find((t) => t.id === hash)?.id ?? tabs[0]?.id;
  const active = tabs.find((t) => t.id === activeId);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to programmes</a>
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="brand" href="#direct">Mundus</a>
          <nav className="tabs" aria-label="Programme collections">
            {tabs.map((t) => <a key={t.id} href={`#${t.id}`} aria-current={t.id === activeId ? "page" : undefined}>{t.label}<span className="count-pill">{t.count}</span></a>)}
          </nav>
          <div className="nav-actions">
            <AccountMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main-content" className="wrap container" tabIndex={-1}>
        <h1>{active?.label ?? "Programmes"}</h1>
        <p className="lede">{descriptions[activeId ?? "direct"]}</p>
        {datasets.loading && <div className="state" role="status"><span className="loader" />Connecting to your collections…</div>}
        {datasets.error && <p className="state error" role="alert">{datasets.error}</p>}
        {activeId && <DatasetView key={activeId} id={activeId} />}
      </main>
      <footer className="wrap footer">Mundus · Erasmus Mundus 2027 intake</footer>
    </>
  );
}
