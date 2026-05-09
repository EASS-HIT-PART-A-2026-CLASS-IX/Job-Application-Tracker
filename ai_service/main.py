from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ai_service.agent import agent

app = FastAPI(title="Job Application AI Advisor")


class SuggestRequest(BaseModel):
    company: str
    position: str


class SuggestResponse(BaseModel):
    company: str
    position: str
    advice: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest):
    prompt = (
        f"Give me interview preparation advice for a {req.position} role at {req.company}."
    )
    try:
        result = await agent.run(prompt)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return SuggestResponse(company=req.company, position=req.position, advice=result.output)
