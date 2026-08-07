"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, BarChart3, Activity, MessageSquare, Trash2, Plus } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const loadHistory = () => {
            const saved = localStorage.getItem('lifebeat_chat_history');
            if (saved) {
                setHistory(JSON.parse(saved));
            }
        };
        loadHistory();
        window.addEventListener('chatHistoryUpdated', loadHistory);
        return () => window.removeEventListener('chatHistoryUpdated', loadHistory);
    }, []);

    const deleteChat = (e: any, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const savedStr = localStorage.getItem('lifebeat_chat_history');
        if (savedStr) {
            let hist = JSON.parse(savedStr);
            hist = hist.filter((c: any) => c.id !== id);
            localStorage.setItem('lifebeat_chat_history', JSON.stringify(hist));
            setHistory(hist);
            window.dispatchEvent(new Event('chatHistoryUpdated'));
            
            if (window.location.search.includes(id)) {
                window.location.href = '/';
            }
        }
    };

    const links = [
        { name: 'Triage Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Patient Queue', href: '/queue', icon: Users },
        { name: 'Medical Records', href: '/records', icon: FileText },
        { name: 'Analytics & Metrics', href: '/analytics', icon: BarChart3 },
    ];

    return (
        <aside className="w-[280px] bg-white border-r border-slate-200/60 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 flex-shrink-0">
            <div className="p-8 pb-6 flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                    <Activity className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">LifeBeat</h1>
            </div>
            
            <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive ? 'bg-blue-50/80 text-blue-700 border border-blue-100/50 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                            <Icon className="h-5 w-5" /> {link.name}
                        </Link>
                    );
                })}
                
                {/* Chat History Section */}
                <div className="pt-6 pb-2">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chat History</span>
                        <Link href="/" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition-colors border border-blue-100" title="New Chat">
                            <Plus className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="space-y-1">
                        {history.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-slate-400 font-medium italic">No recent chats</div>
                        ) : (
                            history.map(chat => (
                                <Link key={chat.id} href={`/?chatId=${chat.id}`} className="flex items-center justify-between group px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all border border-transparent hover:border-slate-200/50">
                                    <div className="flex items-center gap-2 truncate">
                                        <MessageSquare className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="truncate">{chat.title}</span>
                                    </div>
                                    <button onClick={(e) => deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </nav>
            
            <div className="p-6 mt-auto">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold mb-4 text-emerald-700 bg-emerald-100/50 px-3 py-1.5 rounded-full w-fit border border-emerald-200/50">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Edge AI Server ONLINE
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            SJ
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800">Dr. Sarah Jenkins</p>
                            <p className="text-xs text-slate-500 font-medium">Chief Triage Officer</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
