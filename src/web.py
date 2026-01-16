"""Web GUI server for Antigravity Hands."""

import json
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv

from .tools import execute_tool, get_tool_names

load_dotenv()

app = FastAPI(title="Antigravity Hands", description="AI Agent Control Panel")

# Templates
templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))

# Static files
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Store active connections and execution state
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.pending_approval: Optional[asyncio.Event] = None
        self.approval_result: Optional[str] = None
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Render the main dashboard."""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "tools": get_tool_names()
    })


@app.get("/api/tools")
async def list_tools():
    """List available tools."""
    return {"tools": get_tool_names()}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time plan execution."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "execute_plan":
                await execute_plan_ws(websocket, data.get("plan"))
            elif action == "approve":
                manager.approval_result = data.get("choice", "approve")
                if manager.pending_approval:
                    manager.pending_approval.set()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def execute_plan_ws(websocket: WebSocket, plan_data: dict):
    """Execute a plan with WebSocket-based approval."""
    try:
        # Validate plan
        if not plan_data or "steps" not in plan_data:
            await websocket.send_json({
                "type": "error",
                "message": "Invalid plan format. Expected {name, steps: [...]}"
            })
            return
        
        name = plan_data.get("name", "Unnamed Plan")
        steps = plan_data["steps"]
        
        await websocket.send_json({
            "type": "plan_start",
            "name": name,
            "total_steps": len(steps)
        })
        
        results = {"succeeded": 0, "failed": 0, "skipped": 0}
        approve_all = False
        
        for i, step in enumerate(steps):
            step_num = i + 1
            tool = step.get("tool")
            params = step.get("params", {})
            description = step.get("description", f"Execute {tool}")
            
            # Validate tool
            if tool not in get_tool_names():
                await websocket.send_json({
                    "type": "step_error",
                    "step": step_num,
                    "message": f"Unknown tool: {tool}"
                })
                results["failed"] += 1
                continue
            
            # Send step for approval
            await websocket.send_json({
                "type": "step_pending",
                "step": step_num,
                "total": len(steps),
                "tool": tool,
                "description": description,
                "params": params,
                "needs_approval": not approve_all
            })
            
            # Wait for approval if needed
            if not approve_all:
                manager.pending_approval = asyncio.Event()
                manager.approval_result = None
                
                await manager.pending_approval.wait()
                choice = manager.approval_result
                
                if choice == "abort":
                    await websocket.send_json({
                        "type": "plan_aborted",
                        "step": step_num
                    })
                    break
                elif choice == "skip":
                    await websocket.send_json({
                        "type": "step_skipped",
                        "step": step_num
                    })
                    results["skipped"] += 1
                    continue
                elif choice == "approve_all":
                    approve_all = True
            
            # Execute the tool
            await websocket.send_json({
                "type": "step_executing",
                "step": step_num
            })
            
            try:
                result = execute_tool(tool, params)
                await websocket.send_json({
                    "type": "step_success",
                    "step": step_num,
                    "result": result
                })
                results["succeeded"] += 1
            except Exception as e:
                await websocket.send_json({
                    "type": "step_error",
                    "step": step_num,
                    "error": str(e)
                })
                results["failed"] += 1
        
        # Plan complete
        await websocket.send_json({
            "type": "plan_complete",
            "results": results
        })
        
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })


def run_server(host: str = "127.0.0.1", port: int = 8080):
    """Run the web server."""
    import uvicorn
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run_server()
