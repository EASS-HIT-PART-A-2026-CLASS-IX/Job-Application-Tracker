from datetime import date

from pydantic import BaseModel, Field

from app.models import ApplicationStatus


# Base schema with shared fields
class JobApplicationBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    status: ApplicationStatus
    location: str | None = Field(default=None, max_length=100)
    applied_date: date | None = None
    source: str | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=500)
    favorite: bool = False


# Schema for creating a new application
class JobApplicationCreate(JobApplicationBase):
    pass


# Schema for updating an existing application
class JobApplicationUpdate(JobApplicationBase):
    pass


# Schema returned by the API
class JobApplicationResponse(JobApplicationBase):
    id: int