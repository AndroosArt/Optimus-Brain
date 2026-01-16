import fs from 'fs/promises';
import path from 'path';

export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DEPRECATED';

export interface AgentDefinition {
    id: string;
    version: number;
    name: string;
    purpose: string;
    description: string;
    systemPrompt: string;
    tools: string[];
    permissions: string[];
    author: 'HUMAN' | 'OPTIMUS';
    created: string;
    lastModified: string;
    status: AgentStatus;
    approvalRequired: boolean;
    approvedBy?: string;
    approvalDate?: string;
}

const AGENTS_DIR = path.join(process.cwd(), 'governance', 'agents');

async function ensureDir() {
    try {
        await fs.access(AGENTS_DIR);
    } catch {
        await fs.mkdir(AGENTS_DIR, { recursive: true });
    }
}

export async function getServerAgents(): Promise<AgentDefinition[]> {
    await ensureDir();
    try {
        const files = await fs.readdir(AGENTS_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        const agents: AgentDefinition[] = [];
        for (const file of jsonFiles) {
            try {
                const content = await fs.readFile(path.join(AGENTS_DIR, file), 'utf-8');
                agents.push(JSON.parse(content));
            } catch (e) {
                console.error(`Failed to read agent file ${file}:`, e);
            }
        }
        return agents;
    } catch (e) {
        console.error("Failed to list agents:", e);
        return [];
    }
}

export async function saveServerAgent(agent: AgentDefinition): Promise<void> {
    await ensureDir();
    // Sanitize ID for filename
    const filename = `${agent.id.replace(/[^a-z0-9_-]/gi, '_')}.json`;
    const filepath = path.join(AGENTS_DIR, filename);

    await fs.writeFile(filepath, JSON.stringify(agent, null, 2), 'utf-8');
}
