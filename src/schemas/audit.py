from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field, UUID4
from datetime import datetime
import uuid

class DecisionType(str, Enum):
    PLAN_NODE = "PLAN_NODE"
    APPROVE_PLAN = "APPROVE_PLAN"
    REJECT_PLAN = "REJECT_PLAN"
    DELEGATE_TASK = "DELEGATE_TASK"
    ESCALATE_ERROR = "ESCALATE_ERROR"
    MODIFY_MEMORY = "MODIFY_MEMORY"
    CLARIFY_INTENT = "CLARIFY_INTENT"
    VETO_ACTION = "VETO_ACTION"

class DecisionRecord(BaseModel):
    id: UUID4 = Field(default_factory=uuid.uuid4)
    timestamp: datetime = Field(default_factory=datetime.now)
    actor_agent_id: str
    decision_type: DecisionType
    rationale: str
    inputs_considered: List[str] = Field(default_factory=list)
    alternatives_rejected: List[str] = Field(default_factory=list)
    outcome_ref: Optional[str] = None
    risk_score: float = 0.0
