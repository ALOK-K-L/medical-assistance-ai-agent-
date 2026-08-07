"use client";

export default function ArchitecturePage() {
    return (
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#0F1115] relative">
            <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">System Architecture</h1>
                    <p className="text-slate-400 font-medium">Full technical blueprint of the LifeBeat Clinical Intelligence Pipeline.</p>
                </div>

                {/* Architecture Diagram - Visual Representation */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-6">Data Flow Pipeline</h2>
                    
                    {/* Input Layer */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">INPUT LAYER — Multimodal Data Sources</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['🎙️ Voice (Vapi)', '🩻 Medical Images', '📝 Text / EHR', '⌚ IoT Wearables'].map((item, i) => (
                                <div key={i} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl px-4 py-3 text-xs font-bold text-center">{item}</div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center"><div className="w-0.5 h-8 bg-slate-700"></div></div>

                    {/* Processing Layer */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">PROCESSING LAYER — AI Inference Engine</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl px-4 py-4 text-xs font-bold text-center">
                                <div className="text-lg mb-1">☁️</div>
                                Cloud AI<br/><span className="text-purple-400/60 font-normal">Gemini 2.5 Flash</span>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl px-4 py-4 text-xs font-bold text-center">
                                <div className="text-lg mb-1">🔒</div>
                                Edge AI<br/><span className="text-emerald-400/60 font-normal">MedGemma:4b (Ollama)</span>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl px-4 py-4 text-xs font-bold text-center">
                                <div className="text-lg mb-1">🧠</div>
                                Tool Orchestration<br/><span className="text-amber-400/60 font-normal">Multi-Agent Routing</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center"><div className="w-0.5 h-8 bg-slate-700"></div></div>

                    {/* Tool Layer */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">TOOL LAYER — Agent Functions</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['admit_patient', 'search_medical_record', 'check_drug_interactions', 'get_available_doctors', 'get_rooms_status', 'get_bed_count', 'send_whatsapp_message', 'update_medical_record'].map((tool, i) => (
                                <div key={i} className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-[11px] font-mono text-center">{tool}</div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center"><div className="w-0.5 h-8 bg-slate-700"></div></div>

                    {/* Data Layer */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">DATA LAYER — Persistence & Compliance</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-xl px-4 py-3 text-xs font-bold text-center">
                                💾 PostgreSQL / Prisma ORM<br/><span className="text-cyan-400/60 font-normal">Patient EHR + Triage Records</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-xs font-bold text-center">
                                🛡️ HIPAA Audit Logger<br/><span className="text-red-400/60 font-normal">PHI-Masked Event Trail</span>
                            </div>
                            <div className="bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl px-4 py-3 text-xs font-bold text-center">
                                📡 IoT Telemetry API<br/><span className="text-teal-400/60 font-normal">Real-Time Sensor Ingestion</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center"><div className="w-0.5 h-8 bg-slate-700"></div></div>

                    {/* Output Layer */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">OUTPUT LAYER — Clinical Decision Support</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['📊 Triage Dashboard', '🚨 ESI Prioritization', '🩺 Differential Dx', '🔥 Saliency Heatmap'].map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-xs font-bold text-center">{item}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tech Stack Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-6">Technology Stack</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Layer</th>
                                    <th className="px-6 py-4">Technology</th>
                                    <th className="px-6 py-4">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {[
                                    ['Frontend', 'Next.js 16, React, Tailwind CSS', 'SSR Dashboard with real-time updates'],
                                    ['Backend', 'Next.js API Routes, Node.js', 'Serverless inference pipeline'],
                                    ['Cloud AI', 'Google Gemini 2.5 Flash', 'Vision + clinical reasoning'],
                                    ['Edge AI', 'MedGemma:4b via Ollama', 'Offline private inference'],
                                    ['Voice', 'Vapi Assistant API', 'Real-time speech-to-clinical-text'],
                                    ['Database', 'SQLite + Prisma ORM', 'EHR storage and patient records'],
                                    ['Compliance', 'Custom HIPAA Logger', 'PHI-masked audit trail'],
                                    ['IoT', 'Custom REST Telemetry API', 'Wearable sensor data ingestion'],
                                ].map(([layer, tech, purpose], i) => (
                                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-200">{layer}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-blue-400">{tech}</td>
                                        <td className="px-6 py-4 text-slate-400">{purpose}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
