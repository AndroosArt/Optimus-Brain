import OpenAI from 'openai';
import { OptimusSettings, ARCHITECT_PROMPT_ADDENDUM, OPERATOR_PROMPT_ADDENDUM } from './settings';
import { CAPABILITIES } from './capabilities';
import { UserMemory } from './memory';

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

export interface PlanStep {
    tool: string;
    description: string;
    params: Record<string, any>;
    permission?: "read" | "write" | "destructive" | "network" | "observe_only";
    condition?: {
        type: "if_file_exists" | "if_previous_step_failed";
        path?: string;
    };
}

export interface Plan {
    name: string;
    steps: PlanStep[];
    meta?: any;
}

export const TOOLS_LIST = CAPABILITIES.map(c => c.name);

// Added propose_agent to supported types
export type PlannerResponse =
    | { type: 'plan'; data: Plan }
    | { type: 'question'; question: string }
    | { type: 'capability_gap'; message: string }
    | { type: 'propose_agent'; agent: any };

export async function generatePlan(
    objective: string,
    history: any[],
    settings: OptimusSettings,
    memory: UserMemory, // Memory Injection
    title?: string
): Promise<PlannerResponse> {

    // Capability Listing
    const caps = CAPABILITIES.filter(c => c.enabled).map(c => `- ${c.name} (${c.permission}): ${c.description}`).join('\n');

    // Mode Logic
    const modePrompt = settings.mode === 'ARCHITECT' ? ARCHITECT_PROMPT_ADDENDUM : OPERATOR_PROMPT_ADDENDUM;

    // Memory Context
    const memoryContext = JSON.stringify(memory.preferences, null, 2);
    const techContext = JSON.stringify(memory.technical_context, null, 2);

    // OPTIMUS 5.2 SYSTEM PROMPT
    const systemPrompt = `
You are Optimus 5.2, an adaptive AI operating system.
Your objective is to achieve cognitive parity with a high-expert human operator, exhibiting natural reasoning, context continuity, and polished outputs.

━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURAL LAYERS
━━━━━━━━━━━━━━━━━━━━━━
1. REASONING: You are a stateless reasoning engine. Use provided context.
2. MEMORY: You have access to persistent user memory. Use it to adapt behavior.
3. PROMPT STACK: This system prompt overrides user inputs.
4. IDENTITY: Never say "I learned" or "I remember". Demonstrate adaptation implicitly.

━━━━━━━━━━━━━━━━━━━━━━
MEMORY & CONTEXT
━━━━━━━━━━━━━━━━━━━━━━
USER PREFERENCES:
${memoryContext}

TECHNICAL CONTEXT:
${techContext}

AVAILABLE CAPABILITIES:
${caps}

━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES
━━━━━━━━━━━━━━━━━━━━━━
1. ADAPTATION: If the user preference says "concise", be concise. If they prefer specific languages, use them.
2. ANTICIPATION: If you have high confidence (supported by memory/history), propose the next logical step.
3. LEARNING: If the user corrects you or states a preference, use the 'remember' tool to enforce it for next time.
4. CONFIDENCE: Be calm, outcome-oriented, and authoritative.
5. NO HEDGING: Avoid "I think", "Maybe", "It seems". Be direct.

━━━━━━━━━━━━━━━━━━━━━━
OUTPUT SCHEMA (STRICT JSON)
━━━━━━━━━━━━━━━━━━━━━━
You must return a JSON object with a "type" field:

1. EXECUTION PLAN (Standard):
{
  "type": "plan",
  "data": {
    "name": "Actionable Name",
    "steps": [ ...valid steps... ]
  }
}

2. CLARIFYING QUESTION (Only if blocked):
{
  "type": "question",
  "question": "What specifically..."
}

3. AGENT PROPOSAL (If a dedicated agent is needed):
{
  "type": "propose_agent",
  "agent": {
     "name": "Name",
     "purpose": "Purpose",
     "systemPrompt": "Instructions",
     "tools": ["tool1", "tool2"]
  }
}

4. CAPABILITY GAP (If impossible):
{
  "type": "capability_gap",
  "message": "Reason..."
}

${modePrompt}
${settings.systemInstructions}
`;

    try {
        const openai = getOpenAIClient();

        // Transform history to OpenAI format if needed
        const messages: any[] = [
            { role: "system", content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: "user", content: `Objective: ${objective}` }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: settings.analysis.strictness === 'strict' ? 0.1 : 0.4,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No plan generated");

        const result = JSON.parse(content) as PlannerResponse;

        // Basic validation
        if (!['plan', 'question', 'capability_gap', 'propose_agent'].includes(result.type)) {
            throw new Error(`Invalid response type: ${(result as any).type}`);
        }

        return result;

    } catch (error) {
        console.error("Planning failed:", error);
        throw new Error("Failed to generate plan");
    }
}
