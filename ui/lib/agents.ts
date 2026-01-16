import { CAPABILITIES } from './capabilities';

export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DEPRECATED';

export interface AgentDefinition {
    id: string;
    version: number;
    name: string;
    purpose: string; // concise goal
    description: string; // logic/behavior description
    systemPrompt: string; // The instructions implementation
    tools: string[]; // List of allowed tool names
    permissions: string[]; // "read", "write", "network", etc.

    // Metadata
    author: 'HUMAN' | 'OPTIMUS';
    created: string;
    lastModified: string;
    status: AgentStatus;

    // Governance
    approvalRequired: boolean;
    approvedBy?: string;
    approvalDate?: string;
}

const STORAGE_KEY = 'optimus_agents';

export function getAgents(): AgentDefinition[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load agents", e);
        return [];
    }
}

export function getAgent(id: string): AgentDefinition | undefined {
    return getAgents().find(a => a.id === id);
}

export function saveAgent(agent: AgentDefinition) {
    const agents = getAgents();
    const index = agents.findIndex(a => a.id === agent.id);

    if (index >= 0) {
        // Update existing (Simple versioning: increment if changed? For now just overwrite)
        // User wants Versioning.
        // Ideally we keep history. But for localStorage simple array, maybe we just increment version on save.
        const existing = agents[index];
        const isModified = JSON.stringify(existing) !== JSON.stringify(agent); // rough check
        if (isModified) {
            agent.version = existing.version + 1;
            agent.lastModified = new Date().toISOString();
        }
        agents[index] = agent;
    } else {
        agents.push(agent);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

export function createDraftAgent(proposal: Partial<AgentDefinition>): AgentDefinition {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        version: 1,
        name: proposal.name || "Unnamed Agent",
        purpose: proposal.purpose || "No purpose defined",
        description: proposal.description || "",
        systemPrompt: proposal.systemPrompt || "You are a helpful agent.",
        tools: proposal.tools || [],
        permissions: proposal.permissions || ['read'],
        author: proposal.author || 'OPTIMUS',
        created: now,
        lastModified: now,
        status: 'DRAFT',
        approvalRequired: true
    };
}
