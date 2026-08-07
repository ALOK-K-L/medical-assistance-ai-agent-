"use client";

import { useState, useEffect } from 'react';

export default function PromptsTab() {
    const [systemPrompt, setSystemPrompt] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.system_prompt) {
                    setSystemPrompt(data.system_prompt);
                } else {
                    setSystemPrompt("You are Yelan, a highly professional and friendly AI receptionist for NeuroBots Clinic. Keep your responses conversational, concise, and helpful. NEVER repeat the same phrase twice. Keep the conversation flowing naturally. If the user repeats themselves, acknowledge it intelligently and move on. Be extremely smart and natural.\n\nYou have access to several database tools. You MUST use them when appropriate:\n1. When a user asks about doctors, use get_available_doctors to check availability.\n2. When a user asks about hospital rooms or beds, use get_rooms_status or get_bed_count.\n3. CRITICAL: When a user books an appointment with a doctor, you MUST confirm the details with them and then immediately use the send_whatsapp_message tool to send a booking confirmation. Never skip this step.\n\nWhen you receive data back from your tools, state the facts naturally. Do NOT apologize or say you could not get the information.");
                }
            })
            .catch(err => console.error(err));
    }, []);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system_prompt: systemPrompt })
            });
            alert("Prompt saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        }
        setIsSaving(false);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-cyan-400 uppercase tracking-widest font-bold mb-6 flex items-center gap-3 border-b border-cyan-500/30 pb-4 text-xl">
                Prompts & Memory
            </h2>
            <p className="text-cyan-200 mb-6">Configure the AI's core instructions and persona.</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-cyan-300">System Prompt</label>
                    <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-48 bg-slate-900 border border-cyan-500/50 p-4 rounded text-cyan-100 placeholder:text-cyan-500/30 focus:outline-none focus:border-cyan-400 font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-cyan-500/60 mt-2">This prompt dictates how the AI behaves and what rules it follows.</p>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="px-6 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-400 rounded font-bold uppercase hover:bg-cyan-500/40 disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save Prompt"}
                </button>
            </div>
        </div>
    );
}
