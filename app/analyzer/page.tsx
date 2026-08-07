"use client";

import { useState, useRef } from 'react';
import { ScanSearch, UploadCloud, Activity, ShieldCheck, Loader2 } from 'lucide-react';

export default function XRayAnalyzerPage() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [boundingBox, setBoundingBox] = useState<number[] | null>(null); // [ymin, xmin, ymax, xmax] (0-1000 scale)

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setAnalysisResult(null);
            setBoundingBox(null);
            
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

    const analyzeImage = async () => {
        if (!imageFile) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setBoundingBox(null);

        try {
            const base64 = await convertToBase64(imageFile);
            const res = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 })
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setAnalysisResult(data.analysis);
            if (data.boundingBox && Array.isArray(data.boundingBox)) {
                setBoundingBox(data.boundingBox);
            }
        } catch (e: any) {
            console.error(e);
            setAnalysisResult(`Error: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 relative">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 mb-2">
                        <ScanSearch className="h-8 w-8 text-purple-600" />
                        Explainable Visual Saliency
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Upload medical imagery. The Gemini 2.5 Flash vision model will analyze it and mathematically map a bounding box directly over regions of clinical interest.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Image Upload & Viewer */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        {!previewUrl ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-full border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
                            >
                                <div className="bg-purple-100 p-4 rounded-full text-purple-600">
                                    <UploadCloud className="h-8 w-8" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">Click to upload X-Ray or Scan</p>
                                    <p className="text-xs text-slate-400 mt-1">JPEG, PNG up to 10MB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                                <img src={previewUrl} alt="Medical Scan" className="w-full h-auto object-contain bg-black" />
                                
                                {/* CSS Heatmap Overlay */}
                                {boundingBox && (
                                    <div 
                                        className="absolute border-2 border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse flex items-center justify-center"
                                        style={{
                                            top: `${boundingBox[0] / 10}%`,
                                            left: `${boundingBox[1] / 10}%`,
                                            height: `${(boundingBox[2] - boundingBox[0]) / 10}%`,
                                            width: `${(boundingBox[3] - boundingBox[1]) / 10}%`,
                                        }}
                                    >
                                        <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                                            Anomaly Detected
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Change Image
                                </button>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageChange}
                        />
                    </div>

                    {/* Right Column: Analysis Controls & Results */}
                    <div className="space-y-6 flex flex-col">
                        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-400" />
                                Analysis Engine
                            </h3>
                            
                            <button 
                                onClick={analyzeImage}
                                disabled={!previewUrl || isAnalyzing}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanSearch className="h-5 w-5" />}
                                {isAnalyzing ? 'Extracting Saliency Coordinates...' : 'Analyze Image & Map Heatmap'}
                            </button>
                            
                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                                Every analysis triggers a secure HIPAA audit log entry.
                            </div>
                        </div>

                        {analysisResult && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex-1 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-purple-600 mb-4">
                                    Clinical Findings
                                </h3>
                                <div className="prose prose-slate prose-sm max-w-none">
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{analysisResult}</p>
                                </div>
                                {boundingBox && (
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saliency Coordinates Mapping</span>
                                        <span className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                            [ymin: {boundingBox[0]}, xmin: {boundingBox[1]}, ymax: {boundingBox[2]}, xmax: {boundingBox[3]}] (Normalized to 1000)
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}
