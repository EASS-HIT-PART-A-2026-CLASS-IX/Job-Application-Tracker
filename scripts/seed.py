from sqlmodel import Session, select

from app.auth import hash_password
from app.db import engine, create_db_and_tables
from app.models import JobApplication, User


def seed_data():
    create_db_and_tables()

    with Session(engine) as session:
        existing = session.exec(select(JobApplication)).first()
        if existing:
            print("Data already exists, skipping seeding.")
            return

        seed_user = session.exec(select(User).where(User.username == "demo")).first()
        if not seed_user:
            seed_user = User(username="demo", hashed_password=hash_password("demo1234"))
            session.add(seed_user)
            session.commit()
            session.refresh(seed_user)

        applications = [
            JobApplication(
                user_id=seed_user.id,
                company="Google",
                position="Backend Developer",
                status="applied",
                location="Tel Aviv",
                source="LinkedIn",
                notes="Sent CV",
                favorite=False,
            ),
            JobApplication(
                user_id=seed_user.id,
                company="Microsoft",
                position="QA Engineer",
                status="interview",
                location="Herzliya",
                source="Company Website",
                notes="Interview scheduled",
                favorite=True,
            ),
            JobApplication(
                user_id=seed_user.id,
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

        print("Seed data inserted successfully! Login with demo / demo1234")


if __name__ == "__main__":
    seed_data()
