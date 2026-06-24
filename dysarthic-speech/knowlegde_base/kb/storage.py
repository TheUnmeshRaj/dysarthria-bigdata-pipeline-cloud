"""
File-based storage for speaker profiles (JSON on disk).
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from .models import SpeakerProfile


class KnowledgeBaseStorage:
    """Save/load speaker profiles as JSON files."""

    def __init__(self, base_dir: str = "kb_data"):
        self.base_dir = Path(base_dir)
        self.speakers_dir = self.base_dir / "speakers"
        self.speakers_dir.mkdir(parents=True, exist_ok=True)

    def save_speaker(self, profile: SpeakerProfile) -> Path:
        """Save a speaker profile to disk."""
        profile.updated_at = datetime.utcnow()
        filepath = self.speakers_dir / f"{profile.speaker_id}.json"
        filepath.write_text(profile.model_dump_json(indent=2), encoding="utf-8")
        return filepath

    def load_speaker(self, speaker_id: str) -> Optional[SpeakerProfile]:
        """Load a speaker profile by ID. Returns None if not found."""
        filepath = self.speakers_dir / f"{speaker_id}.json"
        if not filepath.exists():
            return None
        data = json.loads(filepath.read_text(encoding="utf-8"))
        return SpeakerProfile(**data)
