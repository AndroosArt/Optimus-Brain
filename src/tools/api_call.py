"""HTTP API call wrapper tool."""

import httpx
from typing import Any


def http_request(
    method: str,
    url: str,
    headers: dict = None,
    body: Any = None,
    timeout: float = 30.0,
) -> dict:
    """
    Make an HTTP request.
    
    Args:
        method: HTTP method (GET, POST, PUT, DELETE, etc.)
        url: Request URL
        headers: Optional headers dict
        body: Optional request body (will be sent as JSON if dict)
        timeout: Request timeout in seconds
    
    Returns:
        Result dict with response data
    """
    method = method.upper()
    headers = headers or {}
    
    with httpx.Client(timeout=timeout) as client:
        if method == "GET":
            response = client.get(url, headers=headers)
        elif method == "POST":
            response = client.post(url, headers=headers, json=body)
        elif method == "PUT":
            response = client.put(url, headers=headers, json=body)
        elif method == "PATCH":
            response = client.patch(url, headers=headers, json=body)
        elif method == "DELETE":
            response = client.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
    
    # Try to parse JSON response
    try:
        response_body = response.json()
    except Exception:
        response_body = response.text[:2000]  # Truncate text responses
    
    return {
        "message": f"{method} {url} → {response.status_code}",
        "status_code": response.status_code,
        "headers": dict(response.headers),
        "body": response_body,
        "success": 200 <= response.status_code < 300,
    }
