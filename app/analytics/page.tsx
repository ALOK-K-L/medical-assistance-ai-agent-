"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Users, AlertTriangle, ShieldAlert, Sparkles, Loader2, BrainCircuit } from 'lucide-react';

interface Stats {
    totalPatients: number;
    highRiskCount: number;
    avgScore: number;
    distribution: { low: number; medium: number; urgent: number; critical: number };
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/analytics');
            const data = await res.json();
            if (data.stats) setStats(data.stats);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const generateAiAnalysis = async () => {
        setIsAiLoading(true);
        try {
            const res = await fetch('/api/analytics', { method: 'POST' });
            const data = await res.json();
            if (data.analysis) setAiAnalysis(data.analysis);
        } catch (e) {
            console.error(e);
            setAiAnalysis("Failed to generate AI analysis. Please check your connection.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
                return <h3 key={i} className="text-lg font-bold text-slate-800 mt-6 mb-3">{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('### ')) {
                return <h4 key={i} className="text-md font-bold text-slate-700 mt-4 mb-2">{line.replace('### ', '')}</h4>;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={i} className="ml-6 mb-1 text-slate-600 list-disc">{line.substring(2)}</li>;
            }
            if (line.match(/^\d+\. /)) {
                return <li key={i} className="ml-6 mb-1 text-slate-600 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
            }
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="mb-2 text-slate-600 leading-relaxed">{line}</p>;
        });
    };

    if (isLoading || !stats) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const maxDist = Math.max(stats.distribution.low, stats.distribution.medium, stats.distribution.urgent, stats.distribution.critical, 1);

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-indigo-600" />
                            Analytics & Metrics
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Real-time hospital statistics and predictive risk analysis
                        </p>
                    </div>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="h-16 w-16 text-blue-500" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Total Active Patients</h3>
                        <div className="text-4xl font-black text-slate-800">{stats.totalPatients}</div>
                    </div>
                    
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="h-16 w-16 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Avg Critical Score</h3>
                        <div className="text-4xl font-black text-slate-800">{stats.avgScore} <span className="text-lg text-slate-400 font-medium">/100</span></div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.05)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle className="h-16 w-16 text-red-500" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-2">High-Risk Patients</h3>
                        <div className="text-4xl font-black text-red-600">{stats.highRiskCount}</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Risk Distribution */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                Risk Distribution
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Low Risk */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Low Acuity (ESI 5)</span>
                                        <span>{stats.distribution.low}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(stats.distribution.low / maxDist) * 100}%` }}></div>
                                    </div>
                                </div>
                                {/* Medium Risk */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Medium (ESI 4)</span>
                                        <span>{stats.distribution.medium}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(stats.distribution.medium / maxDist) * 100}%` }}></div>
                                    </div>
                                </div>
                                {/* Urgent Risk */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Urgent (ESI 3)</span>
                                        <span>{stats.distribution.urgent}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(stats.distribution.urgent / maxDist) * 100}%` }}></div>
                                    </div>
                                </div>
                                {/* Critical Risk */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-red-500 mb-1">
                                        <span>Critical (ESI 1 & 2)</span>
                                        <span>{stats.distribution.critical}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${(stats.distribution.critical / maxDist) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operational Scales */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-emerald-500" />
                                Operational Scales
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Bed Capacity */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Ward Bed Capacity</span>
                                        <span>{Math.min(Math.round((stats.totalPatients / 40) * 100), 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${stats.totalPatients > 35 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((stats.totalPatients / 40) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                                {/* Staffing Ratio */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Nurse-to-Patient Strain</span>
                                        <span>{stats.totalPatients > 20 ? 'High' : 'Optimal'}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${stats.totalPatients > 20 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((stats.totalPatients / 30) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                                {/* Average Wait Time */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Est. Triage Wait Time</span>
                                        <span>{Math.max(15, stats.totalPatients * 5)} mins</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(((stats.totalPatients * 5) / 120) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Right Column: AI Evidence-Backed Decision Support */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-1 relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            
                            <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-8 h-full min-h-[400px] flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                            <BrainCircuit className="h-6 w-6 text-indigo-600" />
                                            Evidence-Backed Decision Support
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 mt-1">
                                            AI-powered clinical risk prediction based on live triage cohort
                                        </p>
                                    </div>
                                    <button 
                                        onClick={generateAiAnalysis}
                                        disabled={isAiLoading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                                    >
                                        {isAiLoading ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Cohort...</>
                                        ) : (
                                            <><Sparkles className="h-4 w-4" /> Generate AI Analysis</>
                                        )}
                                    </button>
                                </div>

                                <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-100 p-6 overflow-y-auto">
                                    {aiAnalysis ? (
                                        <div className="animate-in fade-in duration-500">
                                            {renderMarkdown(aiAnalysis)}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                            <ShieldAlert className="h-12 w-12 opacity-20" />
                                            <p className="font-medium">Click generate to analyze current patient cohort risks.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
