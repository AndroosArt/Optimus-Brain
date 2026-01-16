import OpenAI from 'openai';
import { OptimusSettings } from './settings';
import { UserMemory } from './memory';
import { CAPABILITIES } from './capabilities';
import { PlannerResponse, Plan } from './planner';

// Lazy load
let openaiClient: OpenAI | null = null;
function getOpenAIClient() {
    if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openaiClient;
}

// ------------------------------------------------------------------
// AGENT PROMPTS (Specialized Personas)
// ------------------------------------------------------------------

const INTERPRETER_PROMPT = `
ROLE: INTERPRETER
GOAL: Analyze user request and conversation history to determine clear INTENT and GOALS.
CONSTRAINTS: Do not generate solutions. Do not check memory.
OUTPUT: Concise summary of what the user wants to achieve.
`;

const ARCHIVIST_PROMPT = (memory: UserMemory) => `
ROLE: ARCHIVIST
GOAL: Retrieve relevant preferences and constraints from the provided memory profile.
MEMORY PROFILE: ${JSON.stringify(memory)}
CONSTRAINTS: Do not interpret intent. Do not generate content.
OUTPUT: List of active constraints (e.g., "User prefers conciseness", "No sudo") relevant to the intent.
`;

const EXECUTOR_PROMPT = (caps: string) => `
ROLE: EXECUTOR
GOAL: Generate a concrete execution plan based on INTENT and CONSTRAINTS.
AVAILABLE TOOLS:
${caps}
CONSTRAINTS: Follow intent precisely. Do not expand scope. Use only available tools.
OUTPUT: JSON structure of the plan steps (rough draft).
`;

const AUDITOR_PROMPT = `
ROLE: AUDITOR
GOAL: Review the proposed plan for risks, quality issues, or inefficiency.
CONSTRAINTS: Do not rewrite the plan. Flag specific issues (Security, Efficiency, User Preference violation).
OUTPUT: "Pass" or a list of specific Critiques.
`;

const ORCHESTRATOR_PROMPT = (settings: OptimusSettings) => `
ROLE: ORCHESTRATOR (The Boss)
GOAL: Synthesize the Final Response for the user.
INPUTS: Intent, Constraints, Plan, Critique.
AUTHORITY: You are the ONLY agent who speaks to the user.
Directives:
1. If the plan is solid (Auditor passed), format it into the Final JSON.
2. If Auditor flagged serious risks, adjust the plan or ask a Clarifying Question.
3. Apply "Optimus 5.2" persona: Confident, Adaptive, No hedging.
4. ${settings.systemInstructions}

OUTPUT SCHEMA (STRICT JSON):
Same as standard PlannerResponse:
{ type: "plan", data: { ... } } OR { type: "question", ... } OR { type: "propose_agent", ... }
`;

// ------------------------------------------------------------------
// SWARM ENGINE
// ------------------------------------------------------------------

export class Swarm {
    private openai = getOpenAIClient();

    async run(
        objective: string,
        history: any[],
        settings: OptimusSettings,
        memory: UserMemory,
        title?: string
    ): Promise<PlannerResponse> {
        console.log("🐝 Swarm Initiated: " + objective.slice(0, 50));

        // 1. INTERPRETER
        const intent = await this.callAgent(INTERPRETER_PROMPT, `User Input: ${objective}\nHistory Context: ${history.length} msgs`);
        // console.log("1. Interpreter:", intent);

        // 2. ARCHIVIST
        const context = await this.callAgent(ARCHIVIST_PROMPT(memory), `Intent: ${intent}`);
        // console.log("2. Archivist:", context);

        // 3. EXECUTOR
        const caps = CAPABILITIES.filter(c => c.enabled).map(c => `- ${c.name}: ${c.description}`).join('\n');
        const planDraft = await this.callAgent(EXECUTOR_PROMPT(caps), `Intent: ${intent}\nConstraints: ${context}`);
        // console.log("3. Executor:", planDraft);

        // 4. AUDITOR
        const critique = await this.callAgent(AUDITOR_PROMPT, `Proposed Plan: ${planDraft}\nIntent: ${intent}`);
        // console.log("4. Auditor:", critique);

        // 5. ORCHESTRATOR (Final Arbitrator)
        // We provide the full context chain to the Orchestrator
        const metaContext = `
        [CHAIN OF CUSTODY]
        > INTERPRETER: ${intent}
        > ARCHIVIST: ${context}
        > EXECUTOR: ${planDraft}
        > AUDITOR: ${critique}
        `;

        const finalResponse = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: ORCHESTRATOR_PROMPT(settings) },
                { role: "user", content: `Objective: ${objective}\n\n${metaContext}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const content = finalResponse.choices[0].message.content;
        if (!content) throw new Error("Orchestrator failed to produce output.");
        return JSON.parse(content) as PlannerResponse;
    }

    private async callAgent(system: string, user: string): Promise<string> {
        const res = await this.openai.chat.completions.create({
            model: "gpt-4o", // Using 4o-mini for speed on internal nodes? Or 4o for quality? User requested "Parity". 4o is safer.
            // I'll stick to 4o for now to meet quality.
            messages: [
                { role: "system", content: system },
                { role: "user", content: user }
            ],
            temperature: 0.1,
            max_tokens: 500 // Internal steps shouldn't be huge
        });
        return res.choices[0].message.content || "";
    }
}

export const swarm = new Swarm();
