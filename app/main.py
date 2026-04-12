from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import create_db_and_tables
from app.routes.applications import router as applications_router


# Lifespan function runs when the app starts and shuts down
# Here we use it to initialize the database (create tables if not exist)
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()  # Initialize DB tables
    yield  # Application runs after this point


# Create FastAPI application instance
app = FastAPI(
    title="Job Application Tracker API",
    lifespan=lifespan,  # Attach lifecycle logic
)


# Enable CORS so frontend (React) can communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],  # Allowed frontend origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Root endpoint to verify the API is running
@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Job Application Tracker API is running"}


# Register application routes (applications endpoints)
app.include_router(applications_router)