import os

from pydantic_ai import Agent

model = os.getenv("LLM_MODEL", "openai:gpt-4o-mini")

agent = Agent(
    model,
    system_prompt=(
        "You are a career advisor specializing in job applications. "
        "Given a company name and job position, provide concise and actionable advice "
        "with 3-5 bullet points covering: what to research before the interview, "
        "key skills to highlight, and one tip specific to the company or role. "
        "Keep each bullet point to one sentence."
    ),
)
