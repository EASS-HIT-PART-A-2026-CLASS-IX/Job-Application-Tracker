from sqlmodel import Session, SQLModel, create_engine

# SQLite database file
DATABASE_URL = "sqlite:///job_applications.db"

# Create engine for SQLite
engine = create_engine(DATABASE_URL, echo=False)


# Create all database tables
def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


# Get a database session
def get_session():
    with Session(engine) as session:
        yield session