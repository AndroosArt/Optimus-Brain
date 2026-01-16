'use client';

import { useState, useEffect } from 'react';

export default function SystemDiagnostics() {
    const [status, setStatus] = useState<'checking' | 'active' | 'issue'>('checking');
    const [latency, setLatency] = useState<number>(0);

    useEffect(() => {
        const checkHealth = async () => {
            const start = performance.now();
            try {
                // Parallel checks
                const [healthRes] = await Promise.all([
                    fetch('/api/health'),
                    // fetch('/api/chat', { method: 'POST', body: JSON.stringify({ objective: 'ping' }) }) // Optional Check
                ]);

                if (healthRes.ok) {
                    setStatus('active');
                } else {
                    setStatus('issue');
                }
            } catch (e) {
                setStatus('issue');
            } finally {
                setLatency(Math.round(performance.now() - start));
            }
        };

        checkHealth();
    }, []);

    if (status === 'checking') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border shadow-sm backdrop-blur-sm ${status === 'active'
                    ? 'bg-forest-50/80 border-forest-200 text-forest-700'
                    : 'bg-red-50/80 border-red-200 text-red-700'
                }`}>
                <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-forest-500' : 'bg-red-500'
                    }`}></span>
                <span className="font-bold">
                    {status === 'active' ? 'API Active' : 'Connection Issue'}
                </span>
                <span className="opacity-50 border-l pl-2 border-inherit">
                    {latency}ms
                </span>
            </div>
        </div>
    );
}
