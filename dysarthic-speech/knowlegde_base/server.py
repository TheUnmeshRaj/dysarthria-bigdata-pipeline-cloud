"""
server.py — FastAPI server for the Knowledge Base + Grammar Correction service.

Endpoints:
    POST /build-kb       Build (or rebuild) a KB for a user from transcript pairs.
    POST /correct        Correct raw STT text using the user's KB.
    GET  /kb-status/{username}  Check if a KB exists for a user + summary stats.

Run with:
    uvicorn server:app --reload --port 8000
"""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Dysarthria KB & Correction API",
    description="Build personalized knowledge bases and apply KB+grammar correction to STT output.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

KB_DIR = str(Path(__file__).parent / "kb_data")
DEFAULT_MODEL = "gpt-4o-mini"


def _get_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured on the server. Set it in a .env file.",
        )
    return key


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class TranscriptPair(BaseModel):
    model_output: str = Field(..., description="What the STT model produced")
    correct_transcription: str = Field(..., description="The ground-truth correct text")


class BuildKBRequest(BaseModel):
    username: str = Field(..., description="Unique identifier for the speaker/user")
    pairs: list[TranscriptPair] = Field(..., min_length=1, description="List of (model_output, correct_transcription) pairs")
    model: Optional[str] = Field(DEFAULT_MODEL, description="OpenAI model to use for KB extraction")


class BuildKBResponse(BaseModel):
    speaker_id: str
    username: str
    domain: str
    corrections_count: int
    vocabulary_count: int
    message: str


class CorrectRequest(BaseModel):
    username: str = Field(..., description="Username whose KB profile to apply")
    raw_text: str = Field(..., description="Raw STT output to correct")
    model: Optional[str] = Field(DEFAULT_MODEL, description="OpenAI model to use for correction")


class CorrectResponse(BaseModel):
    corrected: str
    username: str
    used_kb: bool


class KBStatusResponse(BaseModel):
    exists: bool
    username: str
    speaker_id: Optional[str] = None
    domain: Optional[str] = None
    corrections_count: int = 0
    vocabulary_count: int = 0
    topics: list[str] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok", "service": "dysarthria-kb-api"}


@app.post("/build-kb", response_model=BuildKBResponse)
async def build_kb_endpoint(body: BuildKBRequest):
    """
    Build (or rebuild) a knowledge base for a user.

    Receives an array of (model_output, correct_transcription) pairs,
    sends them to the LLM to extract correction rules and vocabulary,
    then saves the profile locally keyed by username.
    """
    from build_kb import build_kb

    api_key = _get_api_key()

    # Convert request pairs → list[tuple[str, str]]
    pairs: list[tuple[str, str]] = [
        (p.model_output, p.correct_transcription) for p in body.pairs
    ]

    try:
        profile = build_kb(
            pairs=pairs,
            api_key=api_key,
            model=body.model or DEFAULT_MODEL,
            username=body.username,
            kb_dir=KB_DIR,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"KB build failed: {exc}") from exc

    return BuildKBResponse(
        speaker_id=profile.speaker_id,
        username=profile.name,
        domain=profile.domain,
        corrections_count=len(profile.corrections),
        vocabulary_count=len(profile.vocabulary),
        message=f"Knowledge base built successfully with {len(profile.corrections)} correction rules and {len(profile.vocabulary)} vocabulary entries.",
    )


@app.post("/correct", response_model=CorrectResponse)
async def correct_endpoint(body: CorrectRequest):
    """
    Correct raw STT text using the speaker's knowledge base + grammar fixes.

    If no KB is found for the username, falls back to grammar-only correction.
    """
    from correct import correct_for_user, load_profile_by_username, correct, build_system_prompt
    from openai import OpenAI

    api_key = _get_api_key()
    model = body.model or DEFAULT_MODEL

    profile = load_profile_by_username(body.username, KB_DIR)

    if profile:
        # Full KB + grammar correction
        try:
            corrected = correct(body.raw_text, profile, api_key, model)
            used_kb = True
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Correction failed: {exc}") from exc
    else:
        # Fallback: grammar-only correction (no KB)
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert transcript corrector. Fix grammar, punctuation, "
                            "capitalization, and spelling in the given speech-to-text output. "
                            "Output ONLY the corrected text."
                        ),
                    },
                    {"role": "user", "content": body.raw_text},
                ],
                temperature=0.1,
            )
            corrected = response.choices[0].message.content.strip()
            used_kb = False
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Fallback correction failed: {exc}") from exc

    return CorrectResponse(
        corrected=corrected,
        username=body.username,
        used_kb=used_kb,
    )


@app.get("/kb-status/{username}", response_model=KBStatusResponse)
async def kb_status(username: str):
    """Return KB existence and summary stats for a username."""
    from correct import load_profile_by_username

    profile = load_profile_by_username(username, KB_DIR)

    if not profile:
        return KBStatusResponse(exists=False, username=username)

    return KBStatusResponse(
        exists=True,
        username=username,
        speaker_id=profile.speaker_id,
        domain=profile.domain,
        corrections_count=len(profile.corrections),
        vocabulary_count=len(profile.vocabulary),
        topics=profile.topics,
    )


@app.get("/users", response_model=list[str])
async def list_users():
    """Return a list of all usernames that have a KB."""
    users_dir = Path(KB_DIR) / "users"
    if not users_dir.exists():
        return []
    
    usernames = []
    for file_path in users_dir.glob("*.txt"):
        usernames.append(file_path.stem)
    
    return sorted(usernames)

# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
