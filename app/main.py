from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, func, select

from app.auth import require_admin
from app.db import create_db_and_tables, get_session
from app.models import JobApplication, User
from app.routes.applications import router as applications_router
from app.routes.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Job Application Tracker API", lifespan=lifespan)

# Allow the React dev server and any local port variants to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Job Application Tracker API is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Admin-only endpoint — requires is_admin=True on the User record
@app.get("/admin/stats")
def admin_stats(
    session: Session = Depends(get_session),
    _admin: User = Depends(require_admin),
) -> dict:
    total_users = session.exec(select(func.count()).select_from(User)).one()
    total_apps = session.exec(select(func.count()).select_from(JobApplication)).one()
    return {"total_users": total_users, "total_applications": total_apps}


app.include_router(applications_router)
app.include_router(auth_router)
