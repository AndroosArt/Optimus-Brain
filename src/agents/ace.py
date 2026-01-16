import time
from typing import List, Optional, Dict
from datetime import datetime

from src.schemas.intent import IntentPacket, IntentSource
from src.schemas.graph import TaskGraph, GraphStatus, TaskStatus
from src.schemas.audit import DecisionRecord, DecisionType, DecisionRecord
from src.schemas.memory import JudgmentEntry

class AceAgent:
    def __init__(self, agent_id: str = "ACE-01"):
        self.agent_id = agent_id
        self.decision_log: List[DecisionRecord] = []
        self.active_graphs: Dict[str, TaskGraph] = {}
        self.state = "IDLE"
    
    def log_decision(self, type: DecisionType, rationale: str, inputs: List[str] = [], outcome: str = None):
        record = DecisionRecord(
            actor_agent_id=self.agent_id,
            decision_type=type,
            rationale=rationale,
            inputs_considered=inputs,
            outcome_ref=outcome
        )
        self.decision_log.append(record)
        print(f"[{self.agent_id}] DECISION: {type.value} - {rationale}")
        return record.id

    def receive_intent(self, user_input: str) -> str:
        packet = IntentPacket(
            source=IntentSource.HUMAN,
            natural_language_input=user_input
        )
        self.log_decision(
            DecisionType.CLARIFY_INTENT,
            f"Received new intent: '{user_input}'. Preparing to parse.",
            outcome=str(packet.id)
        )
        self.process_intent(packet)
        return str(packet.id)

    def process_intent(self, intent: IntentPacket):
        self.state = "PARSING"
        # Mock Planning
        self.state = "PLANNING"
        graph = TaskGraph(intent_ref=str(intent.id))
        self.active_graphs[str(graph.graph_id)] = graph
        
        self.log_decision(
            DecisionType.PLAN_NODE,
            "Created initial empty graph for intent.",
            inputs=[str(intent.id)],
            outcome=str(graph.graph_id)
        )
        self.run_loop(str(graph.graph_id))

    def run_loop(self, graph_id: str):
        graph = self.active_graphs.get(graph_id)
        if not graph:
            return
        
        print(f"--- Starting Orchestration Loop for {graph_id} ---")
        self.state = "EXECUTING"
        graph.status = GraphStatus.IN_PROGRESS
        
        ready_nodes = [n for n in graph.nodes if n.status == TaskStatus.PENDING]
        for node in ready_nodes:
            self.delegate_task(node)

    def delegate_task(self, node):
        self.log_decision(
            DecisionType.DELEGATE_TASK,
            f"Delegating node {node.type} to {node.assignee_role}",
            outcome=node.node_id
        )
        node.status = TaskStatus.RUNNING
