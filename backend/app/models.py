from datetime import date
from typing import Literal

from pydantic import BaseModel


class Note(BaseModel):
    label: str
    text: str


class Programme(BaseModel):
    id: str
    acronym: str | None
    title: str
    countries: str = ""
    priority: int | None = None
    opens: str = ""
    opens_on: date | None = None
    deadline: str = ""
    deadline_on: date | None = None
    admission_type: str = ""
    stipend: str = ""
    ielts: str = ""
    moi: str = ""
    gre: str = ""
    pakistan_eligible: str = ""
    admission_url: str = ""
    apply_url: str = ""
    suggestions: list[str] = []
    call_status: str = ""
    source_url: str = ""
    in_window: bool = False
    alerts: list[Note] = []
    fee: str = ""
    fee_note: str = ""
    fee_detail: str = ""
    fee_source: str = ""
    fee_status: Literal["published", "unverified", "not_found", ""] = ""
    fee_checked: str = ""


class CatalogueEntry(BaseModel):
    id: str
    acronym: str | None
    title: str
    subject: str = ""
    relevance: str = ""
    cycle: str = ""
    application_status: str = ""
    scholarship_status: str = ""
    deadline: str = ""
    duration: str = ""
    countries: str = ""
    language: str = ""
    eligibility: str = ""
    funding: str = ""
    website_url: str = ""
    project_url: str = ""
    catalogue_url: str = ""
    checked_on: str = ""
    notes: list[str] = []


class DatasetInfo(BaseModel):
    id: str
    label: str
    kind: Literal["tracker", "catalogue"]
    count: int


class TrackerDataset(BaseModel):
    id: str
    label: str
    kind: Literal["tracker"] = "tracker"
    notes: list[Note]
    items: list[Programme]


class CatalogueDataset(BaseModel):
    id: str
    label: str
    kind: Literal["catalogue"] = "catalogue"
    notes: list[Note]
    items: list[CatalogueEntry]
