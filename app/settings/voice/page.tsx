"use client";

import { useState, useEffect } from 'react';

export default function VoiceTab() {
    const [audioEngine, setAudioEngine] = useState<'vapi' | 'local'>('vapi');
    const [voiceType, setVoiceType] = useState<'female' | 'male'>('female');

    useEffect(() => {
        const savedEngine = localStorage.getItem('audio_engine');
        if (savedEngine === 'local' || savedEngine === 'vapi') {
            setAudioEngine(savedEngine);
        }
        const savedVoice = localStorage.getItem('vapi_voice_type') as 'female' | 'male';
        if (savedVoice) {
            setVoiceType(savedVoice);
        }
    }, []);

    const saveAudioEngine = (engine: 'vapi' | 'local') => {
        setAudioEngine(engine);
        localStorage.setItem('audio_engine', engine);
    };

    const saveVoiceType = (type: 'female' | 'male') => {
        setVoiceType(type);
        localStorage.setItem('vapi_voice_type', type);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-cyan-400 uppercase tracking-widest font-bold mb-6 flex items-center gap-3 border-b border-cyan-500/30 pb-4 text-xl">
                Voice Audio Engine
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    onClick={() => saveAudioEngine('vapi')}
                    className={`p-6 border-2 cursor-pointer transition-all ${audioEngine === 'vapi' ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'border-cyan-500/20 bg-slate-900/50 hover:border-cyan-500/50'}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-cyan-300 font-bold uppercase tracking-widest">VAPI Cloud (WebRTC)</h3>
                        {audioEngine === 'vapi' && <span className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff] animate-pulse"></span>}
                    </div>
                    <p className="text-sm text-cyan-200/60 leading-relaxed">
                        Uses the @vapi-ai/web SDK to establish a direct WebRTC connection.
                    </p>
                </div>

                <div 
                    onClick={() => saveAudioEngine('local')}
                    className={`p-6 border-2 cursor-pointer transition-all ${audioEngine === 'local' ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'border-cyan-500/20 bg-slate-900/50 hover:border-cyan-500/50'}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-cyan-300 font-bold uppercase tracking-widest">Local Browser Engine</h3>
                        {audioEngine === 'local' && <span className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff] animate-pulse"></span>}
                    </div>
                    <p className="text-sm text-cyan-200/60 leading-relaxed">
                        Uses your browser's native SpeechRecognition (STT) and SpeechSynthesis (TTS) combined with your local /api/chat Groq route. Best in Chrome.
                    </p>
                </div>
            </div>

            {audioEngine === 'vapi' && (
                <div className="mt-8 border-t border-cyan-500/30 pt-6">
                    <h3 className="text-cyan-300 font-bold uppercase mb-4">VAPI Voice Persona</h3>
                    <select 
                        value={voiceType}
                        onChange={(e) => saveVoiceType(e.target.value as 'female' | 'male')}
                        className="w-full bg-slate-900/80 border border-cyan-500/50 p-3 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    >
                        <option value="female">Yelan (Female) - Friendly & Energetic</option>
                        <option value="male">Zhongli (Male) - Deep & Calm</option>
                    </select>
                </div>
            )}

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={() => {
                        saveAudioEngine(audioEngine);
                        saveVoiceType(voiceType);
                        alert("Voice configuration saved successfully!");
                    }}
                    className="px-6 py-2 bg-cyan-500 text-black font-bold uppercase tracking-widest rounded hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                    Confirm & Save
                </button>
            </div>
        </div>
    );
}
