"""Write every dataset as static JSON so the frontend can be hosted without the API (e.g. GitHub Pages).

Run from this folder:  .venv\\Scripts\\python export_static.py
"""

from pathlib import Path

from app.loader import SOURCES, get_dataset
from app.models import DatasetInfo

OUT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "data"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    infos = []
    for source in SOURCES:
        dataset = get_dataset(source)
        (OUT / f"{source.id}.json").write_text(dataset.model_dump_json(indent=2), encoding="utf-8")
        infos.append(DatasetInfo(id=source.id, label=source.label, kind=source.kind, count=len(dataset.items)))
        print(f"{source.id}: {len(dataset.items)} items")

    listing = "[" + ",\n".join(info.model_dump_json() for info in infos) + "]"
    (OUT / "datasets.json").write_text(listing, encoding="utf-8")
    print(f"wrote {len(SOURCES) + 1} files to {OUT}")


if __name__ == "__main__":
    main()
