"""User approval prompts for step execution."""

from rich.console import Console
from rich.prompt import Prompt

console = Console()


class ApprovalResult:
    APPROVE = "approve"
    SKIP = "skip"
    ABORT = "abort"
    APPROVE_ALL = "approve_all"


def prompt_approval(auto_approve: bool = False) -> str:
    """
    Prompt the user for approval to execute a step.
    
    Returns one of: approve, skip, abort, approve_all
    """
    if auto_approve:
        console.print("  [dim]Auto-approved[/dim]")
        return ApprovalResult.APPROVE
    
    console.print()
    console.print("  [bold]Execute this step?[/bold]")
    console.print("  [dim][Y]es / [N]o / [S]kip / [A]ll remaining / [Q]uit[/dim]")
    
    while True:
        choice = Prompt.ask("  Choice", default="y").lower().strip()
        
        if choice in ("y", "yes"):
            return ApprovalResult.APPROVE
        elif choice in ("n", "no", "q", "quit"):
            return ApprovalResult.ABORT
        elif choice in ("s", "skip"):
            return ApprovalResult.SKIP
        elif choice in ("a", "all"):
            return ApprovalResult.APPROVE_ALL
        else:
            console.print("  [red]Invalid choice. Please enter Y, N, S, A, or Q.[/red]")
