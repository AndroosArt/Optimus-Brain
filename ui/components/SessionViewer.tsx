'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSession, Session, PlanStep } from '@/lib/persistence';
import { Executor } from '@/lib/executor';

export default function SessionViewer({ id }: { id: string }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExecuting, setIsExecuting] = useState(false);

    // Governance State
    const [elevationRequest, setElevationRequest] = useState<PlanStep | null>(null);
    const [elevationResolver, setElevationResolver] = useState<((allow: boolean) => void) | null>(null);

    useEffect(() => {
        const data = getSession(id);
        if (data) {
            setSession(data);
            setIsExecuting(data.status === 'EXECUTING');
        }
        setLoading(false);
    }, [id]);

    const handleExecute = () => {
        if (!session) return;

        setIsExecuting(true);
        // Persist local state update immediately
        // Note: Real state sync happens via callback
        const executor = new Executor(session,
            (updatedSession) => {
                setSession(updatedSession);
                setIsExecuting(updatedSession.status === 'EXECUTING' || updatedSession.status === 'AWAITING_AUTHORIZATION');
            },
            // Governance Interceptor
            (step) => {
                setElevationRequest(step);
                return new Promise((resolve) => {
                    // Store the resolve function to call it later
                    setElevationResolver(() => resolve);
                });
            }
        );
        executor.executePlan();
    };

    const handleAuthorize = (allowed: boolean) => {
        if (elevationResolver) {
            elevationResolver(allowed);
            setElevationResolver(null);
            setElevationRequest(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-zinc-700 border-t-forest-600 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-sans text-sm">Accessing Mission Log...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="p-8 font-sans max-w-4xl mx-auto min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 w-full">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Session Not Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">The requested mission log is unavailable or has expired from local storage.</p>
                    <Link href="/" className="text-forest-600 dark:text-forest-400 font-bold hover:underline">Return to Base</Link>
                </div>
            </div>
        );
    }

    // Determine if execution is allowed
    const canExecute = session.status === 'PLANNED' || session.status === 'FAILED';

    return (
        <div className="p-8 font-sans max-w-4xl mx-auto min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors relative">

            {/* GOVERNANCE MODAL */}
            {elevationRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden border-2 border-red-500 animate-in zoom-in-95 duration-200">
                        <div className="bg-red-500 p-6 flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Elevated Access Required</h2>
                                <p className="text-red-100 text-sm">Stop & Verify this action.</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                The system is attempting to execute a command with <strong>ELEVATED PRIVILEGES</strong>.
                                This requires explicit human authorization to proceed.
                            </p>

                            <div className="bg-gray-50 dark:bg-black/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 font-mono text-sm mb-6">
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                    <span>Tool: {elevationRequest.tool}</span>
                                    <span>Permission: {elevationRequest.permission || 'UNKNOWN'}</span>
                                </div>
                                <div className="text-gray-900 dark:text-white break-all">
                                    {JSON.stringify(elevationRequest.params)}
                                </div>
                            </div>

                            <p className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/10 p-3 rounded mb-6 text-center">
                                ERROR: This action cannot be auto-approved.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleAuthorize(false)}
                                    className="p-3 rounded-lg border border-gray-300 dark:border-zinc-700 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                                >
                                    DENY ACCESS
                                </button>
                                <button
                                    onClick={() => handleAuthorize(true)}
                                    className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg transition"
                                >
                                    AUTHORIZE ELEVATION
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <Link href="/sessions" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-bold uppercase tracking-wide mb-4 inline-block">
                    &larr; Return to Logs
                </Link>
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                                {session.title || "Untitled Mission"}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed border-l-2 border-gray-200 dark:border-zinc-700 pl-3">
                                {session.objective}
                            </p>
                        </div>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${session.status === 'COMPLETED' ? 'bg-forest-50 text-forest-600 border border-forest-200 dark:bg-forest-900/20 dark:text-forest-400 dark:border-forest-800' :
                            session.status === 'EXECUTING' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                                session.status === 'AWAITING_AUTHORIZATION' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 animate-pulse' :
                                    session.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                        'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                            }`}>
                            {session.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400 font-mono border-t border-gray-50 dark:border-zinc-800 pt-4 mt-4">
                        <span><strong className="text-gray-700 dark:text-gray-300">ID:</strong> {session.id}</span>
                        <span><strong className="text-gray-700 dark:text-gray-300">Date:</strong> {new Date(session.timestamp).toLocaleString()}</span>
                        {session.meta?.cost && (
                            <>
                                <span><strong className="text-gray-700 dark:text-gray-300">Cost:</strong> <span className="text-forest-600 dark:text-forest-400 font-bold">${session.meta.cost.total.toFixed(5)}</span></span>
                                <span><strong className="text-gray-700 dark:text-gray-300">Tokens:</strong> {session.meta.usage?.total_tokens}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Execution Control Panel */}
            <div className={`mb-8 bg-white dark:bg-zinc-900 border p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${session.status === 'AWAITING_AUTHORIZATION' ? 'border-red-500 shadow-red-500/20' : 'border-forest-200 dark:border-forest-900/50'
                }`}>
                <div>
                    <h3 className={`text-lg font-bold mb-1 ${session.status === 'AWAITING_AUTHORIZATION' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {isExecuting ? 'Execution in Progress' :
                            session.status === 'COMPLETED' ? 'Mission Accomplished' :
                                session.status === 'FAILED' ? 'Mission Failed' :
                                    session.status === 'AWAITING_AUTHORIZATION' ? 'Action Required: Authorization' :
                                        'Ready to Execute'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isExecuting ? 'Optimus is executing the plan steps...' :
                            session.status === 'COMPLETED' ? 'All steps completed successfully.' :
                                session.status === 'FAILED' ? 'Execution halted due to an error.' :
                                    session.status === 'AWAITING_AUTHORIZATION' ? 'A high-privilege action requires your approval.' :
                                        'Review the proposed execution plan below. Authorization required to proceed.'}
                    </p>
                </div>
                <div>
                    <button
                        onClick={handleExecute}
                        disabled={!canExecute}
                        className={`font-bold py-3 px-8 rounded-md shadow-sm uppercase tracking-wide text-sm transition-all flex items-center gap-2 ${canExecute
                            ? 'bg-forest-600 text-white hover:bg-forest-700 hover:shadow-md'
                            : 'bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 cursor-not-allowed'
                            }`}
                    >
                        {isExecuting && (
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                        )}
                        {isExecuting ? 'Executing...' :
                            session.status === 'FAILED' ? 'Retry Execution' :
                                'Authorize Execution'}
                    </button>
                </div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider pl-1">Execution Log</h2>
            <div className="space-y-4">
                {session.steps?.map((step: any, index: number) => (
                    <div key={index} className={`bg-white dark:bg-zinc-900 border rounded-lg p-6 shadow-sm transition-colors ${step.result?.status === 'success' ? 'border-green-200 dark:border-green-900 ring-1 ring-green-100 dark:ring-green-900/20' :
                        step.result?.status === 'failure' ? 'border-red-200 dark:border-red-900 ring-1 ring-red-100 dark:ring-red-900/20' :
                            step.result?.status === 'skipped' ? 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/20 opacity-75' :
                                'border-gray-200 dark:border-zinc-800'
                        }`}>
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step.result?.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                    step.result?.status === 'failure' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                        'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 font-mono text-sm">{step.tool}</h3>
                                        {/* Permission Badge */}
                                        {(() => {
                                            const perms: Record<string, string> = {
                                                'write_file': 'WRITE',
                                                'edit_file': 'WRITE',
                                                'git_commit': 'WRITE',
                                                'git_push': 'NETWORK',
                                                'deploy': 'DESTRUCTIVE', // Enforced Gate
                                                'read_file': 'READ',
                                                'api_request': 'NETWORK',
                                                'build_site': 'EXECUTE'
                                            };
                                            const perm = perms[step.tool] || step.permission || 'READ';
                                            return (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${perm === 'WRITE' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                                    perm === 'NETWORK' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                                                        perm === 'DESTRUCTIVE' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                            'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                    }`}>
                                                    {perm}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {step.condition && (
                                        <div className="text-xs text-orange-600 dark:text-orange-400 font-mono mt-1">
                                            Condition: {step.condition.type} {step.condition.path ? `(${step.condition.path})` : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {step.result ? (
                                <span className={`text-xs font-bold uppercase tracking-wider ${step.result.status === 'success' ? 'text-green-600 dark:text-green-400' :
                                    step.result.status === 'skipped' ? 'text-gray-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {step.result.status}
                                </span>
                            ) : (
                                <span className="text-xs font-mono text-gray-400">PENDING</span>
                            )}
                        </div>

                        <div className="text-gray-700 dark:text-gray-300 mb-4">{step.description}</div>

                        <div className="mb-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Parameters</span>
                            <pre className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-md text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto border border-gray-100 dark:border-zinc-800">
                                {JSON.stringify(step.params, null, 2)}
                            </pre>
                        </div>

                        {/* Execution Result Log */}
                        {step.result && (
                            <div className={`mt-4 pt-4 border-t ${step.result.status === 'success' ? 'border-green-100 dark:border-green-900' : 'border-red-100 dark:border-red-900'
                                }`}>
                                <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${step.result.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    Output
                                </span>
                                <div className={`p-4 rounded-md font-mono text-sm ${step.result.status === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                    }`}>
                                    <p className="font-bold mb-1">{step.result.output_summary}</p>
                                    {step.result.error_type && (
                                        <p className="mt-2 text-xs font-bold uppercase text-red-600 dark:text-red-400">
                                            Error Type: {step.result.error_type}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {(!session.steps || session.steps.length === 0) && (
                    <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
                        <p className="text-gray-500 dark:text-gray-400 italic">No operations recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
