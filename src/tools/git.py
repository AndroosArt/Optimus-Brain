"""Git operations tools."""

import subprocess
from pathlib import Path


def _run_git(args: list[str], cwd: str = ".") -> str:
    """Run a git command and return output."""
    result = subprocess.run(
        ["git"] + args,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Git error: {result.stderr.strip()}")
    
    return result.stdout.strip()


def git_commit(message: str, files: list[str] = None, cwd: str = ".") -> dict:
    """
    Stage files and create a commit.
    
    Args:
        message: Commit message
        files: List of files to stage (None = all changes)
        cwd: Working directory
    
    Returns:
        Result dict with commit info
    """
    # Stage files
    if files:
        for file in files:
            _run_git(["add", file], cwd)
    else:
        _run_git(["add", "-A"], cwd)
    
    # Check if there's anything to commit
    status = _run_git(["status", "--porcelain"], cwd)
    if not status:
        return {
            "message": "Nothing to commit",
            "committed": False,
        }
    
    # Create commit
    output = _run_git(["commit", "-m", message], cwd)
    
    # Get commit hash
    commit_hash = _run_git(["rev-parse", "--short", "HEAD"], cwd)
    
    return {
        "message": f"Created commit {commit_hash}",
        "hash": commit_hash,
        "committed": True,
    }


def git_push(remote: str = "origin", branch: str = None, cwd: str = ".") -> dict:
    """
    Push commits to remote.
    
    Args:
        remote: Remote name (default: origin)
        branch: Branch name (default: current branch)
        cwd: Working directory
    
    Returns:
        Result dict with push info
    """
    # Get current branch if not specified
    if not branch:
        branch = _run_git(["rev-parse", "--abbrev-ref", "HEAD"], cwd)
    
    # Push
    output = _run_git(["push", remote, branch], cwd)
    
    return {
        "message": f"Pushed to {remote}/{branch}",
        "remote": remote,
        "branch": branch,
    }
