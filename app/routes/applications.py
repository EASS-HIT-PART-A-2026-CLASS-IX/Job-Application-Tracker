from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.db import get_session
from app.models import JobApplication, User
from app.schemas import JobApplicationCreate, JobApplicationResponse, JobApplicationUpdate

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=list[JobApplicationResponse])
def list_applications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[JobApplication]:
    return session.exec(select(JobApplication).where(JobApplication.user_id == current_user.id)).all()


@router.get("/{application_id}", response_model=JobApplicationResponse)
def get_application(
    application_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> JobApplication:
    application = session.get(JobApplication, application_id)
    if application is None or application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


@router.post("", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: JobApplicationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> JobApplication:
    application = JobApplication(**data.model_dump(), user_id=current_user.id)
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.put("/{application_id}", response_model=JobApplicationResponse)
def update_application(
    application_id: int,
    data: JobApplicationUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> JobApplication:
    application = session.get(JobApplication, application_id)
    if application is None or application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    for key, value in data.model_dump().items():
        setattr(application, key, value)
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    application = session.get(JobApplication, application_id)
    if application is None or application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    session.delete(application)
    session.commit()
