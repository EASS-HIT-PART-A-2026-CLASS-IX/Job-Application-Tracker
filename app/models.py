from datetime import date
from enum import Enum

from sqlmodel import Field, SQLModel


# Enum representing valid application statuses
class ApplicationStatus(str, Enum):
    saved = "saved"
    applied = "applied"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


# Database model for a job application
class JobApplication(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    company: str
    position: str
    status: ApplicationStatus
    location: str | None = None
    applied_date: date | None = None
    source: str | None = None
    notes: str | None = None
    favorite: bool = False