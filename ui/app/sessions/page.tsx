'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSessions, Session } from '@/lib/persistence';

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessions(getSessions());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-8 font-sans max-w-4xl mx-auto min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-forest-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 font-sans max-w-4xl mx-auto min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Optimus Session Log</h1>
        <div className="flex gap-4">
          <Link href="/" className="bg-forest-500 hover:bg-forest-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-md">
            + New Mission
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map(session => (
          <Link href={`/sessions/${session.id}`} key={session.id} className="block bg-white dark:bg-zinc-900 shadow-sm border p-6 rounded-lg hover:shadow-md hover:border-forest-500 hover:scale-[1.01] transition-all border-gray-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="block text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {session.title || "Untitled Mission"}
                </span>
                <span className="block text-sm text-gray-500 dark:text-gray-400 font-normal line-clamp-1">
                  {session.objective}
                </span>
              </div>

              <span className={`text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-full whitespace-nowrap ${session.status === 'COMPLETED' ? 'bg-forest-50 text-forest-600 border border-forest-200 dark:bg-forest-900/20 dark:text-forest-400 dark:border-forest-800' :
                session.status === 'EXECUTING' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                  session.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                    'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700'
                }`}>
                {session.status}
              </span>
            </div>
            <div className="text-gray-400 dark:text-gray-600 text-xs mt-4 font-mono flex gap-4">
              <span>{new Date(session.timestamp).toLocaleString()}</span>
              <span>ID: {session.id}</span>
            </div>
          </Link>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No sessions recorded.</p>
            <Link href="/" className="text-forest-600 dark:text-forest-400 font-bold hover:underline">Initiate First Mission</Link>
          </div>
        )}
      </div>
    </div>
  );
}
