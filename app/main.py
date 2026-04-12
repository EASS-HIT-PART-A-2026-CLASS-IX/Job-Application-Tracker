from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db import create_db_and_tables
from app.routes.applications import router as applications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables when the application starts
    create_db_and_tables()
    yield


app = FastAPI(
    title="Job Application Tracker API",
    lifespan=lifespan,
)


# Root endpoint to verify the API is running
@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Job Application Tracker API is running"}


# Register application routes
app.include_router(applications_router)