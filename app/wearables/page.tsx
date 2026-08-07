"use client";

import { useState, useEffect } from 'react';
import { Activity, Watch, HeartPulse, Thermometer, Wind, Brain, Loader2 } from 'lucide-react';

export default function WearablesPage() {
    const [telemetry, setTelemetry] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);

    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                const res = await fetch('/api/telemetry');
                if (res.ok) {
                    setTelemetry(await res.json());
                }
            } catch (e) {}
        };
        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 2000);
        return () => clearInterval(interval);
    }, []);

    const analyzeTelemetry = async () => {
        if (!telemetry) return;
        setIsAnalyzing(true);
        setAiResult(null);

        const prompt = `[WEARABLE TELEMETRY ANALYSIS]
Analyze the following live sensor data and provide a concise clinical triage recommendation:
Heart Rate: ${telemetry.vitals.heartRate} BPM
Oxygen: ${telemetry.vitals.oxygenSaturation}%
Temperature: ${telemetry.vitals.temperature}°F
Blood Pressure: ${telemetry.vitals.bloodPressure}
ECG: ${telemetry.vitals.ecgStatus}

Keep it short, authoritative, and mention any critical risks.`;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!res.ok) throw new Error("API Error");

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("No reader");

            let resultText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split('\n\n');
                buffer = chunks.pop() || '';

                for (const chunk of chunks) {
                    if (chunk.startsWith('data: ') && chunk !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(chunk.slice(6));
                            if (data.choices?.[0]?.delta?.content) {
                                resultText += data.choices[0].delta.content;
                                setAiResult(resultText);
                            }
                        } catch (e) {}
                    }
                }
            }
        } catch (error) {
            console.error(error);
            setAiResult("Error communicating with AI agent.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 relative">
            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Watch className="h-8 w-8 text-blue-600" />
                            IoT Wearable Simulator
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Live telemetry stream mimicking health sensor data processing (e.g. Apple Watch).
                        </p>
                    </div>
                    <div className="bg-emerald-100/50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Sensor Stream Active
                    </div>
                </div>

                {!telemetry ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Heart Rate */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:border-red-300 transition-colors">
                            <div className="absolute top-4 right-4 bg-red-50 p-2 rounded-xl text-red-500">
                                <HeartPulse className="h-6 w-6" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Heart Rate</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-slate-800 transition-all duration-300">{telemetry.vitals.heartRate}</span>
                                <span className="text-sm font-bold text-slate-400">BPM</span>
                            </div>
                        </div>

                        {/* SpO2 */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
                            <div className="absolute top-4 right-4 bg-blue-50 p-2 rounded-xl text-blue-500">
                                <Wind className="h-6 w-6" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Oxygen (SpO2)</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-slate-800 transition-all duration-300">{telemetry.vitals.oxygenSaturation}</span>
                                <span className="text-sm font-bold text-slate-400">%</span>
                            </div>
                        </div>

                        {/* Temp */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
                            <div className="absolute top-4 right-4 bg-orange-50 p-2 rounded-xl text-orange-500">
                                <Thermometer className="h-6 w-6" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Body Temp</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-slate-800 transition-all duration-300">{telemetry.vitals.temperature}</span>
                                <span className="text-sm font-bold text-slate-400">°F</span>
                            </div>
                        </div>

                        {/* Blood Pressure */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
                            <div className="absolute top-4 right-4 bg-purple-50 p-2 rounded-xl text-purple-500">
                                <Activity className="h-6 w-6" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Blood Pressure</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800 transition-all duration-300">{telemetry.vitals.bloodPressure}</span>
                                <span className="text-sm font-bold text-slate-400">mmHg</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-center mt-6">
                    <button 
                        onClick={analyzeTelemetry}
                        disabled={!telemetry || isAnalyzing}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isAnalyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Brain className="h-6 w-6" />}
                        {isAnalyzing ? 'Analyzing Vitals...' : 'AI Analyze Vitals'}
                    </button>
                </div>

                {aiResult && (
                    <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 mt-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
                            <Brain className="h-4 w-4" /> AI Telemetry Analysis
                        </h3>
                        <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {aiResult}
                        </p>
                    </div>
                )}
                
                <div className="bg-slate-900 rounded-2xl p-6 mt-8 flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-bold mb-1">Raw API JSON Payload</h4>
                        <p className="text-slate-400 text-sm">Showing the live data block received from `/api/telemetry`</p>
                    </div>
                    <pre className="bg-black/50 p-4 rounded-xl text-emerald-400 font-mono text-xs w-1/2 overflow-x-auto">
                        {JSON.stringify(telemetry, null, 2)}
                    </pre>
                </div>
            </div>
        </main>
    );
}
