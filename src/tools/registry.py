"""Tool registry and dispatcher."""

from typing import Any, Callable

from .file_ops import write_file, read_file, edit_file
from .git import git_commit, git_push
from .deploy import build_site, deploy
from .api import api_request
from .router import connect_module, generic_handler


# Registry of all available tools
TOOLS: dict[str, Callable] = {
    "write_file": write_file,
    "read_file": read_file,
    "edit_file": edit_file,
    "git_commit": git_commit,
    "git_push": git_push,
    "build_site": build_site,
    "deploy": deploy,
    "api_request": api_request,
    "connect_module": connect_module,
    "generic_handler": generic_handler,
}


def get_tool_names() -> list[str]:
    """Get list of all registered tool names."""
    return list(TOOLS.keys())


def execute_tool(tool_name: str, params: dict) -> dict[str, Any]:
    """
    Execute a tool by name with given parameters.
    
    Returns a dict with at minimum a 'message' key describing the result.
    """
    if tool_name not in TOOLS:
        raise ValueError(f"Unknown tool: {tool_name}")
    
    tool_func = TOOLS[tool_name]
    return tool_func(**params)
