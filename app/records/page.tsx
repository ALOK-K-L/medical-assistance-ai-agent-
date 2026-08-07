"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, Activity, Brain, Save, Edit3, Image as ImageIcon, Upload, Loader2, RefreshCw } from 'lucide-react';

interface TriageRecord {
    id: string;
    criticalScore: number;
    analysis: string;
    symptoms: string;
    createdAt: string;
}

interface Patient {
    id: string;
    name: string;
    details: string | null;
    triageRecords: TriageRecord[];
}

export default function MedicalRecordsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftDetails, setDraftDetails] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // AI Assist State
    const [aiInstructions, setAiInstructions] = useState('');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await fetch('/api/records');
            const data = await res.json();
            if (data.patients) setPatients(data.patients);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePatientClick = (p: Patient) => {
        setSelectedPatient(p);
        setDraftName(p.name);
        setDraftDetails(p.details || '');
        setIsEditing(false);
        setAiInstructions('');
        setAttachedImage(null);
    };

    const handleSave = async () => {
        if (!selectedPatient) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId: selectedPatient.id, name: draftName, details: draftDetails })
            });
            if (res.ok) {
                // Update local state
                const updatedPatients = patients.map(p => 
                    p.id === selectedPatient.id ? { ...p, name: draftName, details: draftDetails } : p
                );
                setPatients(updatedPatients);
                setSelectedPatient({ ...selectedPatient, name: draftName, details: draftDetails });
                setIsEditing(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePatient = async () => {
        if (!selectedPatient) return;
        if (!window.confirm(`Are you sure you want to permanently delete ${selectedPatient.name}?`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch('/api/records', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId: selectedPatient.id })
            });
            if (res.ok) {
                setPatients(patients.filter(p => p.id !== selectedPatient.id));
                setSelectedPatient(null);
            }
        } catch (e) {
            console.error("Failed to delete patient", e);
            alert("An error occurred while deleting the patient.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAiUpdate = async () => {
        if (!selectedPatient) return;
        if (!aiInstructions.trim() && !attachedImage) return;

        setIsAiProcessing(true);
        setIsEditing(true); // Open edit mode so user can see draft populate

        try {
            const res = await fetch('/api/records/ai-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentDetails: selectedPatient.details,
                    instructions: aiInstructions,
                    imageBase64: attachedImage
                })
            });
            const data = await res.json();
            if (data.draft) {
                setDraftDetails(data.draft);
                setAiInstructions('');
                setAttachedImage(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAiProcessing(false);
        }
    };

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* LEFT PANE - Patient List */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        Patient Registry
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search patients..." 
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder-slate-400 text-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32 text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : filteredPatients.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => handlePatientClick(p)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                                selectedPatient?.id === p.id 
                                ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10' 
                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-md'
                            }`}
                        >
                            <h3 className="font-bold text-sm truncate">{p.name}</h3>
                            {p.triageRecords[0] && (
                                <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider ${
                                    selectedPatient?.id === p.id ? 'text-blue-100' : 'text-slate-400'
                                }`}>
                                    <Activity className="h-3 w-3" />
                                    Last Triage: Score {p.triageRecords[0].criticalScore}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT PANE - Patient Details */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 relative">
                {selectedPatient ? (
                    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={draftName} 
                                        onChange={e => setDraftName(e.target.value)} 
                                        className="text-3xl font-black text-slate-800 tracking-tight bg-slate-100 border border-slate-300 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md mb-1"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">{selectedPatient.name}</h1>
                                )}
                                <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Medical Record
                                </p>
                            </div>
                            <button 
                                onClick={handleDeletePatient}
                                disabled={isDeleting || isEditing}
                                className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors border border-red-200/50 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '✕ Delete Patient'}
                            </button>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            
                            {/* Column 1: Record & Triage History */}
                            <div className="space-y-8">
                                {/* Current Medical Record */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-blue-500" />
                                            Active Medical Details
                                        </h3>
                                        {!isEditing && (
                                            <button 
                                                onClick={() => setIsEditing(true)}
                                                className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" /> Edit manually
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isEditing ? (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <textarea 
                                                value={draftDetails}
                                                onChange={(e) => setDraftDetails(e.target.value)}
                                                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                                placeholder="Enter patient details..."
                                            />
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    onClick={() => { setIsEditing(false); setDraftName(selectedPatient.name); setDraftDetails(selectedPatient.details || ''); }}
                                                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    {isSaving ? 'Saving...' : 'Save Record'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedPatient.details || "No medical details on file."}
                                        </div>
                                    )}
                                </div>

                                {/* Previous Triage Analysis */}
                                {selectedPatient.triageRecords[0] && (
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700 shadow-lg text-white">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-4">
                                            <Brain className="h-4 w-4 text-emerald-400" />
                                            Latest AI Triage
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Symptoms</p>
                                                <p className="text-sm font-medium text-slate-200">{selectedPatient.triageRecords[0].symptoms}</p>
                                            </div>
                                            <div className="pt-4 border-t border-slate-700/50">
                                                <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">Clinical Reasoning</p>
                                                <p className="text-sm text-slate-300 leading-relaxed">{selectedPatient.triageRecords[0].analysis}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Column 2: AI Assist Update */}
                            <div>
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
                                    
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-2">
                                        <Brain className="h-4 w-4 text-indigo-500" />
                                        AI Assist Update
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mb-6">
                                        Upload a lab report or describe changes. The AI will synthesize and prepare a draft update for the medical record.
                                    </p>

                                    <div className="space-y-5">
                                        {/* Instruction Input */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Instructions</label>
                                            <textarea 
                                                value={aiInstructions}
                                                onChange={(e) => setAiInstructions(e.target.value)}
                                                className="w-full h-24 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder-slate-300"
                                                placeholder="e.g. 'Patient blood pressure stabilized to 120/80, discharged with paracetamol.'"
                                            />
                                        </div>

                                        {/* File Upload Area */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Upload Report (Optional)</label>
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-1 overflow-hidden group-hover:border-indigo-100 transition-colors">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    className="hidden" 
                                                />
                                                {attachedImage ? (
                                                    <div className="relative h-32 w-full rounded-lg overflow-hidden bg-slate-900 group/img">
                                                        <img src={attachedImage} className="w-full h-full object-cover opacity-70" alt="Uploaded report" />
                                                        <button 
                                                            onClick={() => setAttachedImage(null)}
                                                            className="absolute inset-0 m-auto h-8 w-max px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1.5"
                                                        >
                                                            Remove Image
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full h-32 bg-slate-50 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-2 rounded-lg transition-colors text-slate-400 hover:text-indigo-500"
                                                    >
                                                        <Upload className="h-6 w-6" />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Select Image</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleAiUpdate}
                                            disabled={isAiProcessing || (!aiInstructions && !attachedImage)}
                                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {isAiProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                                            {isAiProcessing ? 'Synthesizing Record...' : 'Generate Update'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <FileText className="h-12 w-12 text-slate-200 mb-4" />
                        <h2 className="text-xl font-bold text-slate-600">Select a Patient</h2>
                        <p className="text-sm font-medium mt-1">Choose a patient from the registry to view and update their records.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
