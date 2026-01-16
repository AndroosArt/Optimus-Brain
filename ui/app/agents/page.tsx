'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AgentDefinition } from '@/lib/agents';
import AgentCard from '@/components/AgentCard';
import AgentDetailModal from '@/components/AgentDetailModal';
import ThemeToggle from '@/components/ThemeToggle';

export default function AgentRegistryPage() {
    const [agents, setAgents] = useState<AgentDefinition[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');

    const loadAgents = async () => {
        try {
            const res = await fetch('/api/agents');
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
            }
        } catch (e) {
            console.error("Failed to load agents", e);
        }
    };

    useEffect(() => {
        loadAgents();
    }, []);

    const handleCreateNew = () => {
        setSelectedAgent(null);
        setIsModalOpen(true);
    };

    const handleSelectAgent = (agent: AgentDefinition) => {
        setSelectedAgent(agent);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        loadAgents();
    };

    const filteredAgents = agents.filter(a => {
        if (filter === 'ALL') return true;
        return a.status === filter;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans p-8 transition-colors duration-500">
            <AgentDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                agent={selectedAgent}
                onSave={handleSave}
            />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Agent Registry</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage persistent, specialized agents and their permissions.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <ThemeToggle />
                        <Link href="/" className="px-5 py-2.5 rounded-lg font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition">
                            Back to Mission Control
                        </Link>
                        <button
                            onClick={handleCreateNew}
                            className="px-5 py-2.5 bg-forest-500 hover:bg-forest-600 text-white font-bold rounded-lg shadow-lg shadow-forest-500/20 transition-all hover:-translate-y-0.5"
                        >
                            + Propose New Agent
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-zinc-800 pb-4">
                    {(['ALL', 'ACTIVE', 'DRAFT'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${filter === f
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgents.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            onClick={() => handleSelectAgent(agent)}
                        />
                    ))}

                    {/* Empty State */}
                    {filteredAgents.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                            <p className="text-gray-400 font-bold mb-4">No agents found.</p>
                            <button onClick={handleCreateNew} className="text-forest-500 font-bold hover:underline">Propose the first one</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
