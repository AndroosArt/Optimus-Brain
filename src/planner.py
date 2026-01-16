
import json
from .openai_client import chat_completion
from .tools import get_tool_names

class Planner:
    """Generates execution plans from high-level objectives."""
    
    def generate_plan(self, objective: str) -> dict:
        """
        Generate a JSON plan from a natural language objective.
        
        Args:
            objective: User's goal
            
        Returns:
            JSON plan dictionary
        """
        tools = get_tool_names()
        
        system_prompt = f"""You are an autonomous agent planner.
Your goal is to create a valid JSON execution plan for the user's objective.

Available Tools:
{', '.join(tools)}

Plan Format (JSON):
{{
  "name": "Short description of plan",
  "steps": [
    {{
      "tool": "tool_name",
      "description": "Why I am running this step",
      "params": {{
        "key": "value"
      }}
    }}
  ]
}}

Rules:
1. ONLY output valid JSON.
2. Do not use tools that are not listed.
4. For requests involving unknown services (e.g. "Shopify", "Asana", "Email"), USE "connect_module(domain, intent)".
5. For vague automation tasks, USE "generic_handler(intent, action)".
6. DO NOT hallucinate tools. If unsure, route to connect_module.
"""

        user_prompt = f"Objective: {objective}"
        
        response = chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        usage = response.usage
        
        # Calculate estimated cost (GPT-4o)
        # Input: $5.00 / 1M tokens
        # Output: $15.00 / 1M tokens
        input_cost = (usage.prompt_tokens / 1_000_000) * 5.00
        output_cost = (usage.completion_tokens / 1_000_000) * 15.00
        total_cost = input_cost + output_cost

        try:
            # Clean up potential markdown code blocks
            clean_json = content.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
                
            plan = json.loads(clean_json)
            
            # Inject Usage Metadata
            plan["meta"] = {
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                },
                "cost": {
                    "input": round(input_cost, 6),
                    "output": round(output_cost, 6),
                    "total": round(total_cost, 6),
                    "currency": "USD"
                },
                "model": response.model
            }
            
            return plan
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM plan: {e}")
