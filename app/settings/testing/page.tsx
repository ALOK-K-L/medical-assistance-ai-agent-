"use client";

import { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

export default function TestingTab() {
    const [llmModel, setLlmModel] = useState<string>('groq/llama-3.1-8b-instant');
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    
    // WhatsApp Simulation
    const [waMessage, setWaMessage] = useState('');
    const [waResponse, setWaResponse] = useState('');
    const [waLoading, setWaLoading] = useState(false);
    const [messageType, setMessageType] = useState<'text' | 'template'>('text');

    // Vapi Voice Testing
    const [vapi, setVapi] = useState<Vapi | null>(null);
    const [voiceStatus, setVoiceStatus] = useState<'inactive' | 'loading' | 'active'>('inactive');
    const [voiceError, setVoiceError] = useState('');

    useEffect(() => {
        const savedModel = localStorage.getItem('llm_model');
        if (savedModel) {
            setLlmModel(savedModel);
        }

        // Init Vapi
        const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "fallback_key");
        setVapi(vapiInstance);

        vapiInstance.on('call-start', () => {
            setVoiceStatus('active');
            setVoiceError('');
        });
        vapiInstance.on('call-end', () => {
            setVoiceStatus('inactive');
        });
        vapiInstance.on('error', (e: any) => {
            setVoiceStatus('inactive');
            setVoiceError(e?.error?.message || e?.message || 'Voice connection failed');
        });

        return () => {
            vapiInstance.stop();
        };
    }, []);

    const handleTestModel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testMessage.trim() || testLoading) return;
        
        setTestLoading(true);
        setTestResponse(`Testing ${llmModel}...\n\n`);
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: llmModel,
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

    const handleSimulateWhatsApp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!waMessage.trim() && messageType === 'text') return;
        
        setWaLoading(true);
        setWaResponse("Sending message to WhatsApp...");
        
        try {
            const res = await fetch('/api/simulate/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: waMessage, type: messageType })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send');
            
            setWaResponse(`SUCCESS: Message sent!\n\n${JSON.stringify(data.data, null, 2)}`);
        } catch (err: any) {
            setWaResponse(`ERROR: ${err.message}`);
        } finally {
            setWaLoading(false);
            if (messageType === 'text') setWaMessage('');
        }
    };

    const toggleVoiceTest = () => {
        if (!vapi) return;
        if (voiceStatus === 'active') {
            vapi.stop();
        } else {
            setVoiceStatus('loading');
            
            const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
            if (!assistantId) {
                setVoiceError('Assistant ID missing in environment.');
                setVoiceStatus('inactive');
                return;
            }

            const isCustomLLM = llmModel.startsWith('nvidia/') || llmModel.startsWith('aicredit/') || llmModel.startsWith('openai/');
            
            const modelConfig: any = {
                provider: isCustomLLM ? "custom-llm" : "groq",
                model: isCustomLLM ? llmModel : llmModel.replace('groq/', ''),
                messages: [
                    { role: "system", content: "You are a smart AI testing assistant. Do whatever the user asks. You do not have clinic memory and you are not a receptionist. Keep your answers natural, concise, and helpful." }
                ]
            };

            // Using standard domain logic for ngrok routing if it's a custom LLM
            if (isCustomLLM) {
                // Determine the URL based on current window location to support ngrok correctly
                modelConfig.url = `${window.location.origin}/api/custom-llm`;
            }

            const overrides = {
                name: "Raw Test Agent",
                firstMessage: "Testing connection active. I am ready.",
                model: modelConfig
            };

            vapi.start(assistantId, overrides);
        }
    };

    const modelOptions = [
        { id: "groq/llama-3.1-8b-instant", name: "Llama 3.1 8B (Instant)" },
        { id: "groq/llama-3.1-70b-versatile", name: "Llama 3.1 70B (Versatile)" },
        { id: "groq/mixtral-8x7b-32768", name: "Mixtral 8x7B" },
        { id: "aicredit/deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro" },
        { id: "aicredit/deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash" },
        { id: "nvidia/deepseek-ai/deepseek-v4-pro", name: "DeepSeek V4 Pro (OR)" },
        { id: "nvidia/deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash (OR)" },
        { id: "openai/gpt-4o", name: "GPT-4o" },
        { id: "openai/gpt-4o-mini", name: "GPT-4o-Mini" }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <h2 className="text-cyan-400 uppercase tracking-widest font-bold border-b border-cyan-500/30 pb-4 text-xl">
                System Diagnostics & Testing
            </h2>

            {/* Global Model Selector */}
            <div className="bg-slate-900/80 border border-cyan-500/50 rounded-lg p-4 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                <label className="block text-sm uppercase tracking-widest text-cyan-400 font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    Active Testing Model
                </label>
                <p className="text-xs text-cyan-500/70 mb-3">This model applies to both the Text Interface and the Raw Voice Tester below.</p>
                <select 
                    value={llmModel}
                    onChange={(e) => {
                        setLlmModel(e.target.value);
                        localStorage.setItem('llm_model', e.target.value);
                    }}
                    className="w-full bg-black border border-cyan-500/50 rounded p-3 text-cyan-100 font-mono text-sm focus:outline-none focus:border-cyan-400 shadow-inner"
                >
                    {modelOptions.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>
            
            {/* AI Model Testing Section */}
            <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="text-cyan-300 font-bold uppercase mb-4">
                    Text Interface Test
                </h3>

                <div className="bg-black/80 border border-cyan-500/20 rounded p-4">
                    <div className="h-40 overflow-y-auto mb-4 text-cyan-100 text-sm whitespace-pre-wrap font-mono custom-scrollbar">
                        {testResponse || "Select an API model and send a message to test connectivity..."}
                    </div>
                    <form onSubmit={handleTestModel} className="flex gap-2">
                        <input 
                            type="text"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Type a test prompt..."
                            className="flex-1 bg-slate-950 border border-cyan-500/50 p-2 rounded text-cyan-100 placeholder:text-cyan-500/30 focus:outline-none focus:border-cyan-400"
                        />
                        <button 
                            type="submit"
                            disabled={testLoading}
                            className="px-6 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-400 rounded font-bold uppercase tracking-wider hover:bg-cyan-500/40 disabled:opacity-50"
                        >
                            {testLoading ? '...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Raw Voice Command Tester Section */}
            <div className="bg-slate-900/60 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-purple-400 font-bold uppercase mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    Raw Voice Command Tester
                </h3>
                <p className="text-purple-200/70 text-sm mb-4">
                    This spins up a raw Voice AI agent that does NOT have the clinic memory or tools. 
                    Use this to test the raw intelligence and responsiveness of the Vapi agent.
                </p>
                <div className="bg-black/80 border border-purple-500/20 rounded p-4 flex flex-col items-center justify-center">
                    {voiceError && <p className="text-red-400 text-xs mb-3 font-mono">{voiceError}</p>}
                    <button 
                        onClick={toggleVoiceTest}
                        className={`w-48 h-16 rounded flex items-center justify-center font-bold uppercase tracking-widest transition-all ${
                            voiceStatus === 'active' 
                                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                                : voiceStatus === 'loading'
                                ? 'bg-purple-500/50 text-purple-200'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-400 hover:bg-purple-500/40'
                        }`}
                    >
                        {voiceStatus === 'active' ? 'Stop Testing' : voiceStatus === 'loading' ? 'Connecting...' : 'Start Voice Test'}
                    </button>
                </div>
            </div>

            {/* WhatsApp Simulator Section */}
            <div className="bg-slate-900/60 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-green-400 font-bold uppercase mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Simulate WhatsApp Message
                </h3>
                
                <div className="mb-4">
                    <label className="block text-xs uppercase tracking-widest text-green-500 mb-2">Message Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-green-100">
                            <input 
                                type="radio" 
                                checked={messageType === 'text'} 
                                onChange={() => setMessageType('text')}
                                className="accent-green-500"
                            /> Custom Text
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-green-100">
                            <input 
                                type="radio" 
                                checked={messageType === 'template'} 
                                onChange={() => setMessageType('template')}
                                className="accent-green-500"
                            /> Hello World Template
                        </label>
                    </div>
                </div>

                <div className="bg-black/80 border border-green-500/20 rounded p-4">
                    <div className="h-32 overflow-y-auto mb-4 text-green-100 text-sm whitespace-pre-wrap font-mono custom-scrollbar">
                        {waResponse || "Send a message to test the WhatsApp integration..."}
                    </div>
                    <form onSubmit={handleSimulateWhatsApp} className="flex gap-2">
                        {messageType === 'text' && (
                            <input 
                                type="text"
                                value={waMessage}
                                onChange={(e) => setWaMessage(e.target.value)}
                                placeholder="Type a message to send to WhatsApp..."
                                className="flex-1 bg-slate-950 border border-green-500/50 p-2 rounded text-green-100 placeholder:text-green-500/30 focus:outline-none focus:border-green-400"
                            />
                        )}
                        <button 
                            type="submit"
                            disabled={waLoading}
                            className={`px-6 py-2 bg-green-500/20 text-green-400 border border-green-400 rounded font-bold uppercase tracking-wider hover:bg-green-500/40 disabled:opacity-50 ${messageType === 'template' ? 'w-full' : ''}`}
                        >
                            {waLoading ? '...' : (messageType === 'template' ? 'Send Template Message' : 'Send Text')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
