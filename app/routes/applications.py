from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.models import JobApplication
from app.schemas import (
    JobApplicationCreate,
    JobApplicationResponse,
    JobApplicationUpdate,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


# Get all job applications
@router.get("", response_model=list[JobApplicationResponse])
def list_applications(session: Session = Depends(get_session)) -> list[JobApplication]:
    applications = session.exec(select(JobApplication)).all()
    return applications


# Get a specific application by ID
@router.get("/{application_id}", response_model=JobApplicationResponse)
def get_application(
    application_id: int,
    session: Session = Depends(get_session),
) -> JobApplication:
    application = session.get(JobApplication, application_id)

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return application


# Create a new job application
@router.post("", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: JobApplicationCreate,
    session: Session = Depends(get_session),
) -> JobApplication:
    application = JobApplication(**data.model_dump())
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


# Update an existing application
@router.put("/{application_id}", response_model=JobApplicationResponse)
def update_application(
    application_id: int,
    data: JobApplicationUpdate,
    session: Session = Depends(get_session),
) -> JobApplication:
    application = session.get(JobApplication, application_id)

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    update_data = data.model_dump()
    for key, value in update_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)
    return application


# Delete an application by ID
@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    session: Session = Depends(get_session),
) -> None:
    application = session.get(JobApplication, application_id)

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    session.delete(application)
    session.commit()