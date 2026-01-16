"""CLI entry point for Antigravity Hands agent."""

import sys
import json
import argparse
from pathlib import Path

from dotenv import load_dotenv

from .agent import Agent
from .logger import console, logger


def main():
    """Main CLI entry point."""
    load_dotenv()
    
    parser = argparse.ArgumentParser(
        description="Antigravity Hands - Execute AI-generated plans with approval"
    )
    parser.add_argument(
        "plan",
        nargs="?",
        help="Path to plan JSON file",
    )
    parser.add_argument(
        "-i", "--interactive",
        action="store_true",
        help="Enter plan JSON interactively (paste mode)",
    )
    parser.add_argument(
        "-y", "--yes",
        action="store_true",
        help="Auto-approve all steps (use with caution!)",
    )
    
    parser.add_argument(
        "--session-id",
        help="Session ID for logging",
    )

    parser.add_argument(
        "--objective",
        help="Natural language objective to generate a plan for",
    )
    
    parser.add_argument(
        "--plan-only",
        action="store_true",
        help="Generate and save plan without executing",
    )
    
    args = parser.parse_args()
    
    # Create agent
    agent = Agent(auto_approve=args.yes)
    
    # Get plan
    if args.interactive:
        plan = get_interactive_plan()
    elif args.plan:
        try:
            plan = agent.load_plan(args.plan)
        except FileNotFoundError as e:
            console.print(f"[red]Error:[/red] {e}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            console.print(f"[red]Invalid JSON:[/red] {e}")
            sys.exit(1)
    elif args.objective:
        try:
            # Create placeholder session if ID provided (prevents 404 race condition)
            if args.session_id:
                from datetime import datetime
                initial_data = {
                    "id": args.session_id,
                    "timestamp": datetime.now().isoformat(),
                    "objective": args.objective,
                    "status": "INITIALIZING",
                    "steps": [],
                    "meta": {}
                }
                agent._save_session(initial_data)

            from .planner import Planner
            console.print(f"[blue]Generating plan for:[/blue] {args.objective}")
            planner = Planner()
            plan = planner.generate_plan(args.objective)
            # Preview plan
            console.print_json(data=plan)
        except Exception as e:
            console.print(f"[red]Planning failed:[/red] {e}")
            sys.exit(1)
    else:
        # Check if input is piped
        if not sys.stdin.isatty():
            try:
                plan_json = sys.stdin.read()
                plan = agent.load_plan_from_string(plan_json)
            except json.JSONDecodeError as e:
                console.print(f"[red]Invalid JSON from stdin:[/red] {e}")
                sys.exit(1)
        else:
            parser.print_help()
            sys.exit(1)
    
    # Execute plan
    try:
        results = agent.execute_plan(
            plan, 
            session_id=args.session_id,
            plan_only=args.plan_only
        )
        
        # Exit with error code if any steps failed
        if results["failed"] > 0:
            sys.exit(1)
            
    except KeyboardInterrupt:
        console.print("\n[yellow]Aborted by user[/yellow]")
        sys.exit(130)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        logger.exception("Plan execution failed")
        sys.exit(1)


def get_interactive_plan() -> dict:
    """Get plan from interactive input."""
    console.print("[bold]Paste your plan JSON below.[/bold]")
    console.print("[dim]Press Enter twice when done, or Ctrl+C to cancel.[/dim]")
    console.print()
    
    lines = []
    empty_count = 0
    
    try:
        while True:
            line = input()
            if line == "":
                empty_count += 1
                if empty_count >= 2:
                    break
            else:
                empty_count = 0
            lines.append(line)
    except EOFError:
        pass
    
    plan_json = "\n".join(lines).strip()
    
    if not plan_json:
        console.print("[red]No plan provided[/red]")
        sys.exit(1)
    
    try:
        plan = json.loads(plan_json)
        return plan
    except json.JSONDecodeError as e:
        console.print(f"[red]Invalid JSON:[/red] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
