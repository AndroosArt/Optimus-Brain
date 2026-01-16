from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, UUID4
import uuid

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    BLOCKED = "BLOCKED"

class GraphStatus(str, Enum):
    DRAFT = "DRAFT"
    REVIEWING = "REVIEWING"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PAUSED = "PAUSED"

class AgentRole(str, Enum):
    ORCHESTRATOR = "ORCHESTRATOR"
    REVIEWER = "REVIEWER"
    SYSTEMS = "SYSTEMS"
    OPERATOR = "OPERATOR"

class TaskType(str, Enum):
    GENERATE_CODE = "GENERATE_CODE"
    SEARCH = "SEARCH"
    REVIEW = "REVIEW"
    COMMAND = "COMMAND"
    FILE_OP = "FILE_OP"
    THINK = "THINK"

class TaskNode(BaseModel):
    node_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: TaskType
    description: str
    assignee_role: AgentRole
    assignee_id: Optional[str] = None
    inputs: Dict[str, Any] = Field(default_factory=dict)
    expected_output_schema: Dict[str, Any] = Field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

class DependencyType(str, Enum):
    HARD_DEPENDENCY = "HARD_DEPENDENCY"
    DATA_FLOW = "DATA_FLOW"

class TaskEdge(BaseModel):
    from_node: str
    to_node: str
    type: DependencyType = DependencyType.HARD_DEPENDENCY

class TaskGraph(BaseModel):
    graph_id: UUID4 = Field(default_factory=uuid.uuid4)
    intent_ref: str
    status: GraphStatus = GraphStatus.DRAFT
    nodes: List[TaskNode] = Field(default_factory=list)
    edges: List[TaskEdge] = Field(default_factory=list)
    variables: Dict[str, Any] = Field(default_factory=dict)
    created_at: float = Field(default_factory=lambda: 0.0)
