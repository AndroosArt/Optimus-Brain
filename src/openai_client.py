"""OpenAI API client wrapper."""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def get_client() -> OpenAI:
    """Get configured OpenAI client."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY not found. "
            "Copy .env.example to .env and add your key."
        )
    return OpenAI(api_key=api_key)


def chat_completion(
    messages: list[dict],
    model: str = "gpt-4o",
    temperature: float = 0.7,
) -> str:
    """
    Get a chat completion from OpenAI.
    
    Returns the full response object to allow access to usage stats.
    """
    client = get_client()
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    return response
