import OpenAI from 'openai';
import { TOOLS_LIST } from './planner';

// Lazy load OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface MissionEvaluation {
  title: string; // Concise mission title
  summary: {
    objective: string;
    systems_affected: string[];
    complexity_rating: 'Low' | 'Medium' | 'High' | 'Extreme';
    success_criteria: string;
  };
  classification: 'Utility' | 'Strategic' | 'Revenue-generating' | 'Experimental' | 'Critical Infrastructure';
  costs: {
    range: "Low" | "Expected" | "High";
    drivers: string[];
    estimate_usd?: string;
  };
  risks: {
    description: string;
    why_it_matters: string;
    mitigation: string;
  }[];
  value: {
    overall_score: number; // 0-10
    cost_to_value_rating: "Excellent" | "Good" | "Fair" | "Poor";
    breakdown: {
      time_leverage: number;
      economic_impact: number;
      speed_to_outcome: number;
      reusability: number;
      risk_profile: number;
      social_impact: number;
    };
    reasoning: string;
    confidence: "High" | "Medium" | "Low";
  };
  assumptions: string[];
  recommended_next_steps: string[];
  advisory?: {
    effectiveness_suggestions: {
      what: string;
      why: string;
      upside: string;
    }[];
    unforeseen_risks: string[];
    low_hanging_leverage: string[];
  };
  pricing?: {
    low: string;
    expected: string;
    high: string;
    rationale: string;
  };
}

export async function evaluateMission(
  objective: string,
  includeAdvisory: boolean = true,
  externalClient: boolean = false
): Promise<MissionEvaluation> {
  const systemPrompt = `You are an internal operator intelligence system for Optimus, an autonomous execution platform.
Your job is to CRITICALLY evaluate a mission objective before execution.

Output JSON ONLY.

Schema:
{
  "title": "A concise, punchy title for this mission (max 6 words)",
  "classification": "Revenue-generating | Cost-reducing | Infrastructure | Operational | Experimental | Maintenance",
  "summary": {
    "objective": "Clear restatement of what is being attempted",
    "systems_affected": ["List of systems/tools/people affected"],
    "complexity_rating": "Low | Medium | High | Extreme",
    "success_criteria": "What success looks like"
  },
  "costs": {
    "range": "Low | Expected | High",
    "drivers": ["Primary cost drivers"],
    "estimate_usd": "Optional: $X - $Y range"
  },
  "risks": [
    {
      "description": "Concrete risk",
      "why_it_matters": "Impact explanation",
      "mitigation": "How to reduce risk"
    }
  ],
  "value": {
    "overall_score": 7.5,
    "cost_to_value_rating": "Excellent | Good | Fair | Poor",
    "breakdown": {
      "time_leverage": 8.0,
      "economic_impact": 7.0,
      "speed_to_outcome": 9.0,
      "reusability": 6.0,
      "risk_profile": 8.0,
      "social_impact": 7.0
    },
    "reasoning": "Detailed explanation of scoring, highlighting leverage and deficits",
    "confidence": "High | Medium | Low"
  },
  "assumptions": ["List critical assumptions made during analysis"],
  "recommended_next_steps": ["Step 1", "Step 2", "Step 3 (e.g. Proceed, Refine Scope, or Abort)"]${includeAdvisory ? `,
  "advisory": {
    "effectiveness_suggestions": [
      {
        "what": "Suggestion",
        "why": "Why it matters",
        "upside": "Expected benefit"
      }
    ],
    "unforeseen_risks": ["Edge cases"],
    "low_hanging_leverage": ["Quick wins"]
  }` : ''}${externalClient ? `,
  "pricing": {
    "low": "$X",
    "expected": "$Y",
    "high": "$Z",
    "rationale": "Pricing reasoning"
  }` : ''}
}

CRITICAL SCORING RULES:
1. **Conservative Scoring**: Value scores are 0-10 decimals. 
   - Unknown/Speculative Impact = 0.
   - Do NOT assign mid-range scores (5-7) to unknowns.
   - Score of 8.0+ requires PROVEN, EXCEPTIONAL leverage.
   - Score of <5.0 is standard for utility/maintenance.

2. **Suggestions**:
   - Only suggest improvements that MATERIALLY increase the Value Score.
   - If an improvement is generic ("add comments"), DO NOT include it.

3. **Social Impact**:
   - Considers trust, safety, transparency, and systemic effects.

4. **Honesty**:
   - List all assumptions in the "assumptions" field.
   - If the mission is vague, score confidence Low and recommend "Refine Scope".

5. **Style**:
   - Title must be punchy (max 6 words).
   - Tone: Professional, Socratic, Concise.`;

  const userPrompt = `Evaluate this mission:

Objective: ${objective}

${includeAdvisory ? 'INCLUDE advisory suggestions (effectiveness, risks, leverage).' : 'DO NOT include advisory suggestions.'}
${externalClient ? 'This is for an EXTERNAL CLIENT. Include pricing guidance.' : 'This is INTERNAL. Do not include pricing.'}`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || "{}";

    // Clean markdown if present
    let cleanJson = content.trim();
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.substring(7);
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.substring(3);
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.substring(0, cleanJson.length - 3);

    const evaluation = JSON.parse(cleanJson) as MissionEvaluation;

    return evaluation;
  } catch (error) {
    console.error("Mission evaluation failed:", error);
    throw new Error("Failed to evaluate mission");
  }
}
