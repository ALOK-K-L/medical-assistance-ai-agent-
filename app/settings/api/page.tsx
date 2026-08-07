"use client";

import { useState, useEffect } from 'react';

export default function ApiKeysTab() {
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [aicreditKey, setAicreditKey] = useState('');
    const [aicreditUrl, setAicreditUrl] = useState('https://api.aicredits.in/v1');

    const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        try {
            const res = await fetch('/api/database/api-keys');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const keyMap: Record<string, string> = {};
                    data.forEach((k: any) => {
                        keyMap[k.provider] = k.key;
                    });
                    setOpenaiKey(keyMap.openai || '');
                    setAnthropicKey(keyMap.anthropic || '');
                    setAicreditKey(keyMap.aicredit || '');
                    setAicreditUrl(keyMap.aicredit_url || 'https://api.aicredits.in/v1');
                }
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    };

    const handleSaveKey = async (provider: string) => {
        setSavingKey(provider);
        try {
            const key = keyInputs[provider] || '';
            const res = await fetch('/api/database/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, key })
            });
            if (res.ok) {
                await fetchApiKeys();
                setKeyInputs(prev => ({ ...prev, [provider]: '' }));
                alert(`API Key for ${provider} saved successfully!`);
            }
        } catch (error) {
            console.error('Failed to save API key:', error);
            alert(`Failed to save key for ${provider}`);
        }
        setSavingKey(null);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-cyan-400 uppercase tracking-widest font-bold mb-6 flex items-center gap-3 border-b border-cyan-500/30 pb-4 text-xl">
                API Key Management
            </h2>

            <div className="space-y-6">
                
                {/* AICredit */}
                <div className="p-4 border border-cyan-500/30 bg-slate-900/50 rounded flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-cyan-300 font-bold">AICredit / Custom API</p>
                            <p className="text-xs text-cyan-500/60 font-mono">Current Status: {aicreditKey ? <span className="text-green-400">Configured</span> : <span className="text-red-400">Missing</span>}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <label className="text-xs text-cyan-400 mb-1 block">Base URL</label>
                            <input 
                                type="text" 
                                value={keyInputs['aicredit_url'] ?? ''}
                                onChange={(e) => setKeyInputs({...keyInputs, 'aicredit_url': e.target.value})}
                                placeholder={aicreditUrl || "https://api.aicredits.in/v1"}
                                className="w-full bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 placeholder:text-cyan-500/30 focus:outline-none focus:border-cyan-400 font-mono text-sm"
                            />
                            <button 
                                onClick={() => handleSaveKey('aicredit_url')}
                                disabled={savingKey === 'aicredit_url' || !keyInputs['aicredit_url']}
                                className="mt-2 text-xs px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-400 rounded hover:bg-cyan-500/40 disabled:opacity-50"
                            >
                                {savingKey === 'aicredit_url' ? '...' : 'Update URL'}
                            </button>
                        </div>
                        <div>
                            <label className="text-xs text-cyan-400 mb-1 block">API Key</label>
                            <input 
                                type="password" 
                                value={keyInputs['aicredit'] || ''}
                                onChange={(e) => setKeyInputs({...keyInputs, 'aicredit': e.target.value})}
                                placeholder="sk-..."
                                className="w-full bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 placeholder:text-cyan-500/30 focus:outline-none focus:border-cyan-400 font-mono text-sm"
                            />
                            <button 
                                onClick={() => handleSaveKey('aicredit')}
                                disabled={savingKey === 'aicredit' || !keyInputs['aicredit']}
                                className="mt-2 text-xs px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-400 rounded hover:bg-cyan-500/40 disabled:opacity-50"
                            >
                                {savingKey === 'aicredit' ? '...' : 'Update Key'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* OpenAI */}
                <div className="p-4 border border-cyan-500/30 bg-slate-900/50 rounded flex flex-col gap-2">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <p className="text-cyan-300 font-bold">OpenAI</p>
                            <p className="text-xs text-cyan-500/60 font-mono">Current Status: {openaiKey ? <span className="text-green-400">Configured</span> : <span className="text-red-400">Missing</span>}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            value={keyInputs['openai'] || ''}
                            onChange={(e) => setKeyInputs({...keyInputs, 'openai': e.target.value})}
                            placeholder="sk-..."
                            className="flex-1 bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 placeholder:text-cyan-500/30 focus:outline-none focus:border-cyan-400 font-mono text-sm"
                        />
                        <button 
                            onClick={() => handleSaveKey('openai')}
                            disabled={savingKey === 'openai' || !keyInputs['openai']}
                            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-400 rounded font-bold uppercase hover:bg-cyan-500/40 disabled:opacity-50 text-sm"
                        >
                            {savingKey === 'openai' ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
