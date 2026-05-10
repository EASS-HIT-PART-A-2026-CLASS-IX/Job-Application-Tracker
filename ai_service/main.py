from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_service.agent import get_agent

app = FastAPI(title="Job Application AI Advisor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5174", "http://localhost:5175"],
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
async def suggest(req: SuggestRequest):
    prompt = f"Give me interview preparation advice for a {req.position} role at {req.company}."
    try:
        result = await get_agent().run(prompt)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return SuggestResponse(company=req.company, position=req.position, advice=result.output)


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        result = await get_agent().run(req.question)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return ChatResponse(answer=result.output)
