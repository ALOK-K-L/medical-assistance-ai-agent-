"use client";

import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Activity, Lock, RefreshCcw } from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/audit');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#0F1115] relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-emerald-500" />
                            HIPAA Audit Logs
                        </h1>
                        <p className="text-slate-400 font-medium mt-1">
                            Enterprise-grade secure tracking of all PHI access and AI analysis events.
                        </p>
                    </div>
                    <button 
                        onClick={fetchLogs}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all border border-slate-700"
                    >
                        <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Logs
                    </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest font-bold">PHI-Masked Audit Trail Active</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Target (Anonymized)</th>
                                    <th className="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No audit logs found. Interact with the AI to generate logs.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-200">
                                                {log.action}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-blue-400">
                                                {log.target}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
