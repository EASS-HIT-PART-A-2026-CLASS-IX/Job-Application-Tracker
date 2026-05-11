from datetime import date
from enum import Enum

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    is_admin: bool = Field(default=False)


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
    user_id: int = Field(foreign_key="user.id", index=True)
    company: str
    position: str
    status: ApplicationStatus
    location: str | None = None
    applied_date: date | None = None
    source: str | None = None
    notes: str | None = None
    favorite: bool = False
