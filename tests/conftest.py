import os

import pytest
from sqlmodel import SQLModel, Session, create_engine

from app.db import get_session
from app.main import app

os.environ.setdefault("GOOGLE_API_KEY", "test-key")

test_engine = create_engine("sqlite:///test.db", echo=False)


def override_get_session():
    with Session(test_engine) as session:
        yield session


app.dependency_overrides[get_session] = override_get_session


@pytest.fixture(autouse=True)
def reset_db():
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)


@pytest.fixture
def anyio_backend():
    return "asyncio"
