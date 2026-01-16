'use client';

import { useState, useEffect } from 'react';
import { OptimusSettings, DEFAULT_SETTINGS, OptimusMode } from '@/lib/settings';
import { CAPABILITIES } from '@/lib/capabilities';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: OptimusSettings;
    onSave: (newSettings: OptimusSettings) => void;
}

export default function SettingsPanel({ isOpen, onClose, settings, onSave }: SettingsPanelProps) {
    const [localSettings, setLocalSettings] = useState<OptimusSettings>(settings);
    const [activeTab, setActiveTab] = useState<'general' | 'instructions' | 'capabilities'>('general');

    // Sync when opening
    useEffect(() => {
        if (isOpen) setLocalSettings(settings);
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Configuration</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Human Control Interface</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-zinc-800 px-6">
                    {(['general', 'instructions', 'capabilities'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-forest-500 text-forest-600 dark:text-forest-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-900">

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            {/* Mode Selection */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Operational Mode</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['OPERATOR', 'ARCHITECT'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setLocalSettings({ ...localSettings, mode })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${localSettings.mode === mode
                                                    ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/10 ring-1 ring-forest-500'
                                                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                                                }`}
                                        >
                                            <div className={`font-bold mb-1 ${localSettings.mode === mode ? 'text-forest-700 dark:text-forest-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {mode}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                {mode === 'OPERATOR'
                                                    ? 'Execution focused. Concise. Actions over words. Hides architecture details.'
                                                    : 'Design focused. Explains reasoning. Discusses system architecture.'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Analysis Controls */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Analysis Configuration</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Verbosity</span>
                                        <select
                                            value={localSettings.analysis.verbosity}
                                            onChange={(e) => setLocalSettings({ ...localSettings, analysis: { ...localSettings.analysis, verbosity: e.target.value as any } })}
                                            className="mt-2 block w-full rounded-md border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-2 text-sm font-sans"
                                        >
                                            <option value="low">Low (Concise)</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High (Verbose)</option>
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Risk Tolerance</span>
                                        <select
                                            value={localSettings.analysis.riskTolerance}
                                            onChange={(e) => setLocalSettings({ ...localSettings, analysis: { ...localSettings.analysis, riskTolerance: e.target.value as any } })}
                                            className="mt-2 block w-full rounded-md border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-2 text-sm font-sans"
                                        >
                                            <option value="conservative">Conservative</option>
                                            <option value="normal">Normal</option>
                                            <option value="aggressive">Aggressive</option>
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Scoring Strictness</span>
                                        <select
                                            value={localSettings.analysis.strictness}
                                            onChange={(e) => setLocalSettings({ ...localSettings, analysis: { ...localSettings.analysis, strictness: e.target.value as any } })}
                                            className="mt-2 block w-full rounded-md border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-2 text-sm font-sans"
                                        >
                                            <option value="strict">Strict (0 for Unknowns)</option>
                                            <option value="relaxed">Relaxed</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INSTRUCTIONS TAB */}
                    {activeTab === 'instructions' && (
                        <div className="h-full flex flex-col">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">System Instructions</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                These instructions are injected into the Planner's system context.
                                Use this to enforce persona, constraints, or specific behaviors.
                            </p>
                            <textarea
                                value={localSettings.systemInstructions}
                                onChange={(e) => setLocalSettings({ ...localSettings, systemInstructions: e.target.value })}
                                className="flex-1 w-full bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded-lg p-4 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-forest-500 outline-none resize-none"
                                spellCheck={false}
                            />
                        </div>
                    )}

                    {/* CAPABILITIES TAB */}
                    {activeTab === 'capabilities' && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Registered Capabilities</h3>
                            <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Tool</th>
                                            <th className="p-4">Description</th>
                                            <th className="p-4">Permission</th>
                                            <th className="p-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {CAPABILITIES.map(cap => (
                                            <tr key={cap.name} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-4 font-mono font-bold text-gray-800 dark:text-gray-300">{cap.name}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{cap.description}</td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${cap.permission === 'read' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                            cap.permission === 'write' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                                                cap.permission === 'destructive' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                                                    cap.permission === 'observe_only' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                                                                        'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                        }`}>
                                                        {cap.permission}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {cap.enabled ? (
                                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                                    ) : (
                                                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg hover:bg-black dark:hover:bg-gray-200 transition shadow-lg"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
