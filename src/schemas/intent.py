from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, UUID4
from datetime import datetime
import uuid

class IntentSource(str, Enum):
    HUMAN = "HUMAN"
    SYSTEM_TRIGGER = "SYSTEM_TRIGGER"
    SUB_AGENT = "SUB_AGENT"

class IntentPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class StructuredGoal(BaseModel):
    verb: str = Field(..., description="Action verb, e.g., CREATE, DELETE, ANALYZE")
    noun: str = Field(..., description="Target entity, e.g., WEB_APP, DATABASE, REPORT")
    success_criteria: List[str] = Field(default_factory=list)

class IntentContext(BaseModel):
    current_directory: str
    relevant_files: List[str] = Field(default_factory=list)
    environment_vars: Dict[str, str] = Field(default_factory=dict)

class IntentPacket(BaseModel):
    id: UUID4 = Field(default_factory=uuid.uuid4)
    timestamp: datetime = Field(default_factory=datetime.now)
    source: IntentSource
    priority: IntentPriority = IntentPriority.NORMAL
    natural_language_input: str
    structured_goal: Optional[StructuredGoal] = None
    context: Optional[IntentContext] = None
    constraints: List[str] = Field(default_factory=list)
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)
