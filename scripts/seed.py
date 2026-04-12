# This script seeds initial data into the database for development/testing
from sqlmodel import Session, select

from app.db import engine, create_db_and_tables
from app.models import JobApplication


def seed_data():
    # Create tables if not exist
    create_db_and_tables()

    with Session(engine) as session:
        # ✅ Check if data already exists
        existing = session.exec(select(JobApplication)).first()

        if existing:
            print("Data already exists, skipping seeding.")
            return

        applications = [
            JobApplication(
                company="Google",
                position="Backend Developer",
                status="applied",
                location="Tel Aviv",
                source="LinkedIn",
                notes="Sent CV",
                favorite=False,
            ),
            JobApplication(
                company="Microsoft",
                position="QA Engineer",
                status="interview",
                location="Herzliya",
                source="Company Website",
                notes="Interview scheduled",
                favorite=True,
            ),
            JobApplication(
                company="Amazon",
                position="DevOps Engineer",
                status="saved",
                location="Haifa",
                source="Referral",
                notes="Need to prepare",
                favorite=False,
            ),
        ]

        session.add_all(applications)
        session.commit()

        print("Seed data inserted successfully!")


if __name__ == "__main__":
    seed_data()