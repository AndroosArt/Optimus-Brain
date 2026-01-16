from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, UUID4
from datetime import datetime
import uuid

class GuidanceType(str, Enum):
    PROHIBITION = "PROHIBITION"
    BEST_PRACTICE = "BEST_PRACTICE"
    TEMPLATE_SUGGESTION = "TEMPLATE_SUGGESTION"

class JudgmentEntry(BaseModel):
    rule_id: UUID4 = Field(default_factory=uuid.uuid4)
    created_at: datetime = Field(default_factory=datetime.now)
    topic_tags: List[str] = Field(default_factory=list)
    trigger_condition: str
    guidance_type: GuidanceType
    content: str
    source_incident_id: Optional[str] = None
    confidence_score: float = Field(default=0.5)
    times_applied: int = 0
    times_ignored: int = 0
