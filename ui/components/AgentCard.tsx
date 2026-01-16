'use client';

import { AgentDefinition } from '@/lib/agents';

interface AgentCardProps {
    agent: AgentDefinition;
    onClick: () => void;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
    return (
        <div
            onClick={onClick}
            className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer hover:border-forest-500 hover:-translate-y-1 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${agent.status === 'ACTIVE' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                        agent.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-500'
                    }`}>
                    {agent.status}
                </span>
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors">
                    {agent.name}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">v{agent.version} • {new Date(agent.lastModified).toLocaleDateString()}</p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                {agent.purpose}
            </p>

            <div className="flex items-center gap-2 mt-auto">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-md uppercase tracking-wide">
                    {agent.tools.length} Tools
                </div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-md uppercase tracking-wide">
                    {agent.author}
                </div>
            </div>
        </div>
    );
}
