'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/lib/persistence';
import { createDraftAgent } from '@/lib/agents';
import { MissionEvaluation } from '@/lib/evaluator';
import { OptimusSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import EvaluationView from '@/components/EvaluationView';
import SmartDirectiveInput from '@/components/SmartDirectiveInput';
import ThemeToggle from '@/components/ThemeToggle';
import SettingsPanel from '@/components/SettingsPanel';

type ViewMode = 'input' | 'evaluating' | 'evaluation';

export default function Home() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('input');
    const [objective, setObjective] = useState('');
    const [evaluation, setEvaluation] = useState<MissionEvaluation | null>(null);

    // Settings State
    const [settings, setSettings] = useState<OptimusSettings>(DEFAULT_SETTINGS);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleInitialEvaluate = async (directive: string) => {
        setViewMode('evaluating');
        setObjective(directive);

        try {
            const res = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objective: directive,
                    includeAdvisory: true,
                    externalClient: false
                })
            });

            if (!res.ok) throw new Error('Evaluation failed');

            const data = await res.json();
            setEvaluation(data.evaluation);
            setViewMode('evaluation');

        } catch (error) {
            console.error(error);
            alert("Mission Evaluation Failed. Check console.");
            setViewMode('input');
        }
    };

    const handleProceedToPlan = async (modifiedObjective: string) => {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objective: modifiedObjective,
                    title: evaluation?.title, // Pass title for ID generation
                    settings // Pass human-controlled settings
                })
            });

            if (!res.ok) throw new Error('Planning failed');

            const data = await res.json();

            // Handle Planner Feedback Logic
            if (data.status === 'question') {
                alert(`⚠️ PLANNER QUESTION:\n\n${data.question}\n\nPlease update your objective in the input box to answer this.`);
                handleAbort(); // Go back to input
                setObjective(prev => prev + `\n\n[Answer to: ${data.question}] `); // Helper
                return;
            }

            if (data.status === 'capability_gap') {
                alert(`🛑 CAPABILITY GAP:\n\n${data.message}`);
                handleAbort(); // Go back to input
                return;
            }

            if (data.status === 'propose_agent') {
                const draft = createDraftAgent(data.agent);
                try {
                    await fetch('/api/agents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(draft)
                    });
                    alert(`🦅 AGENT PROPOSED: ${data.agent.name}\n\nDraft created in Registry.`);
                    router.push('/agents');
                } catch (e) {
                    alert("Failed to save agent proposal.");
                }
                return;
            }

            saveSession({
                ...data.plan,
                id: data.sessionId,
                title: evaluation?.title || "Untitled Mission",
                status: 'PLANNED',
                evaluation
            });
            router.push(`/sessions/${data.sessionId}`);
        } catch (error) {
            console.error(error);
            alert("Planning Failed. Check console.");
        }
    };

    const handleAbort = () => {
        setViewMode('input');
        setEvaluation(null);
        // setObjective(''); // Keep objective so they can edit it
    };

    // Show evaluation view if in evaluation mode
    if (viewMode === 'evaluation' && evaluation) {
        return (
            <EvaluationView
                evaluation={evaluation}
                onProceed={handleProceedToPlan}
                onCancel={handleAbort}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-500 relative font-sans">
            {/* Settings Modal */}
            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={setSettings}
            />

            {/* Navigation & Controls */}
            <div className="absolute top-6 left-6 z-10 flex gap-3">
                <a href="/sessions" className="px-4 py-2 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:bg-forest-50 dark:hover:bg-forest-500/10 hover:border-forest-500 hover:text-forest-600 dark:hover:text-forest-400 transition-all">
                    Mission History
                </a>
                <a href="/agents" className="px-4 py-2 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:bg-forest-50 dark:hover:bg-forest-500/10 hover:border-forest-500 hover:text-forest-600 dark:hover:text-forest-400 transition-all">
                    Agent Registry
                </a>
            </div>

            <div className="absolute top-6 right-6 z-10 flex gap-3">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="System Settings"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <ThemeToggle />
            </div>

            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-6xl font-bold tracking-tighter text-gray-900 dark:text-white mb-3 font-sans transition-colors">
                        Optimus
                    </h1>
                    <p className="text-lg text-gray-400 font-medium tracking-wide">
                        Autonomous Execution Authority
                    </p>
                </div>

                <div className="relative group">
                    {/* Glow effect based on mode */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-10 group-hover:opacity-15 blur-xl transition duration-500"></div>

                    {viewMode === 'input' || viewMode === 'evaluating' ? (
                        <SmartDirectiveInput
                            onEvaluate={handleInitialEvaluate}
                            initialValue={objective} // Allow editing previous objective if aborted
                        />
                    ) : null}

                    {viewMode === 'evaluating' && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
                            <div className="w-12 h-12 border-4 border-forest-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="text-forest-600 font-bold tracking-widest uppercase text-sm">Analysing Mission...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
