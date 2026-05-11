import os

from sqlmodel import Session, SQLModel, create_engine

# Defaults to SQLite for local dev/tests; overridden by DATABASE_URL in Docker (PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///job_applications.db")

engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
