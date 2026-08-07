import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/db';

const AICREDIT_URL = 'https://api.aicredits.in/v1/chat/completions';
const MODEL_NAME = 'google/gemini-2.5-flash';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { unstructuredText, name, details, symptoms, imageUrl } = body;

        let finalName = name;
        let finalSymptoms = symptoms;
        let finalDetails = details || '';
        const apiKey = process.env.AICREDIT_API_KEY || '';

        // 1. Agentic Extraction Pass
        if (unstructuredText) {
            const extractionPrompt = `Extract the patient's name, symptoms, and any medical details from the following emergency admission text.
If the name is unknown, use "To be updated". If details are unknown, leave empty.
Text: "${unstructuredText}"

Return purely a JSON object (no markdown):
{ "name": "string", "symptoms": "string", "details": "string" }`;

            try {
                const extractRes = await fetch(AICREDIT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: MODEL_NAME,
                        messages: [{ role: 'user', content: extractionPrompt }],
                        temperature: 0.1
                    })
                });
                
                if (extractRes.ok) {
                    const exData = await extractRes.json();
                    const exText = exData.choices?.[0]?.message?.content || '{}';
                    const jsonStr = exText.replace(/```json\n?|\n?```/g, '').trim();
                    const parsed = JSON.parse(jsonStr);
                    finalName = parsed.name || "To be updated";
                    finalSymptoms = parsed.symptoms || unstructuredText;
                    finalDetails = parsed.details || "";
                } else {
                    finalName = "To be updated";
                    finalSymptoms = unstructuredText;
                }
            } catch (e) {
                console.error("Extraction error", e);
                finalName = "To be updated";
                finalSymptoms = unstructuredText;
            }
        }

        if (!finalName || !finalSymptoms) {
            return NextResponse.json({ error: 'Input is required' }, { status: 400 });
        }

        // 2. Database Lookup / Profile Creation
        let patient = await prisma.patient.findUnique({
            where: { name: finalName },
            include: { triageRecords: { orderBy: { createdAt: 'desc' }, take: 3 } } // Fetch recent history
        });

        if (!patient) {
            patient = await prisma.patient.create({
                data: {
                    name: finalName,
                    details: finalDetails,
                },
                include: { triageRecords: true }
            });
        }

        // 2. Prepare Context for AI
        const historyText = patient.triageRecords && patient.triageRecords.length > 0 
            ? `Past History:\n${patient.triageRecords.map((r: any) => `- Score: ${r.criticalScore}, Symptoms: ${r.symptoms}`).join('\n')}`
            : `No past history for this patient.`;

        const messages: any[] = [
            {
                role: 'system',
                content: `You are an expert Clinical Triage AI assistant for an emergency department. 
Your job is to analyze the patient's symptoms, medical details, past history, and any attached images (like an ECG or wound photo) to provide a real-time clinical assessment.

CRITICAL INSTRUCTION: You MUST output your response strictly as a JSON object. Do NOT include ANY conversational text, pleasantries, or explanations outside of the JSON object. Do NOT say "Here is the analysis". Just output the raw JSON.

The JSON object must have exactly these keys:
- "criticalScore": An integer from 0 to 100 where 100 is immediately life-threatening, and 0 is completely stable.
- "analysis": A clear, concise clinical explanation of your reasoning (max 4 sentences).
- "recommendedAction": Immediate next steps for the nursing staff.`
            }
        ];

        let userMessageContent: any[] = [
            { type: 'text', text: `Patient Name: ${finalName}\nDetails: ${finalDetails || 'None'}\nSymptoms: ${finalSymptoms}\n\n${historyText}` }
        ];

        if (imageUrl) {
            userMessageContent.push({
                type: 'image_url',
                image_url: {
                    url: imageUrl
                }
            });
        }

        messages.push({
            role: 'user',
            content: userMessageContent
        });

        // 4. Call AICredit API (Gemini 2.5 Flash)
        const aiResponse = await fetch(AICREDIT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages,
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error("AI API Error:", errorText);
            throw new Error(`AI API failed: ${aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();
        const aiText = aiData.choices?.[0]?.message?.content || '{}';
        
        // Strip markdown code blocks if AI returned them
        const jsonStr = aiText.replace(/```json\n?|\n?```/g, '').trim();
        let triageResult;
        try {
            triageResult = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse AI JSON:", jsonStr);
            triageResult = {
                criticalScore: 50,
                analysis: "Failed to parse AI response. " + jsonStr.substring(0, 100),
                recommendedAction: "Manual review required."
            };
        }

        // 5. Save Triage Record to DB
        const record = await prisma.triageRecord.create({
            data: {
                patientId: patient.id,
                criticalScore: triageResult.criticalScore || 50,
                analysis: triageResult.analysis || 'No analysis provided',
                symptoms: finalSymptoms,
                imageUrl: imageUrl ? 'Image attached' : null,
                status: 'waiting'
            }
        });

        return NextResponse.json({
            patient,
            triageRecord: record,
            recommendedAction: triageResult.recommendedAction
        });

    } catch (error: any) {
        console.error("Triage POST Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const records = await prisma.triageRecord.findMany({
            where: { status: 'waiting' },
            include: { patient: true },
            orderBy: { criticalScore: 'desc' }
        });
        
        return NextResponse.json(records);
    } catch (error: any) {
        console.error("Triage GET Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
