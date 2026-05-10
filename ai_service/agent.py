import os

from pydantic_ai import Agent

_agent: Agent | None = None


def get_agent() -> Agent:
    global _agent
    if _agent is None:
        model = os.getenv("LLM_MODEL", "google-gla:gemini-2.0-flash-lite")
        _agent = Agent(
            model,
            system_prompt=(
                "You are a career advisor specializing in job applications and career development. "
                "You can help with: interview preparation, resume tips, job search strategies, "
                "career advice, salary negotiation, and suggesting job roles based on skills. "
                "Be concise, practical, and encouraging. Use bullet points when listing tips."
            ),
        )
    return _agent
