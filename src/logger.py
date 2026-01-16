"""Structured logging with rich console output."""

import os
import logging
from datetime import datetime
from pathlib import Path
from rich.console import Console
from rich.logging import RichHandler
from rich.panel import Panel
from rich.text import Text

console = Console()

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE")

handlers = [RichHandler(console=console, rich_tracebacks=True)]

if LOG_FILE:
    log_path = Path(LOG_FILE)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    handlers.append(logging.FileHandler(log_path))

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(message)s",
    datefmt="[%X]",
    handlers=handlers,
)

logger = logging.getLogger("antigravity")


def log_step(step_num: int, total: int, description: str):
    """Log a step about to be executed."""
    console.print()
    console.print(
        Panel(
            f"[bold cyan]Step {step_num}/{total}[/bold cyan]\n{description}",
            title="[yellow]⚡ Pending Action[/yellow]",
            border_style="yellow",
        )
    )


def log_tool_call(tool: str, params: dict):
    """Log the tool being called."""
    console.print(f"  [dim]Tool:[/dim] [bold]{tool}[/bold]")
    for key, value in params.items():
        display_value = str(value)[:100] + "..." if len(str(value)) > 100 else value
        console.print(f"  [dim]{key}:[/dim] {display_value}")


def log_success(message: str):
    """Log a success message."""
    console.print(f"  [green]✓[/green] {message}")


def log_error(message: str):
    """Log an error message."""
    console.print(f"  [red]✗[/red] {message}")


def log_skipped():
    """Log that a step was skipped."""
    console.print(f"  [yellow]⊘[/yellow] Skipped")


def log_plan_start(name: str, step_count: int):
    """Log the start of plan execution."""
    console.print()
    console.print(
        Panel(
            f"[bold]{name}[/bold]\n[dim]{step_count} steps to execute[/dim]",
            title="[bold blue]🚀 Executing Plan[/bold blue]",
            border_style="blue",
        )
    )


def log_plan_complete(succeeded: int, failed: int, skipped: int):
    """Log plan completion summary."""
    console.print()
    summary = Text()
    summary.append("✓ ", style="green")
    summary.append(f"{succeeded} succeeded  ")
    if failed:
        summary.append("✗ ", style="red")
        summary.append(f"{failed} failed  ")
    if skipped:
        summary.append("⊘ ", style="yellow")
        summary.append(f"{skipped} skipped")
    
    style = "green" if failed == 0 else "red"
    console.print(
        Panel(summary, title="[bold]Plan Complete[/bold]", border_style=style)
    )
