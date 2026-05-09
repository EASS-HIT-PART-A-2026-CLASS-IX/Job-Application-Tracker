import os

import pytest

# Prevent OpenAI provider from raising at import time during tests.
# Tests that use the AI agent override it with TestModel, so no real calls are made.
os.environ.setdefault("OPENAI_API_KEY", "test-key")


@pytest.fixture
def anyio_backend():
    return "asyncio"
