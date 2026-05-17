import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import ai_service.agent as agent_module

logging.basicConfig(level=logging.INFO, format="%(asctime)s [ai_service] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Job Application AI Advisor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SuggestRequest(BaseModel):
    company: str
    position: str


class SuggestResponse(BaseModel):
    company: str
    position: str
    advice: str


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/suggest", response_model=SuggestResponse)
def suggest(req: SuggestRequest):
    prompt = (
        f"Give me interview preparation advice for a {req.position} role at {req.company}. "
        "Include: key skills to highlight, likely interview questions, and tips to stand out."
    )
    try:
        advice = agent_module.generate_text(prompt)
    except Exception as exc:
        logger.error("suggest failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=str(exc))
    return SuggestResponse(company=req.company, position=req.position, advice=advice)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        answer = agent_module.generate_text(req.question)
    except Exception as exc:
        logger.error("chat failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=str(exc))
    return ChatResponse(answer=answer)
