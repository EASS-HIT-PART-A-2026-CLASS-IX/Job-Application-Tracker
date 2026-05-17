"""
Thin wrapper around the Google Gemini SDK.

Using google-genai directly (the official Google SDK) instead of a third-party
abstraction layer — simpler, more reliable, and easier to mock in tests.
"""

import os

from google import genai
from google.genai import types

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")

SYSTEM_PROMPT = (
    "You are a career advisor specializing in job applications and career development. "
    "You can help with: interview preparation, resume tips, job search strategies, "
    "career advice, salary negotiation, and suggesting job roles based on skills. "
    "Be concise, practical, and encouraging. Use bullet points when listing tips."
)

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GOOGLE_API_KEY)
    return _client


def generate_text(prompt: str) -> str:
    """Call Gemini and return the response text."""
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not configured")
    response = get_client().models.generate_content(
        model=LLM_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )
    return response.text
