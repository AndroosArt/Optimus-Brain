from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any

from src.agents.ace import AceAgent
from src.schemas.intent import IntentPacket
from src.schemas.graph import GraphStatus

# Initialize App & Agent
app = FastAPI(title="Optimus Brain API", version="1.0.0")
ace = AceAgent()

class IntentRequest(BaseModel):
    user_input: str
    source: str = "HUMAN"

class IntentResponse(BaseModel):
    intent_id: str
    message: str

@app.get("/health")
def health_check():
    return {"status": "ok", "agent_id": ace.agent_id, "state": ace.state}

@app.post("/intent", response_model=IntentResponse)
def submit_intent(request: IntentRequest, background_tasks: BackgroundTasks):
    """
    Submit a new intent to the Brain.
    Processing happens in the background to not block the web request.
    """
    try:
        # We use Ace's receive_intent method
        # Note: In a real async deployment, we'd want Ace to be async or run in a thread pool
        # For this MVP, we run it directly.
        # To avoid blocking, we could use background_tasks, but Ace.receive_intent is currently synchronous and fast (mock).
        
        intent_id = ace.receive_intent(request.user_input)
        
        return IntentResponse(
            intent_id=intent_id,
            message="Intent received and processing started."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/{graph_id}")
def get_graph_status(graph_id: str):
    """Check the status of a specific task graph."""
    graph = ace.active_graphs.get(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")
    
    return {
        "graph_id": str(graph.graph_id),
        "status": graph.status,
        "nodes_total": len(graph.nodes),
        "nodes_pending": len([n for n in graph.nodes if n.status == "PENDING"])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
