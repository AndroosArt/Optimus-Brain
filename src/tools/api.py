import requests
import json
from typing import Optional, Dict, Union, Any

def api_request(
    method: str,
    url: str,
    headers: Optional[Dict[str, str]] = None,
    json_body: Optional[Union[Dict[str, Any], str]] = None
) -> Dict[str, Any]:
    """
    Make an HTTP request using the requests library.
    
    Args:
        method: HTTP method (GET, POST, PUT, DELETE, etc.)
        url: The URL to request
        headers: Optional dictionary of headers
        json_body: Optional JSON body (dict or string)
        
    Returns:
        Dictionary with keys:
        - status: int (HTTP status code)
        - content: dict or str (Response content)
        - error: str (Error message if any)
    """
    try:
        # Prepare arguments
        kwargs = {
            'timeout': 10,
            'headers': headers or {}
        }
        
        # Handle body
        if json_body:
            if isinstance(json_body, str):
                try:
                    kwargs['json'] = json.loads(json_body)
                except json.JSONDecodeError:
                    # Fallback to data if it's not valid JSON string but meant to be raw body?
                    # The prompt says json_body. We'll assume it's data if string.
                    # Actually standard requests usage for 'json' arg is a dict.
                    kwargs['data'] = json_body
            else:
                kwargs['json'] = json_body

        # Execute request
        response = requests.request(method, url, **kwargs)
        
        # Parse content
        try:
            content = response.json()
        except json.JSONDecodeError:
            content = response.text
            
        return {
            'status': response.status_code,
            'content': content
        }
        
    except requests.Timeout:
        return {
            'status': 408,
            'content': 'Request timed out after 10 seconds',
            'error': 'Timeout'
        }
    except requests.RequestException as e:
        return {
            'status': 500,
            'content': str(e),
            'error': 'RequestException'
        }
    except Exception as e:
        return {
            'status': 500,
            'content': f"Unexpected error: {str(e)}",
            'error': 'UnexpectedError'
        }
