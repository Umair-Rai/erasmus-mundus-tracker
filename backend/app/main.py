from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from .loader import SOURCES, DataError, Source, find_source, get_dataset
from .models import CatalogueDataset, DatasetInfo, TrackerDataset

app = FastAPI(title="Erasmus Mundus Tracker")

FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def _load(source: Source) -> TrackerDataset | CatalogueDataset:
    try:
        return get_dataset(source)
    except DataError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/datasets")
def list_datasets() -> list[DatasetInfo]:
    return [
        DatasetInfo(id=s.id, label=s.label, kind=s.kind, count=len(_load(s).items))
        for s in SOURCES
    ]


@app.get("/api/datasets/{dataset_id}")
def read_dataset(dataset_id: str) -> TrackerDataset | CatalogueDataset:
    source = find_source(dataset_id)
    if source is None:
        raise HTTPException(status_code=404, detail=f"Unknown dataset '{dataset_id}'")
    return _load(source)


if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
