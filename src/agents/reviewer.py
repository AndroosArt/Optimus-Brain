from typing import List, Dict, Any, Tuple
from src.schemas.graph import TaskGraph, GraphStatus, TaskType
from src.schemas.audit import DecisionRecord

class ReviewVerdict:
    def __init__(self, approved: bool, reasons: List[str], risk_score: float):
        self.approved = approved
        self.reasons = reasons
        self.risk_score = risk_score

class ReviewerAgent:
    def __init__(self):
        self.forbidden_patterns = ["rm -rf /", "DELETE FROM users", ".env"]

    def review_plan(self, graph: TaskGraph) -> ReviewVerdict:
        reasons = []
        approved = True
        risk_score = 0.0
        
        if not graph.intent_ref:
             reasons.append("Missing Intent Reference.")
             approved = False
        
        for node in graph.nodes:
            risk = self._calculate_node_risk(node)
            risk_score = max(risk_score, risk)
            
            if node.type == TaskType.COMMAND:
                cmd = node.inputs.get("command", "")
                for pattern in self.forbidden_patterns:
                    if pattern in cmd:
                        reasons.append(f"Safety Violation: Forbidden pattern '{pattern}' in node {node.node_id}")
                        approved = False
                        risk_score = 1.0
        
        if approved:
             graph.status = GraphStatus.APPROVED
        else:
             graph.status = GraphStatus.FAILED
             
        return ReviewVerdict(approved, reasons, risk_score)

    def _calculate_node_risk(self, node) -> float:
        if node.type in [TaskType.SEARCH, TaskType.THINK, TaskType.REVIEW]:
            return 0.1
        if node.type in [TaskType.GENERATE_CODE, TaskType.FILE_OP]:
            return 0.5
        if node.type in [TaskType.COMMAND]:
            return 0.8
        return 0.0
