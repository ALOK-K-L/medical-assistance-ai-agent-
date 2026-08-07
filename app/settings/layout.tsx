"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Settings, Mic, ArrowRight } from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [useLocalVoice, setUseLocalVoice] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Only redirect if they are actually in the advanced config view
        if (showConfig && pathname === '/settings') {
            router.push('/settings/models');
        }
        
        // Load local voice preference
        setUseLocalVoice(localStorage.getItem('use_local_voice') === 'true');
    }, [pathname, router, showConfig]);

    const toggleLocalVoice = () => {
        const val = !useLocalVoice;
        setUseLocalVoice(val);
        localStorage.setItem('use_local_voice', val.toString());
    };

    if (!mounted) return null;

    if (!showConfig) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
                 <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 w-full max-w-lg flex flex-col items-center">
                     <div className="bg-blue-500 p-4 rounded-full mb-6 shadow-lg shadow-blue-500/30">
                        <Settings className="h-8 w-8 text-white" />
                     </div>
                     <h1 className="text-3xl font-extrabold text-slate-800 mb-2">System Settings</h1>
                     <p className="text-slate-500 font-medium mb-10 text-center">Configure voice preferences and advanced backend settings.</p>
                     
                     <div className="w-full flex flex-col gap-4">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between transition-all hover:border-slate-300">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${useLocalVoice ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Mic className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700">Enable Local Voice Model</span>
                                    <span className="text-xs font-medium text-slate-500">Bypass Vapi and use browser speech API</span>
                                </div>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" checked={useLocalVoice} onChange={toggleLocalVoice} className="sr-only peer" />
                                 <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                             </label>
                         </div>
                         
                         <button onClick={() => setShowConfig(true)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2 mt-4 group">
                             Advanced Config <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                         </button>
                         
                         <Link href="/" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all text-center mt-2 shadow-lg shadow-blue-500/20 active:scale-95">
                             Back to Dashboard
                         </Link>
                     </div>
                 </div>
            </div>
        );
    }

    const tabs = [
        { id: 'models', label: 'Model Selection', path: '/settings/models' },
        { id: 'voice', label: 'Audio Engine', path: '/settings/voice' },
        { id: 'database', label: 'Database & Tools', path: '/settings/database' },
        { id: 'api', label: 'API Management', path: '/settings/api' },
        { id: 'prompts', label: 'Prompts & Memory', path: '/settings/prompts' },
        { id: 'testing', label: 'Model & System Testing', path: '/settings/testing' },
    ];

    return (
        <>
            <div className="scanline"></div>
            <div className="min-h-screen bg-black text-cyan-50 font-sans p-4 md:p-8 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black pointer-events-none"></div>

                <div className="max-w-6xl w-full mx-auto relative z-10 flex-grow flex flex-col">
                    <header className="mb-8 flex justify-between items-end border-b border-cyan-500/30 pb-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 glitch" data-text="SYSTEM_CONFIG">
                                SYSTEM_CONFIG
                            </h1>
                            <p className="text-cyan-300/60 font-mono text-sm tracking-widest uppercase">Global Parameters</p>
                        </div>
                        <button onClick={() => setShowConfig(false)} className="sci-fi-button text-sm py-2 px-6">
                            ← EXIT CONFIG
                        </button>
                    </header>

                    {/* Desktop/Tablet Layout */}
                    <div className="flex flex-col md:flex-row gap-8 flex-grow">
                        
                        {/* Sidebar Navigation */}
                        <aside className="w-full md:w-64 flex-shrink-0">
                            <nav className="flex flex-col gap-2">
                                {tabs.map((tab) => (
                                    <Link 
                                        key={tab.id}
                                        href={tab.path}
                                        className={`px-4 py-3 border-l-2 transition-all font-bold tracking-widest text-sm uppercase ${
                                            pathname.startsWith(tab.path)
                                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' 
                                            : 'border-transparent text-cyan-500/50 hover:bg-slate-900/50 hover:text-cyan-400'
                                        }`}
                                    >
                                        {tab.label}
                                    </Link>
                                ))}
                            </nav>
                        </aside>

                        {/* Content Area */}
                        <main className="flex-grow min-h-0 bg-slate-950/40 border border-cyan-500/20 rounded-lg p-6 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
