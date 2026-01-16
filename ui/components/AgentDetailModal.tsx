import { useState, useEffect } from 'react';
import { AgentDefinition } from '@/lib/agents';
import { CAPABILITIES } from '@/lib/capabilities';

interface AgentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: AgentDefinition | null; // null = new
    onSave: () => void;
}

export default function AgentDetailModal({ isOpen, onClose, agent, onSave }: AgentDetailModalProps) {
    const [localAgent, setLocalAgent] = useState<Partial<AgentDefinition>>({});

    useEffect(() => {
        if (agent) {
            setLocalAgent(JSON.parse(JSON.stringify(agent)));
        } else {
            // New Agent Defaults
            setLocalAgent({
                name: '',
                purpose: '',
                description: '',
                systemPrompt: 'You are a specialized agent designed to...',
                tools: [],
                permissions: ['read'],
                status: 'DRAFT',
                author: 'HUMAN',
                approvalRequired: true
            });
        }
    }, [agent, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!localAgent.name || !localAgent.purpose) {
            alert("Name and Purpose are required.");
            return;
        }

        const now = new Date().toISOString();
        const finalAgent: AgentDefinition = {
            id: localAgent.id || crypto.randomUUID(),
            version: localAgent.version || 1,
            name: localAgent.name,
            purpose: localAgent.purpose,
            description: localAgent.description || '',
            systemPrompt: localAgent.systemPrompt || '',
            tools: localAgent.tools || [],
            permissions: localAgent.permissions || ['read'],
            author: localAgent.author as any || 'HUMAN',
            created: localAgent.created || now,
            lastModified: now,
            status: localAgent.status as any || 'DRAFT',
            approvalRequired: localAgent.approvalRequired ?? true
        };

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalAgent)
            });
            if (!res.ok) throw new Error("Failed to save");
            onSave();
            onClose();
        } catch (e) {
            alert("Failed to save agent to server.");
        }
    };

    const toggleTool = (toolName: string) => {
        const current = localAgent.tools || [];
        if (current.includes(toolName)) {
            setLocalAgent({ ...localAgent, tools: current.filter(t => t !== toolName) });
        } else {
            setLocalAgent({ ...localAgent, tools: [...current, toolName] });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 font-sans">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {agent ? (
                                <span className="flex items-center gap-3">
                                    {agent.name}
                                    <span className="text-[10px] bg-gray-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">v{agent.version}</span>
                                </span>
                            ) : 'New Agent Proposal'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                            {agent?.status || 'DRAFT'} • {agent?.author || 'HUMAN'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">Close</button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Identity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Name</span>
                            <input
                                type="text"
                                value={localAgent.name || ''}
                                onChange={e => setLocalAgent({ ...localAgent, name: e.target.value })}
                                className="mt-2 w-full p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-forest-500 outline-none font-bold"
                                placeholder="e.g. Code Reviewer Agent"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Purpose</span>
                            <input
                                type="text"
                                value={localAgent.purpose || ''}
                                onChange={e => setLocalAgent({ ...localAgent, purpose: e.target.value })}
                                className="mt-2 w-full p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-forest-500 outline-none"
                                placeholder="Concise goal description"
                            />
                        </label>
                    </div>

                    {/* System Prompt */}
                    <label className="block">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">System Instructions (Prompt Fragment)</span>
                        <textarea
                            value={localAgent.systemPrompt || ''}
                            onChange={e => setLocalAgent({ ...localAgent, systemPrompt: e.target.value })}
                            className="mt-2 w-full h-40 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-forest-500 outline-none font-mono text-sm leading-relaxed resize-none"
                            placeholder="Define the agent's behavior, constraints, and personality..."
                        />
                    </label>

                    {/* Tools Selection */}
                    <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">Allowed Tools</span>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {CAPABILITIES.map(cap => (
                                <label key={cap.name} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${(localAgent.tools || []).includes(cap.name)
                                    ? 'bg-forest-50 border-forest-500 dark:bg-forest-900/20 dark:border-forest-500/50'
                                    : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={(localAgent.tools || []).includes(cap.name)}
                                        onChange={() => toggleTool(cap.name)}
                                        className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
                                    />
                                    <div>
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{cap.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">{cap.permission}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Governance */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-500 uppercase tracking-wide mb-2">Governance Review</h4>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-bold">Status:</span>
                                <select
                                    value={localAgent.status}
                                    onChange={e => setLocalAgent({ ...localAgent, status: e.target.value as any })}
                                    className="ml-2 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded p-1"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="ACTIVE">Active (Approved)</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </label>
                            {localAgent.status === 'ACTIVE' && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Approved for Use
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-gray-200 transition">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg hover:bg-black dark:hover:bg-gray-200 transition shadow-lg">
                        {agent ? 'Update Agent' : 'Create Agent Proposal'}
                    </button>
                </div>
            </div>
        </div>
    );
}
