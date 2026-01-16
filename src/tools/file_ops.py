"""File operations tools."""

import os
from pathlib import Path


def write_file(path: str, content: str) -> dict:
    """
    Write content to a file, creating directories as needed.
    
    Args:
        path: File path (relative or absolute)
        content: Content to write
    
    Returns:
        Result dict with message and bytes written
    """
    file_path = Path(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(file_path, "w", encoding="utf-8") as f:
        bytes_written = f.write(content)
    
    return {
        "message": f"Wrote {bytes_written} bytes to {path}",
        "path": str(file_path.absolute()),
        "bytes": bytes_written,
    }


def read_file(path: str) -> dict:
    """
    Read content from a file.
    
    Args:
        path: File path to read
    
    Returns:
        Result dict with content and size
    """
    file_path = Path(path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    return {
        "message": f"Read {len(content)} bytes from {path}",
        "content": content,
        "path": str(file_path.absolute()),
        "bytes": len(content),
    }


def edit_file(path: str, search: str, replace: str) -> dict:
    """
    Find and replace text in a file.
    
    Args:
        path: File path to edit
        search: Text to find
        replace: Text to replace with
    
    Returns:
        Result dict with replacement count
    """
    file_path = Path(path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    count = content.count(search)
    if count == 0:
        raise ValueError(f"Search text not found in {path}")
    
    new_content = content.replace(search, replace)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    return {
        "message": f"Replaced {count} occurrence(s) in {path}",
        "path": str(file_path.absolute()),
        "replacements": count,
    }
