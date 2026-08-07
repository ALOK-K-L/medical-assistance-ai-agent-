"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, BarChart3, Activity, MessageSquare, Trash2, Plus, Menu, X, Cpu, ScanSearch, Watch, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [history, setHistory] = useState<any[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.5-flash');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Load model preference
        const savedModel = localStorage.getItem('llm_model');
        if (savedModel) {
            setSelectedModel(savedModel);
        }

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
        { name: 'X-Ray Analyzer', href: '/analyzer', icon: ScanSearch },
        { name: 'Wearable Simulator', href: '/wearables', icon: Watch },
        { name: 'HIPAA Audit Logs', href: '/audit', icon: ShieldCheck },
    ];

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button 
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-200/60 text-slate-700 hover:bg-slate-50 transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>
            
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200/60 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="md:hidden absolute top-5 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
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
            
            <div className="p-6 mt-auto space-y-4">
                {/* Model Selector */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Model Selection</h3>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => {
                                localStorage.setItem('llm_model', 'ollama/medgemma:4b');
                                setSelectedModel('ollama/medgemma:4b');
                                window.dispatchEvent(new Event('chatHistoryUpdated'));
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${selectedModel === 'ollama/medgemma:4b' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'}`}
                        >
                            <span>MedGemma (Local)</span>
                            {selectedModel === 'ollama/medgemma:4b' && <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                        </button>
                        <button 
                            onClick={() => {
                                localStorage.setItem('llm_model', 'google/gemini-2.5-flash');
                                setSelectedModel('google/gemini-2.5-flash');
                                window.dispatchEvent(new Event('chatHistoryUpdated'));
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${selectedModel === 'google/gemini-2.5-flash' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'}`}
                        >
                            <span>Gemini 2.5 (Cloud)</span>
                            {selectedModel === 'google/gemini-2.5-flash' && <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                        </button>
                    </div>
                </div>

                {/* Server Status */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold mb-4 text-emerald-700 bg-emerald-100/50 px-3 py-1.5 rounded-full w-fit border border-emerald-200/50">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        {selectedModel === 'ollama/medgemma:4b' ? 'Local AI Active (Private)' : 'Edge AI Server ONLINE'}
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-4">
                        <span>Latency</span>
                        <span className="text-emerald-600 font-bold">{selectedModel === 'ollama/medgemma:4b' ? '12ms' : '24ms'}</span>
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
        </>
    );
}
