"""Router activity logger."""

import logging
from pathlib import Path
from datetime import datetime

# Configure router logger
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)
log_file = log_dir / "router_activity.log"

logging.basicConfig(
    filename=str(log_file),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_route(intent: str, handler: str, status: str, details: dict = None):
    """Log a routing decision."""
    msg = f"Intent: {intent} | Handler: {handler} | Status: {status}"
    if details:
        msg += f" | Details: {details}"
    logging.info(msg)
