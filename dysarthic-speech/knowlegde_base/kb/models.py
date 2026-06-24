"""
Data models for the personalized transcription knowledge base.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Formality(str, Enum):
    CASUAL = "casual"
    PROFESSIONAL = "professional"
    ACADEMIC = "academic"
    MIXED = "mixed"


class CorrectionSource(str, Enum):
    MANUAL = "manual"
    AUTO_FEEDBACK = "auto_feedback"
    LLM_SUGGESTED = "llm_suggested"


class VocabularyEntry(BaseModel):
    """A term the speaker uses, with known STT mis-hearings."""
    term: str
    category: str = "general"
    definition: Optional[str] = None
    aliases: list[str] = Field(default_factory=list)
    added_at: datetime = Field(default_factory=datetime.utcnow)


class CorrectionRule(BaseModel):
    """A mapping from a known STT mistake to the intended word/phrase."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    stt_output: str
    intended: str
    occurrences: int = 1
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    source: CorrectionSource = CorrectionSource.MANUAL
    context_hint: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)


class SpeakingStyle(BaseModel):
    """How the speaker talks — guides LLM output formatting."""
    formality: Formality = Formality.PROFESSIONAL
    remove_fillers: bool = True
    filler_words: list[str] = Field(default_factory=lambda: ["um", "uh", "like", "you know"])
    languages: list[str] = Field(default_factory=lambda: ["en"])
    common_phrases: list[str] = Field(default_factory=list)
    preferred_spelling: str = "en-US"
    notes: Optional[str] = None


class SpeakerProfile(BaseModel):
    """Complete knowledge base profile for a single speaker."""
    speaker_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    name: str
    domain: str = "general"
    topics: list[str] = Field(default_factory=list)
    vocabulary: list[VocabularyEntry] = Field(default_factory=list)
    corrections: list[CorrectionRule] = Field(default_factory=list)
    style: SpeakingStyle = Field(default_factory=SpeakingStyle)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
