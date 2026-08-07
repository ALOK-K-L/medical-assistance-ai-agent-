"use client";

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

const API_ENDPOINTS = [
    {
        method: 'POST',
        path: '/api/chat',
        description: 'Core multimodal clinical reasoning endpoint. Accepts text, voice transcriptions, and image data. Orchestrates tool-calling agent for patient admission, record search, and clinical analysis.',
        request: `{
  "messages": [
    { "role": "user", "content": "Admit patient John Doe with chest pain and shortness of breath" }
  ],
  "model": "google/gemini-2.5-flash"
}`,
        response: `SSE Stream (text/event-stream)
data: {"choices":[{"delta":{"content":"Patient John Doe has been..."}}]}
data: [DONE]`,
        tools: ['admit_patient', 'search_medical_record', 'search_patients_by_condition', 'update_medical_record', 'get_available_doctors', 'get_rooms_status', 'get_bed_count', 'send_whatsapp_message', 'check_drug_interactions']
    },
    {
        method: 'GET',
        path: '/api/triage',
        description: 'Returns the live patient queue sorted by critical score (highest first). Powers the Patient Queue dashboard.',
        request: 'No body required.',
        response: `[
  {
    "id": "uuid",
    "name": "John Doe",
    "criticalScore": 85,
    "symptoms": "chest pain, shortness of breath",
    "status": "waiting",
    "analysis": "Suspected acute coronary syndrome..."
  }
]`
    },
    {
        method: 'GET',
        path: '/api/telemetry',
        description: 'Real-time IoT wearable telemetry stream. Returns simulated vital signs from connected health sensors. Polled every 2 seconds by the frontend.',
        request: 'No body required.',
        response: `{
  "timestamp": "2026-08-08T05:00:00.000Z",
  "deviceId": "APPLE_WATCH_S9_PRO",
  "vitals": {
    "heartRate": 78,
    "oxygenSaturation": 97,
    "temperature": 98.4,
    "bloodPressure": "118/76",
    "ecgStatus": "Normal Sinus Rhythm"
  }
}`
    },
    {
        method: 'POST',
        path: '/api/analyze-image',
        description: 'Explainable AI endpoint. Sends a medical image to Gemini Vision and extracts bounding box coordinates for detected anomalies, enabling saliency heatmap rendering.',
        request: `{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}`,
        response: `{
  "analysis": "ANALYSIS: Opacity detected in lower right lobe...",
  "boundingBox": [200, 300, 450, 550]
}`
    },
    {
        method: 'GET',
        path: '/api/audit',
        description: 'Returns parsed HIPAA audit log entries from the server filesystem. Each entry includes PHI-masked patient identifiers.',
        request: 'No body required.',
        response: `{
  "logs": [
    {
      "timestamp": "2026-08-08T05:00:00.000Z",
      "status": "SECURE_PHI_ANONYMIZED",
      "action": "ADMIT_PATIENT",
      "target": "MASKED-a1b2***",
      "details": "Agent admitted new patient: John Doe"
    }
  ]
}`
    },
    {
        method: 'GET',
        path: '/api/records',
        description: 'Returns all patient records with their most recent triage entry. Powers the Medical Records page.',
        request: 'No body required.',
        response: `{
  "patients": [
    { "id": "uuid", "name": "John Doe", "details": "...", "triageRecords": [...] }
  ]
}`
    },
    {
        method: 'GET',
        path: '/api/analytics',
        description: 'Returns aggregated clinical metrics: total patients, average critical scores, ESI distribution, and recent admissions.',
        request: 'No body required.',
        response: `{
  "totalPatients": 24,
  "averageCriticalScore": 62,
  "esiDistribution": { "1": 2, "2": 5, "3": 8, "4": 6, "5": 3 }
}`
    }
];

function EndpointCard({ endpoint }: { endpoint: typeof API_ENDPOINTS[0] }) {
    const [isOpen, setIsOpen] = useState(false);
    const methodColor = endpoint.method === 'GET' ? 'bg-emerald-500' : 'bg-blue-500';

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-800/80 transition-colors">
                <span className={`${methodColor} text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg tracking-wider`}>{endpoint.method}</span>
                <span className="text-white font-mono text-sm font-bold flex-1">{endpoint.path}</span>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </button>
            {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-700 pt-4">
                    <p className="text-slate-400 text-sm">{endpoint.description}</p>
                    {endpoint.tools && (
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-2">Available Tools</span>
                            <div className="flex flex-wrap gap-2">
                                {endpoint.tools.map((t, i) => <span key={i} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-1 rounded">{t}</span>)}
                            </div>
                        </div>
                    )}
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block mb-2">Request</span>
                        <pre className="bg-black/50 p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto">{endpoint.request}</pre>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block mb-2">Response</span>
                        <pre className="bg-black/50 p-4 rounded-xl text-cyan-400 font-mono text-xs overflow-x-auto">{endpoint.response}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ApiDocsPage() {
    return (
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#0F1115] relative">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-5xl mx-auto space-y-6 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 mb-2">
                        <BookOpen className="h-8 w-8 text-cyan-500" />
                        API Documentation
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Complete reference for the LifeBeat Clinical Intelligence REST API. {API_ENDPOINTS.length} endpoints documented.
                    </p>
                </div>

                <div className="space-y-4">
                    {API_ENDPOINTS.map((ep, i) => <EndpointCard key={i} endpoint={ep} />)}
                </div>
            </div>
        </main>
    );
}
