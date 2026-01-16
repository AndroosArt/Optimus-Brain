import { NextResponse } from 'next/server';
import { swarm } from '@/lib/swarm'; // New Swarm Engine
import { getMemory } from '@/lib/memory';
import crypto from 'crypto';

// Prevent pre-rendering (requires runtime OpenAI API key)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { objective, title, settings } = await request.json();

        if (!objective) {
            return NextResponse.json(
                { error: 'Objective is required' },
                { status: 400 }
            );
        }

        // Fetch Memory
        const memory = await getMemory();

        // Generate Plan (Swarm Architecture)
        const plannerResponse = await swarm.run(objective, [], settings, memory, title);

        // Handle Response Types
        if (plannerResponse.type === 'question') {
            return NextResponse.json({
                status: 'question',
                question: plannerResponse.question
            });
        }

        if (plannerResponse.type === 'capability_gap') {
            return NextResponse.json({
                status: 'capability_gap',
                message: plannerResponse.message
            });
        }

        if (plannerResponse.type === 'propose_agent') {
            return NextResponse.json({
                status: 'propose_agent',
                agent: plannerResponse.agent,
                sessionId: 'draft-agent' // Dummy ID
            });
        }

        // Success - Plan Generated
        const plan = plannerResponse.data;

        // Generate ID
        let sessionId: string = crypto.randomUUID();
        if (title) {
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 40);
            sessionId = `${slug}-${Date.now().toString().slice(-6)}`;
        }

        return NextResponse.json({
            status: 'success',
            sessionId,
            plan: {
                ...plan,
                id: sessionId,
                timestamp: new Date().toISOString(),
                status: 'PLANNED' // Ready for client to "Authorize"
            }
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: String(error) },
            { status: 500 }
        );
    }
}
