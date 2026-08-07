import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/db';

const AICREDIT_URL = 'https://api.aicredits.in/v1/chat/completions';
const MODEL_NAME = 'google/gemini-2.5-flash';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, details, symptoms, imageUrl } = body;

        if (!name || !symptoms) {
            return NextResponse.json({ error: 'Name and symptoms are required' }, { status: 400 });
        }

        // 1. Database Lookup / Profile Creation
        let patient = await prisma.patient.findUnique({
            where: { name },
            include: { triageRecords: { orderBy: { createdAt: 'desc' }, take: 3 } } // Fetch recent history
        });

        if (!patient) {
            patient = await prisma.patient.create({
                data: {
                    name,
                    details: details || '',
                },
                include: { triageRecords: true }
            });
        }

        // 2. Prepare Context for AI
        const historyText = patient.triageRecords && patient.triageRecords.length > 0 
            ? `Past History:\n${patient.triageRecords.map((r: any) => `- Score: ${r.criticalScore}, Symptoms: ${r.symptoms}`).join('\n')}`
            : `No past history for this patient.`;

        // 3. Multimodal Prompt for Gemini 2.5 Flash
        const messages: any[] = [
            {
                role: 'system',
                content: `You are an expert Clinical Triage AI assistant for an emergency department. 
Your job is to analyze the patient's symptoms, medical details, past history, and any attached images (like an ECG or wound photo) to provide a real-time clinical assessment.
You MUST output your response purely as a JSON object with the following keys:
- "criticalScore": An integer from 0 to 100 where 100 is immediately life-threatening, and 0 is completely stable.
- "analysis": A clear, concise clinical explanation of your reasoning (max 4 sentences).
- "recommendedAction": Immediate next steps for the nursing staff.

Do NOT include markdown formatting outside the JSON, just return valid JSON.`
            }
        ];

        let userMessageContent: any[] = [
            { type: 'text', text: `Patient Name: ${name}\nDetails: ${details || 'None'}\nSymptoms: ${symptoms}\n\n${historyText}` }
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
        const apiKey = process.env.AICREDIT_API_KEY || 'sk-live-f21d41923f6ca090dc26915b5ac4eb1e3907b32496718dd1e7f84031e93bb03b';
        
        const aiResponse = await fetch(AICREDIT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages,
                temperature: 0.1 // Low temperature for consistent clinical output
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
                symptoms,
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
