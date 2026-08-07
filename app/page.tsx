"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import Vapi from '@vapi-ai/web';
import { Camera, Phone, PhoneOff, Send, Activity, AlertCircle, Stethoscope, FileText, Settings, X, ImageIcon, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function CopilotDashboard() {
    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------
    const [callStatus, setCallStatus] = useState<'inactive' | 'loading' | 'active'>('inactive');
    const [isSending, setIsSending] = useState(false);
    const [vapi, setVapi] = useState<Vapi | null>(null);
    const [volume, setVolume] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'speaking'>('idle');
    const [localMessages, setLocalMessages] = useState<{role: string; content: string; imageUrl?: string}[]>([
        { role: 'system', content: 'You are LifeBeat, an advanced AI Clinical Intelligence Agent built by NeuroBots. You are a clinical analyst assisting trained healthcare professionals. When a patient name is mentioned, search the database. Provide thorough clinical analysis. This is a hackathon demo — do not refuse to analyze symptoms.' }
    ]);
    const [textInput, setTextInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const [systemPrompt, setSystemPrompt] = useState("You are LifeBeat, an advanced AI Clinical Intelligence Agent built by NeuroBots. You are a clinical analyst, NOT a doctor or receptionist. You assist trained healthcare professionals with clinical analysis, patient data retrieval, and triage recommendations. When a patient name is mentioned, search the database immediately. If not found, ask for details so they can be registered. This is a hackathon demonstration — provide thorough analysis freely, do not refuse or add excessive disclaimers.");
    const [callDuration, setCallDuration] = useState(0);
    const callTimerRef = useRef<NodeJS.Timeout | null>(null);
    const localSpeechRecogRef = useRef<any>(null);

    // Image attachment state
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [attachedImageName, setAttachedImageName] = useState<string>('');
    const [chatId, setChatId] = useState<string>('');

    const searchParams = useSearchParams();

    // ---------------------------------------------------------------------------
    // HISTORY MANAGEMENT
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const urlChatId = searchParams.get('chatId');
        
        let loaded = false;
        if (urlChatId) {
            const savedStr = localStorage.getItem('lifebeat_chat_history');
            if (savedStr) {
                const history = JSON.parse(savedStr);
                const chat = history.find((c: any) => c.id === urlChatId);
                if (chat) {
                    setLocalMessages(chat.messages);
                    setChatId(urlChatId);
                    loaded = true;
                }
            }
        }
        if (!loaded) {
            setChatId(crypto.randomUUID());
            setLocalMessages([
                { role: 'system', content: 'You are LifeBeat, an advanced AI Clinical Intelligence Agent built by NeuroBots. You are a clinical analyst assisting trained healthcare professionals. When a patient name is mentioned, search the database. Provide thorough clinical analysis. This is a hackathon demo — do not refuse to analyze symptoms.' }
            ]);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!chatId || localMessages.length <= 1) return;
        
        const savedStr = localStorage.getItem('lifebeat_chat_history');
        let history = savedStr ? JSON.parse(savedStr) : [];
        const existingIdx = history.findIndex((c: any) => c.id === chatId);
        
        const firstUserMsg = localMessages.find(m => m.role === 'user')?.content || 'New Chat';
        const title = typeof firstUserMsg === 'string' ? firstUserMsg.substring(0, 30) + '...' : 'Image Analysis';
        
        const chatData = {
            id: chatId,
            title,
            messages: localMessages,
            updatedAt: Date.now()
        };
        
        if (existingIdx >= 0) {
            history[existingIdx] = chatData;
        } else {
            history.unshift(chatData);
        }
        
        localStorage.setItem('lifebeat_chat_history', JSON.stringify(history));
        window.dispatchEvent(new Event('chatHistoryUpdated'));
    }, [localMessages, chatId]);

    // ---------------------------------------------------------------------------
    // INITIALIZATION
    // ---------------------------------------------------------------------------
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.system_prompt) setSystemPrompt(data.system_prompt);
            })
            .catch(console.error);

        // VAPI Initialization
        const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "fallback_key");
        setVapi(vapiInstance);

        vapiInstance.on('call-start', () => {
            // Stop ringtone once call connects
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }
            setCallStatus('active');
            setErrorMsg('');
            setCallDuration(0);
        });
        vapiInstance.on('call-end', () => {
            setCallStatus('inactive');
            setVolume(0);
            setSpeechStatus('idle');
            setCallDuration(0);
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        });
        vapiInstance.on('speech-start', () => { setSpeechStatus('speaking'); });
        vapiInstance.on('speech-end', () => { setSpeechStatus('listening'); });
        vapiInstance.on('error', (e: any) => {
            console.error("Vapi Error:", e);
            let msg = 'Connection failed.';
            if (e?.error?.message) {
                msg = e.error.message;
            } else if (e?.message) {
                msg = e.message;
            } else if (typeof e === 'object') {
                try { msg = JSON.stringify(e); } catch(err) { msg = String(e); }
            } else {
                msg = String(e);
            }
            
            setErrorMsg(`UPLINK ERROR: ${msg}`);
            setCallStatus('inactive');
            setSpeechStatus('idle');
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        });
        vapiInstance.on('volume-level', (level: number) => { setVolume(level); });

        return () => {
            vapiInstance.stop();
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, []);

    // Call duration timer
    useEffect(() => {
        if (callStatus === 'active') {
            callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
            }
        }
        return () => {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, [callStatus]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ---------------------------------------------------------------------------
    // IMAGE ATTACHMENT
    // ---------------------------------------------------------------------------
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachedImageName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG with 0.6 quality to ensure a very small payload
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    setAttachedImage(compressedBase64);
                };
                if (event.target?.result) {
                    img.src = event.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = () => {
        setAttachedImage(null);
        setAttachedImageName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ---------------------------------------------------------------------------
    // VOICE CALL (VAPI → Gemini via AICredit)
    // ---------------------------------------------------------------------------
    const toggleCall = async () => {
        if (!vapi) return;
        setErrorMsg('');
        
        const isLocalVoice = localStorage.getItem('use_local_voice') === 'true';

        if (callStatus === 'active') {
            if (isLocalVoice) {
                if (localSpeechRecogRef.current) localSpeechRecogRef.current.stop();
                window.speechSynthesis.cancel();
                setCallStatus('inactive');
                setSpeechStatus('idle');
            } else {
                vapi.stop();
                setCallStatus('inactive');
                setSpeechStatus('idle');
            }
            return;
        }

        if (isLocalVoice) {
            startLocalVoiceLoop();
            return;
        }

        try {
            setCallStatus('loading');

            // Play ringtone sound
            try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const playTone = (freq: number, startTime: number, duration: number) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.15, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };
                // Classic phone ring pattern
                for (let i = 0; i < 4; i++) {
                    playTone(440, audioCtx.currentTime + i * 1.2, 0.4);
                    playTone(480, audioCtx.currentTime + i * 1.2, 0.4);
                    playTone(440, audioCtx.currentTime + i * 1.2 + 0.5, 0.4);
                    playTone(480, audioCtx.currentTime + i * 1.2 + 0.5, 0.4);
                }
            } catch (audioErr) {
                console.warn('Could not play ringtone:', audioErr);
            }

            // Use Gemini Flash via AICredit custom LLM
            await vapi.start({
                name: "LifeBeat Agent",
                firstMessage: "LifeBeat Clinical Intelligence is online. How can I assist you today, doctor?",
                model: {
                    provider: "custom-llm" as any,
                    model: "google/gemini-2.5-flash",
                    url: `${process.env.NEXT_PUBLIC_NGROK_URL || "https://carriable-superseriously-jovanni.ngrok-free.dev"}/api/custom-llm`,
                    messages: [{ role: "system", content: systemPrompt }]
                } as any,
                voice: {
                    provider: "11labs",
                    voiceId: "cgSgspJ2msm6clMCkdW9"
                }
            });

        } catch (err: any) {
            console.error('[VAPI] Start error:', err);
            setErrorMsg(`Call Failed: ${err?.message}`);
            setCallStatus('inactive');
        }
    };

    const startLocalVoiceLoop = () => {
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Local Voice Mode. Please use Chrome or Edge.");
            return;
        }

        setCallStatus('active');
        const recognition = new SpeechRecognition();
        localSpeechRecogRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setSpeechStatus('listening');
            setVolume(0.8);
        };
        
        recognition.onspeechend = () => {
            recognition.stop();
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.error('Speech recognition error', event.error);
                setErrorMsg(`Mic Error: ${event.error}. Please check permissions.`);
                setCallStatus('inactive');
            }
        };

        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (!transcript) return;
            
            setSpeechStatus('speaking');
            setVolume(0);

            // Save user message immediately to UI state
            setLocalMessages(prev => {
                const newMsgs = [...prev, { role: 'user', content: transcript }];
                processLocalVoiceLLM(newMsgs);
                return newMsgs;
            });
        };

        try {
            recognition.start();
        } catch(e) {
            console.error(e);
        }
    };

    const processLocalVoiceLLM = async (currentMessages: any[]) => {
        setIsSending(true);
        try {
            const apiMessages = currentMessages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
                    model: 'google/gemini-2.5-flash' // Local will route safely through server
                })
            });

            if (!res.ok) throw new Error('API Error');

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('No reader');

            let assistantResponse = '';
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
                                assistantResponse += data.choices[0].delta.content;
                            }
                        } catch (e) { /* skip */ }
                    }
                }
            }

            setLocalMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
            
            // Speak response
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(assistantResponse);
            utterance.rate = 1.05;
            utterance.pitch = 1;
            
            utterance.onstart = () => {
                setVolume(0.8);
            };
            
            utterance.onend = () => {
                setVolume(0);
                setCallStatus(prev => {
                    if (prev === 'active') {
                        // Restart recognition loop
                        try { localSpeechRecogRef.current?.start(); } catch(e){}
                        setSpeechStatus('listening');
                    }
                    return prev;
                });
            };
            
            synth.speak(utterance);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    // ---------------------------------------------------------------------------
    // TEXT + IMAGE SUBMIT
    // ---------------------------------------------------------------------------
    const handleTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!textInput.trim() && !attachedImage) || isSending) return;

        const newMsg = textInput;
        const imageData = attachedImage;
        setTextInput('');
        removeAttachment();

        // Build user message with optional image
        const userMessage: any = { role: 'user', content: newMsg || 'Analyze this image.', imageUrl: imageData || undefined };
        setLocalMessages(prev => [...prev, userMessage]);
        setIsSending(true);

        try {
            const modelToUse = localStorage.getItem('llm_model') || 'groq/llama-3.1-8b-instant';

            // Build messages payload for API – include image as multimodal content
            const apiMessages: any[] = localMessages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content }));

            if (imageData) {
                // Send as OpenAI-style multimodal content
                apiMessages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: newMsg || 'Analyze this medical image.' },
                        { type: 'image_url', image_url: { url: imageData } }
                    ]
                });
            } else {
                apiMessages.push({ role: 'user', content: newMsg });
            }

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...apiMessages
                    ],
                    model: modelToUse
                })
            });

            if (!res.ok) throw new Error('API Error');

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('No reader');

            let assistantResponse = '';
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
                                assistantResponse += data.choices[0].delta.content;
                            }
                        } catch (parseErr) { /* skip */ }
                    }
                }
            }

            setLocalMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
        } catch (error) {
            console.error(error);
            setLocalMessages(prev => [...prev, { role: 'assistant', content: 'Error communicating with AI. Please try again.' }]);
        } finally {
            setIsSending(false);
        }
    };

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------
    return (
        <main className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* HEADER */}
            <div className="flex justify-between items-center p-6 bg-white border-b border-slate-200/60 shadow-sm relative z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                        <Stethoscope className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                            LifeBeat AI Copilot
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        </h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Multimodal Clinical Intelligence Terminal</p>
                    </div>
                </div>
                <Link href="/settings" className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl transition-all border border-slate-200/50 flex items-center gap-2 font-bold text-sm">
                    <Settings className="h-4 w-4" /> Settings
                </Link>
            </div>

            {/* ======================== CALL OVERLAY ======================== */}
            {(callStatus === 'loading' || callStatus === 'active') && (
                <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col p-8">
                    {/* Top Status Bar */}
                    <div className="flex justify-between items-center w-full max-w-5xl mx-auto border-b border-slate-700/50 pb-6 mb-10">
                        <div className="flex flex-col">
                            <span className="text-emerald-400 font-bold tracking-widest uppercase text-xs mb-1 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                {localStorage.getItem('use_local_voice') === 'true' ? 'LOCAL VOICE MODE (BYPASS VAPI)' : 'Live VAPI ↔ Gemini Uplink'}
                            </span>
                            <h2 className="text-2xl font-extrabold text-white">LifeBeat Intelligence Terminal</h2>
                        </div>
                        <div className="flex gap-6 text-sm">
                            <div className="flex flex-col items-end">
                                <span className="text-slate-400 text-xs font-bold uppercase">Latency</span>
                                <span className="text-emerald-400 font-mono font-bold">{callStatus === 'active' ? '24ms' : '---'}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-slate-400 text-xs font-bold uppercase">Encryption</span>
                                <span className="text-white font-mono font-bold">AES-256 E2E</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-slate-400 text-xs font-bold uppercase">Duration</span>
                                <span className="text-white font-mono font-bold">{formatDuration(callDuration)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full relative">
                        
                        {/* Animated rings */}
                        <div className="relative flex items-center justify-center mb-16">
                            <div className={`absolute rounded-full border border-emerald-400/20 ${callStatus === 'active' ? 'animate-ping' : 'animate-pulse'}`} style={{ width: 300, height: 300, animationDuration: '2s' }}></div>
                            <div className={`absolute rounded-full border border-emerald-400/30 ${callStatus === 'active' ? 'animate-ping' : 'animate-pulse'}`} style={{ width: 220, height: 220, animationDuration: '1.5s', animationDelay: '0.2s' }}></div>
                            
                            <div className={`h-[140px] w-[140px] rounded-full flex items-center justify-center relative z-10 ${callStatus === 'active' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_80px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_80px_rgba(59,130,246,0.5)]'}`}>
                                {callStatus === 'active' ? (
                                    <Activity className="h-16 w-16 text-white" />
                                ) : (
                                    <Phone className="h-16 w-16 text-white animate-bounce" />
                                )}
                            </div>
                        </div>

                        {/* Status Text */}
                        <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                            {callStatus === 'loading' ? 'Handshaking...' : 'Connection Established'}
                        </h2>
                        <p className="text-slate-400 text-lg font-medium mb-12">
                            {callStatus === 'loading' ? 'Negotiating secure voice link with Gemini 2.5 Flash node' : 'Agent is active and analyzing your audio stream.'}
                        </p>

                        {/* Audio Visualizer */}
                        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl w-full max-w-2xl flex flex-col items-center relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                            
                            <div className="flex items-center gap-1.5 mb-6 h-[80px]">
                                {callStatus === 'loading' ? (
                                    <span className="text-slate-500 font-mono text-sm animate-pulse">Awaiting audio stream...</span>
                                ) : (
                                    Array.from({ length: 32 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 bg-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                                            style={{
                                                height: `${Math.max(6, (Math.sin(Date.now() / 150 + i * 0.5) * 0.5 + 0.5) * volume * 80)}px`,
                                                opacity: Math.max(0.2, volume * 0.8),
                                            }}
                                        ></div>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center gap-8 w-full justify-center">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${speechStatus === 'listening' ? 'bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`}></div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">User Mic</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${speechStatus === 'speaking' ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Synthesizing</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="mt-auto pt-8 flex justify-center">
                        <button
                            onClick={toggleCall}
                            className="group flex flex-col items-center gap-3"
                        >
                            <div className="h-20 w-20 rounded-full bg-red-500/10 border border-red-500/30 group-hover:bg-red-500 group-hover:border-red-500 text-red-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] group-active:scale-90">
                                <PhoneOff className="h-8 w-8" />
                            </div>
                            <span className="text-xs text-red-400 font-bold uppercase tracking-widest group-hover:text-red-500 transition-colors">Terminate Link</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ======================== CHAT AREA ======================== */}
            <div className="flex-1 overflow-y-auto p-6 relative z-0 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-6 pb-6 flex-1 flex flex-col">
                    {/* Welcome Screen */}
                    {localMessages.length === 1 && (
                        <div className="flex flex-col items-center justify-center flex-1 text-center min-h-[400px]">
                            <div className="p-4 bg-blue-50 text-blue-500 rounded-full mb-6">
                                <Activity className="h-12 w-12" />
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-800 mb-3">How can I assist you today?</h3>
                            <p className="text-slate-500 max-w-lg mb-8 font-medium">Type a clinical query, attach medical images for analysis, or tap the phone icon to start a voice session with Gemini.</p>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
                                <button className="p-5 bg-white hover:bg-red-50 rounded-2xl border border-slate-200 shadow-sm text-left transition-all hover:shadow-md group">
                                    <AlertCircle className="h-6 w-6 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="text-sm font-bold text-slate-800 mb-1">Drug Interaction Check</div>
                                    <div className="text-xs text-slate-500 font-medium">Analyze contraindications</div>
                                </button>
                                <button className="p-5 bg-white hover:bg-blue-50 rounded-2xl border border-slate-200 shadow-sm text-left transition-all hover:shadow-md group">
                                    <Activity className="h-6 w-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="text-sm font-bold text-slate-800 mb-1">Analyze Lab Results</div>
                                    <div className="text-xs text-slate-500 font-medium">Upload reports for breakdown</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {localMessages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            {msg.role !== 'system' && (
                                <div className="max-w-[85%]">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1 inline-block">
                                        {msg.role === 'user' ? 'Dr. Sarah' : 'LifeBeat AI'}
                                    </span>
                                    <div className={`rounded-2xl text-[15px] leading-relaxed font-medium shadow-sm border overflow-hidden
                                        ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white border-blue-600 rounded-tr-sm'
                                            : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm'
                                        }`}
                                    >
                                        {/* Show attached image if present */}
                                        {msg.imageUrl && (
                                            <div className="p-2 pb-0">
                                                <img src={msg.imageUrl} alt="Attached" className="rounded-xl max-h-48 object-contain w-full bg-slate-100" />
                                            </div>
                                        )}
                                        <div className="p-5">
                                            {msg.content}
                                            {msg.role === 'assistant' && (
                                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                                    <button className="text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-slate-400 hover:text-blue-600 font-bold transition-colors">
                                                        <FileText className="h-3.5 w-3.5" /> Copy Note
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex flex-col items-start max-w-[85%]">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1 inline-block">LifeBeat AI</span>
                            <div className="p-5 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm flex gap-2 items-center">
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* ======================== INPUT AREA ======================== */}
            <div className="p-6 pt-2 bg-slate-50 border-t border-slate-200/50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] relative z-20 shrink-0 flex justify-center">
                <div className="w-full max-w-4xl">
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-bold flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" /> {errorMsg}
                        </div>
                    )}

                    {/* Image Preview Strip */}
                    {attachedImage && (
                        <div className="mb-3 flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                            <img src={attachedImage} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-slate-200" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate">{attachedImageName}</p>
                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                    <ImageIcon className="h-3 w-3" /> Ready to send with message
                                </p>
                            </div>
                            <button onClick={removeAttachment} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all flex flex-col relative">
                        <form onSubmit={handleTextSubmit} className="flex items-end gap-2 w-full relative">
                            {/* Attach Image */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all h-[46px] flex items-center justify-center"
                                title="Attach image"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>

                            {/* Text Input */}
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Message LifeBeat or attach an image..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-slate-700 font-medium resize-none py-3 max-h-40 placeholder:text-slate-400"
                                rows={1}
                                disabled={callStatus === 'active' || isSending}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleTextSubmit(e);
                                    }
                                }}
                            />

                            <div className="flex gap-2 pb-0.5 pr-0.5 h-[46px] items-center">
                                {/* CALL BUTTON (Phone icon) */}
                                <button
                                    type="button"
                                    onClick={toggleCall}
                                    disabled={callStatus === 'loading'}
                                    className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center justify-center shadow-md shadow-emerald-500/20 hover:scale-110 active:scale-95 disabled:opacity-50"
                                    title="Call LifeBeat AI"
                                >
                                    <Phone className="h-4.5 w-4.5" />
                                </button>

                                {/* SEND BUTTON */}
                                <button
                                    type="submit"
                                    disabled={(!textInput.trim() && !attachedImage) || isSending}
                                    className="h-10 w-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center hover:scale-105 active:scale-95"
                                >
                                    <Send className="h-4 w-4 ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center bg-slate-50"><Activity className="h-8 w-8 text-blue-500 animate-pulse" /></div>}>
            <CopilotDashboard />
        </Suspense>
    );
}
