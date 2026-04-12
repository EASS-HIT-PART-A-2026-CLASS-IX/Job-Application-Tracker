from fastapi import FastAPI

from app.db import create_db_and_tables
from app.routes.applications import router as applications_router

app = FastAPI(title="Job Application Tracker API")


# Create database tables when the application starts
@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


# Root endpoint to verify the API is running
@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Job Application Tracker API is running"}


# Register application routes
app.include_router(applications_router)