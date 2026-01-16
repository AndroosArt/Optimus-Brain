import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force dynamic to allow runtime execution
export const dynamic = 'force-dynamic';

let openaiClient: OpenAI | null = null;
function getOpenAIClient() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        const openai = getOpenAIClient();

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are the Optimus Cortex, an elite technical architect and internal operator.
Your goal is to "Elevate" the user's idea into a sophisticated directive.

INTERACTION & STYLE GUIDELINES (CRITICAL):
1. **Be Socratic**: If intent/scope is unclear, ask *one* precise clarifying question. Do not assume.
2. **Be Concise**: Short sentences. No fluff. No marketing language.
3. **Be Direct**: Start with the core insight or critical analysis.
4. **Use Visuals**: Use visual separators (e.g., "--------------------------") and bold text (*bold*) for emphasis.
5. **No Dead Ends**: EVERY response must end with clear "Recommended Next Steps".

FORMAT:
[Analysis/Insight]

[Visual Separator]

[Clarifying Question (Only if needed)]

[Visual Separator]

Recommended Next Steps:
- Option A: [Action]
- Option B: [Action]`
                },
                ...messages
            ],
            temperature: 0.7,
        });

        const reply = response.choices[0].message.content;

        return NextResponse.json({ reply });

    } catch (error) {
        console.error("Brainstorming API Error:", error);
        return NextResponse.json({ error: "Brainstorming failed" }, { status: 500 });
    }
}
