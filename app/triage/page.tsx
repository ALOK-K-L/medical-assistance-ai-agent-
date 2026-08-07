"use client";

import { useState, useEffect } from 'react';
import { Camera, FileText, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function TriageDashboard() {
    const [name, setName] = useState('');
    const [details, setDetails] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [queue, setQueue] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    // Fetch the triage queue
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
        // Set up polling every 10 seconds
        const interval = setInterval(fetchQueue, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewUrl(event.target?.result as string);
            };
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !symptoms) return;

        setIsLoading(true);
        try {
            let base64Image = null;
            if (imageFile) {
                base64Image = await convertToBase64(imageFile);
            }

            const res = await fetch('/api/triage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    details,
                    symptoms,
                    imageUrl: base64Image
                })
            });

            if (res.ok) {
                await fetchQueue();
                // Reset form
                setName('');
                setDetails('');
                setSymptoms('');
                setImageFile(null);
                setPreviewUrl(null);
            } else {
                alert("Failed to submit triage data.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during submission.");
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-red-600 bg-red-100 border-red-200';
        if (score >= 50) return 'text-amber-600 bg-amber-100 border-amber-200';
        return 'text-green-600 bg-green-100 border-green-200';
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
            <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Activity className="text-blue-600 h-8 w-8" />
                        Clinical Intelligence Triage
                    </h1>
                    <p className="text-slate-500 mt-1">AI-Assisted Patient Prioritization System</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                    <Clock className="h-4 w-4" />
                    {new Date().toLocaleTimeString()}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Intake Form */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <FileText className="text-blue-500 h-5 w-5" />
                            New Patient Intake
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Medical Details / History</label>
                                <input 
                                    type="text" 
                                    value={details}
                                    onChange={e => setDetails(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Diabetic, allergic to penicillin"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Current Symptoms & Vitals *</label>
                                <textarea 
                                    value={symptoms}
                                    onChange={e => setSymptoms(e.target.value)}
                                    required
                                    rows={4}
                                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Describe symptoms, BP, Heart Rate, SpO2..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Attach Medical Image (ECG, Wound, etc.)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {previewUrl ? (
                                        <div className="flex flex-col items-center">
                                            <img src={previewUrl} alt="Preview" className="h-32 object-contain mb-2 rounded" />
                                            <span className="text-xs text-blue-600 font-medium">Click to change image</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-500 py-4">
                                            <Camera className="h-8 w-8 mb-2 text-slate-400" />
                                            <span className="text-sm font-medium">Click or drag image here</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                        Analyzing via AI...
                                    </>
                                ) : (
                                    <>
                                        <Activity className="h-5 w-5" />
                                        Analyze & Triage Patient
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Priority Queue */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="text-red-500 h-5 w-5" />
                                Live Priority Queue
                            </h2>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                                {queue.length} Waiting
                            </span>
                        </div>

                        {queue.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <CheckCircle className="h-16 w-16 mb-4 text-slate-300" />
                                <p className="text-lg font-medium">Queue is empty</p>
                                <p className="text-sm">All patients have been triaged.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {queue.map((record, idx) => (
                                    <div 
                                        key={record.id} 
                                        onClick={() => setSelectedPatient(record)}
                                        className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all bg-white group flex items-start gap-4"
                                    >
                                        <div className={`shrink-0 w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 ${getScoreColor(record.criticalScore)}`}>
                                            <span className="text-2xl font-bold leading-none">{record.criticalScore}</span>
                                            <span className="text-[10px] font-bold uppercase">Score</span>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-800 truncate text-lg group-hover:text-blue-600 transition-colors">
                                                    {record.patient.name}
                                                </h3>
                                                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(record.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2">{record.symptoms}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Explainability Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className={`p-6 border-b ${getScoreColor(selectedPatient.criticalScore).replace('text-', 'bg-').replace('100', '50')} flex justify-between items-center`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-white ${getScoreColor(selectedPatient.criticalScore)}`}>
                                    <span className="font-bold">{selectedPatient.criticalScore}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedPatient.patient.name}</h3>
                                    <p className="text-sm text-slate-600 font-medium">Criticality Score: {selectedPatient.criticalScore}/100</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedPatient(null)}
                                className="text-slate-400 hover:text-slate-600 bg-white/50 hover:bg-white p-2 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Clinical Analysis</h4>
                                <div className="bg-blue-50 text-blue-900 p-4 rounded-lg text-sm leading-relaxed border border-blue-100">
                                    {selectedPatient.analysis}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reported Symptoms</h4>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">
                                        {selectedPatient.symptoms}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patient Details</h4>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">
                                        {selectedPatient.patient.details || 'None provided'}
                                    </p>
                                </div>
                            </div>

                            {selectedPatient.imageUrl === 'Image attached' && (
                                <div className="text-xs font-semibold text-amber-600 bg-amber-50 p-2 rounded inline-block">
                                    📸 Multimodal Image analyzed in this assessment
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button 
                                    onClick={() => setSelectedPatient(null)}
                                    className="px-4 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-50"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium shadow-sm transition-colors">
                                    Mark as Treated
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
