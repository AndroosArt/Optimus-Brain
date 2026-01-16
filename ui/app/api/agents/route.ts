import { NextResponse } from 'next/server';
import { getServerAgents, saveServerAgent, AgentDefinition } from '@/lib/agent_service';

export async function GET() {
    try {
        const agents = await getServerAgents();
        return NextResponse.json(agents);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const agent = await req.json() as AgentDefinition;
        if (!agent.id || !agent.name) {
            return NextResponse.json({ error: 'Invalid agent definition' }, { status: 400 });
        }

        await saveServerAgent(agent);
        return NextResponse.json({ status: 'success', agent });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save agent' }, { status: 500 });
    }
}
