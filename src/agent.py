"""Core agent execution loop."""

import json
from pathlib import Path
from typing import Any

from .approval import prompt_approval, ApprovalResult
from .logger import (
    log_step,
    log_tool_call,
    log_success,
    log_error,
    log_skipped,
    log_plan_start,
    log_plan_complete,
    logger,
)
from .tools import execute_tool, get_tool_names


class Agent:
    """Agent that executes plans with user approval."""
    
    def __init__(self, auto_approve: bool = False):
        self.auto_approve = auto_approve
        self.approve_all = False
    
    def load_plan(self, plan_path: str) -> dict:
        """Load a plan from a JSON file."""
        path = Path(plan_path)
        if not path.exists():
            raise FileNotFoundError(f"Plan not found: {plan_path}")
        
        with open(path, "r", encoding="utf-8") as f:
            plan = json.load(f)
        
        self._validate_plan(plan)
        return plan
    
    def load_plan_from_string(self, plan_json: str) -> dict:
        """Load a plan from a JSON string."""
        plan = json.loads(plan_json)
        self._validate_plan(plan)
        return plan
    
    def _validate_plan(self, plan: dict):
        """Validate plan structure."""
        if "steps" not in plan:
            raise ValueError("Plan must have 'steps' array")
        
        valid_tools = get_tool_names()
        for i, step in enumerate(plan["steps"]):
            if "tool" not in step:
                raise ValueError(f"Step {i+1} missing 'tool' field")
            if step["tool"] not in valid_tools:
                raise ValueError(
                    f"Step {i+1} has unknown tool '{step['tool']}'. "
                    f"Valid tools: {', '.join(valid_tools)}"
                )
            if "params" not in step:
                raise ValueError(f"Step {i+1} missing 'params' field")
    

    def execute_plan(self, plan: dict, session_id: str = None, plan_only: bool = False) -> dict:
        """
        Execute a plan step by step with approval.
        
        Returns a summary of execution results.
        """
        import uuid
        from datetime import datetime
        
        # Initialize session
        if not session_id:
            session_id = str(uuid.uuid4())
            
        name = plan.get("name", "Unnamed Plan")
        steps = plan["steps"]
        timestamp = datetime.now().isoformat()
        
        # Initial session state
        session_data = {
            "id": session_id,
            "timestamp": timestamp,
            "objective": name,
            "status": "PLANNED" if plan_only else "RUNNING",
            "steps": [
                {**step, "status": "PENDING"} for step in steps
            ],
            "meta": plan.get("meta", {})
        }
        
        self._save_session(session_data)
        
        if plan_only:
            log_plan_start(name + " (Planning Only)", len(steps))
            log_success(f"Plan saved to logs/sessions/{session_id}.json")
            return {"succeeded": 0, "failed": 0, "skipped": 0, "step_results": []}
        
        log_plan_start(name, len(steps))
        
        results = {
            "succeeded": 0,
            "failed": 0,
            "skipped": 0,
            "step_results": [],
        }
        
        for i, step in enumerate(steps):
            # Check if this step was already completed (if resuming)
            # For now, we assume linear execution from start
            
            step_num = i + 1
            tool = step["tool"]
            params = step["params"]
            description = step.get("description", f"Execute {tool}")
            
            # Update step status to RUNNING in session log
            session_data["steps"][i]["status"] = "RUNNING"
            self._save_session(session_data)
            
            # Show pending action
            log_step(step_num, len(steps), description)
            log_tool_call(tool, params)
            
            # Get approval
            should_auto = self.auto_approve or self.approve_all
            approval = prompt_approval(auto_approve=should_auto)
            
            if approval == ApprovalResult.ABORT:
                logger.info("Plan execution aborted by user")
                session_data["status"] = "ABORTED"
                self._save_session(session_data)
                break
            
            if approval == ApprovalResult.APPROVE_ALL:
                self.approve_all = True
                approval = ApprovalResult.APPROVE
            
            if approval == ApprovalResult.SKIP:
                log_skipped()
                results["skipped"] += 1
                result_entry = {
                    "step": step_num,
                    "tool": tool,
                    "status": "skipped",
                }
                results["step_results"].append(result_entry)
                
                # Update session log
                session_data["steps"][i].update({
                    "status": "SKIPPED",
                    "output": "Skipped by user"
                })
                self._save_session(session_data)
                continue
            
            # Execute the tool
            try:
                result = execute_tool(tool, params)
                log_success(f"Completed: {result.get('message', 'OK')}")
                results["succeeded"] += 1
                result_entry = {
                    "step": step_num,
                    "tool": tool,
                    "status": "success",
                    "result": result,
                }
                results["step_results"].append(result_entry)
                
                # Update session log
                session_data["steps"][i].update({
                    "status": "COMPLETED",
                    "output": result
                })
                
            except Exception as e:
                log_error(f"Failed: {str(e)}")
                logger.exception("Tool execution failed")
                results["failed"] += 1
                result_entry = {
                    "step": step_num,
                    "tool": tool,
                    "status": "error",
                    "error": str(e),
                }
                results["step_results"].append(result_entry)
                
                # Update session log
                session_data["steps"][i].update({
                    "status": "ERROR",
                    "error": str(e)
                })
            
            # Save after each step completion
            self._save_session(session_data)
        
        # Final status update
        session_data["status"] = "COMPLETED" if results["failed"] == 0 else "FAILED"
        self._save_session(session_data)
        
        log_plan_complete(
            results["succeeded"],
            results["failed"],
            results["skipped"],
        )
        
        return results

    def _save_session(self, session_data: dict):
        """Save session data to JSON file."""
        try:
            logs_dir = Path("logs/sessions")
            logs_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = logs_dir / f"{session_data['id']}.json"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(session_data, f, indent=2)
        except Exception as e:
            # Don't crash agent if logging fails
            logger.error(f"Failed to save session logs: {e}")

