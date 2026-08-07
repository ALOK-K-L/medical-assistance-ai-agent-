"use client";

import { useState, useEffect } from 'react';

export default function ModelsTab() {
    const [llmModel, setLlmModel] = useState<string>('groq/llama-3.1-8b-instant');
    const [customOllama, setCustomOllama] = useState<string>('');
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    
    // For test connection, we'd need keys. Assuming API keys are already in DB
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

    useEffect(() => {
        const savedModel = localStorage.getItem('llm_model');
        if (savedModel) {
            setLlmModel(savedModel);
            if (savedModel.startsWith('ollama/') && savedModel !== 'ollama/qwen' && savedModel !== 'ollama/llama3:8b') {
                setCustomOllama(savedModel.replace('ollama/', ''));
            }
        }
        
        fetch('/api/database/api-keys')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const keyMap: Record<string, string> = {};
                    data.forEach((k: any) => {
                        keyMap[k.provider] = k.key;
                    });
                    setApiKeys(keyMap);
                }
            })
            .catch(console.error);
    }, []);

    const saveModel = (model: string) => {
        setLlmModel(model);
        localStorage.setItem('llm_model', model);
    };

    const handleTestModel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testMessage.trim() || testLoading) return;
        
        setTestLoading(true);
        const modelToTest = llmModel === 'ollama/custom' && customOllama ? `ollama/${customOllama}` : llmModel;
        
        setTestResponse(`Testing ${modelToTest}...\n\n`);
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelToTest,
                    messages: [{ role: 'system', content: 'You are a helpful AI.' }, { role: 'user', content: testMessage }],
                    stream: true
                })
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to connect');
            }
            
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('No reader');
            
            let fullResponse = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.choices[0]?.delta?.content) {
                                fullResponse += data.choices[0].delta.content;
                                setTestResponse(fullResponse);
                            }
                        } catch(e) {}
                    }
                }
            }
        } catch (err: any) {
            setTestResponse(`ERROR: ${err.message}`);
        } finally {
            setTestLoading(false);
            setTestMessage('');
        }
    };

    const modelOptions = [
        {
            group: "Groq Cloud (Fastest - Free)",
            models: [
                { id: "groq/llama-3.1-8b-instant", name: "Llama 3.1 8B (Instant)" },
                { id: "groq/llama-3.1-70b-versatile", name: "Llama 3.1 70B (Versatile)" },
                { id: "groq/mixtral-8x7b-32768", name: "Mixtral 8x7B" },
            ]
        },
        {
            group: "Limited API Section (AICredit)",
            models: [
                { id: "aicredit/google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
                { id: "aicredit/deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro" },
                { id: "aicredit/deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash" },
            ]
        },
        {
            group: "OpenRouter (DeepSeek)",
            models: [
                { id: "nvidia/deepseek-ai/deepseek-v4-pro", name: "DeepSeek V4 Pro (via OR)" },
                { id: "nvidia/deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash (via OR)" },
            ]
        },
        {
            group: "OpenAI (Bring your own Key)",
            models: [
                { id: "openai/gpt-4o", name: "GPT-4o" },
                { id: "openai/gpt-4o-mini", name: "GPT-4o-Mini" },
            ]
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-cyan-400 uppercase tracking-widest font-bold mb-6 flex items-center gap-3 border-b border-cyan-500/30 pb-4 text-xl">
                Neural Model Configuration
            </h2>
            
            <div className="space-y-4">
                {modelOptions.map((group) => (
                    <div key={group.group}>
                        <h3 className="text-sm font-bold text-cyan-500 uppercase mb-2">{group.group}</h3>
                        {group.models.map((model) => (
                            <div 
                                key={model.id}
                                onClick={() => saveModel(model.id)}
                                className={`p-4 border border-cyan-500/20 rounded cursor-pointer transition-all ${llmModel === model.id ? 'bg-cyan-900/40 border-cyan-400' : 'bg-slate-900/50 hover:border-cyan-500/50'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <p className="text-cyan-400 font-mono text-lg">{model.name}</p>
                                    {llmModel === model.id && <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
                <button 
                    onClick={() => {
                        saveModel(llmModel);
                        alert("Model configuration saved successfully!");
                    }}
                    className="px-6 py-2 bg-cyan-500 text-black font-bold uppercase tracking-widest rounded hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                    Confirm & Save
                </button>
            </div>

            <div className="mt-8 border-t border-cyan-500/30 pt-6">
                <h3 className="text-cyan-300 font-bold uppercase mb-4">Test Model Connection</h3>
                <div className="bg-slate-900/80 border border-cyan-500/20 rounded p-4">
                    <div className="h-32 overflow-y-auto mb-4 text-cyan-100 text-sm whitespace-pre-wrap font-mono custom-scrollbar">
                        {testResponse || "Send a message to test the selected model..."}
                    </div>
                    <form onSubmit={handleTestModel} className="flex gap-2">
                        <input 
                            type="text"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Type a test message..."
                            className="flex-1 bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 placeholder:text-cyan-500/30 focus:outline-none focus:border-cyan-400"
                        />
                        <button 
                            type="submit"
                            disabled={testLoading}
                            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-400 rounded font-bold uppercase hover:bg-cyan-500/40 disabled:opacity-50"
                        >
                            {testLoading ? '...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
