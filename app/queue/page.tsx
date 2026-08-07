"use client";

import { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, Clock, Plus, Search, Filter, Activity, Camera } from 'lucide-react';

export default function PatientQueuePage() {
    const [queue, setQueue] = useState<any[]>([]);
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    
    // Admit Form State
    const [unstructuredText, setUnstructuredText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchQueue = async () => {
        try {
            const res = await fetch('/api/triage');
            if (res.ok) {
                const data = await res.json();
                setQueue(data);
            }
        } catch (error) {
            console.error("Error fetching queue:", error);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setPreviewUrl(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleAdmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unstructuredText) return;

        setIsSubmitting(true);
        try {
            let base64Image = null;
            if (imageFile) base64Image = await convertToBase64(imageFile);

            const res = await fetch('/api/triage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unstructuredText, imageUrl: base64Image })
            });

            if (res.ok) {
                await fetchQueue();
                setUnstructuredText(''); setImageFile(null); setPreviewUrl(null);
                setShowAdmitModal(false);
            } else {
                alert("Failed to submit triage data.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getEsiLevel = (score: number) => {
        if (score >= 90) return 1;
        if (score >= 70) return 2;
        if (score >= 40) return 3;
        if (score >= 20) return 4;
        return 5;
    };

    const getEsiBadge = (esi: number) => {
        switch(esi) {
            case 1: return 'bg-red-600 text-white shadow-md shadow-red-500/30 ring-2 ring-red-200';
            case 2: return 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-200';
            case 3: return 'bg-amber-400 text-amber-900 shadow-md shadow-amber-400/30 ring-2 ring-amber-100';
            case 4: return 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-200';
            default: return 'bg-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-200';
        }
    };

    const stats = {
        totalActive: queue.length,
        esi1And2: queue.filter(q => getEsiLevel(q.criticalScore) <= 2).length,
    };

    return (
        <main className="flex-1 flex flex-col h-full overflow-y-auto p-8 bg-[#0F1115] relative">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Patient Queue</h2>
                    <p className="text-slate-400 text-sm font-medium">Live AI-Assisted Patient Prioritization</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Current Load</p>
                        <p className="text-sm font-bold text-emerald-400">{queue.length > 5 ? 'HIGH' : 'NORMAL'} <span className="text-slate-300 font-normal ml-1">• {queue.length} Waiting</span></p>
                    </div>
                    <button 
                        onClick={() => setShowAdmitModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5" /> Admit Patient
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-5 mb-8 relative z-10">
                <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 flex flex-col justify-between h-32 border border-slate-100/50">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Active</span>
                        <div className="p-2 bg-blue-50 rounded-xl"><Users className="h-5 w-5 text-blue-500" /></div>
                    </div>
                    <span className="text-4xl font-extrabold text-slate-800">{stats.totalActive}</span>
                </div>
                
                <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 flex flex-col justify-between h-32 border border-slate-100/50">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ESI Level 1 & 2</span>
                        <div className="p-2 bg-red-50 rounded-xl"><AlertCircle className="h-5 w-5 text-red-500" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-800">{stats.esi1And2}</span>
                        {stats.esi1And2 > 0 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Critical</span>}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 flex flex-col justify-between h-32 border border-slate-100/50">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Wait Time</span>
                        <div className="p-2 bg-amber-50 rounded-xl"><Clock className="h-5 w-5 text-amber-500" /></div>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800">12<span className="text-xl text-slate-400 font-bold ml-1">min</span></span>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 flex flex-col justify-between h-32 border border-slate-100/50">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Accuracy</span>
                        <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle className="h-5 w-5 text-emerald-500" /></div>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800">98.4<span className="text-xl text-slate-400 font-bold ml-1">%</span></span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-black/10 overflow-hidden flex-1 flex flex-col min-h-0 text-slate-800 border border-slate-100/50 relative z-10">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
                    <h3 className="font-bold text-xl text-slate-800">Active Patient Queue</h3>
                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input type="text" placeholder="Search ID or Name..." className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-72 transition-all" />
                        </div>
                        <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
                            <Filter className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 sticky top-0 z-10">
                                <th className="p-5 w-1/4">Patient Details</th>
                                <th className="p-5 w-2/5">Presenting Issue</th>
                                <th className="p-5 text-center">ESI Level</th>
                                <th className="p-5">Status & Wait</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {queue.map((record) => {
                                const esi = getEsiLevel(record.criticalScore);
                                return (
                                    <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-5">
                                            <div className="font-extrabold text-slate-800 text-base mb-1">{record.patient.name}</div>
                                            <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">ID: {record.patient.id.substring(0,6).toUpperCase()}</span> 
                                                <span className="truncate max-w-[150px]">{record.patient.details || 'No details'}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 w-2/5">
                                            <div className="text-sm font-medium text-slate-700 line-clamp-2 leading-relaxed mb-3">{record.symptoms}</div>
                                            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 shadow-sm">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1 flex items-center gap-1.5">
                                                    <Activity className="h-3.5 w-3.5" /> AI Analysis & Reasoning
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                                    {record.analysis || "Analysis pending..."}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center align-middle">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${getEsiBadge(esi)} font-black text-lg`}>
                                                    {esi}
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-sm">
                                                    Score: {record.criticalScore}/100
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                                </span>
                                                <span className="text-sm font-bold text-slate-700">Awaiting Triage</span>
                                            </div>
                                            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-1.5 ml-4">
                                                <Clock className="h-3.5 w-3.5" /> 
                                                {Math.floor((Date.now() - new Date(record.createdAt).getTime()) / 60000)} mins ago
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {queue.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center text-slate-400">
                                        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                                        <p className="text-lg font-medium text-slate-600 mb-1">Queue is Empty</p>
                                        <p className="text-sm">All patients have been triaged.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADMIT PATIENT MODAL */}
            {showAdmitModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                            <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-3 tracking-tight">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20"><Plus className="h-5 w-5" /></div>
                                Admit New Patient
                            </h3>
                            <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleAdmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" /> Agentic Emergency Input
                                </label>
                                <p className="text-[10px] text-slate-400 mb-2 font-medium">Type the patient's name, details, and symptoms in plain English. The AI will extract the data, search history, and triage automatically. If the name is unknown, it will be marked "To be updated".</p>
                                <textarea value={unstructuredText} onChange={e=>setUnstructuredText(e.target.value)} required rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all text-slate-800 placeholder:text-slate-400 resize-none shadow-inner" placeholder="e.g. Admit Ram Madhav, he is complaining of severe chest pain..."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Attach Multimodal Context (ECG, Labs)</label>
                                <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 text-center hover:bg-blue-50 hover:border-blue-300 transition-colors relative cursor-pointer group">
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {previewUrl ? (
                                        <div className="flex flex-col items-center">
                                            <img src={previewUrl} className="h-24 mx-auto object-contain rounded-lg shadow-sm mb-3" alt="Preview" />
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Change Image</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <Camera className="h-8 w-8 mb-3" />
                                            <span className="text-sm font-bold">Click or drag image here</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
                                <button type="button" onClick={()=>setShowAdmitModal(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-50 flex items-center gap-2 transition-all">
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Analyzing...
                                        </>
                                    ) : (
                                        'Admit & Run Triage AI'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
