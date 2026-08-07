import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { OpenAI } from 'openai';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const patients = await prisma.patient.findMany({
            include: {
                triageRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const totalPatients = patients.length;
        let highRiskCount = 0;
        let totalScore = 0;
        let patientsWithScore = 0;
        
        const distribution = {
            low: 0,      // 0-20 (ESI 5)
            medium: 0,   // 21-40 (ESI 4)
            urgent: 0,   // 41-70 (ESI 3)
            critical: 0  // 71-100 (ESI 1 & 2)
        };

        for (const p of patients) {
            if (p.triageRecords.length > 0) {
                const score = p.triageRecords[0].criticalScore;
                totalScore += score;
                patientsWithScore++;

                if (score > 70) highRiskCount++;

                if (score <= 20) distribution.low++;
                else if (score <= 40) distribution.medium++;
                else if (score <= 70) distribution.urgent++;
                else distribution.critical++;
            }
        }

        const avgScore = patientsWithScore > 0 ? Math.round(totalScore / patientsWithScore) : 0;

        return NextResponse.json({
            stats: {
                totalPatients,
                highRiskCount,
                avgScore,
                distribution
            }
        });
    } catch (e: any) {
        console.error("GET /api/analytics Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        // Fetch all current active data to send to AI
        const patients = await prisma.patient.findMany({
            include: {
                triageRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        let clinicContext = "Current Patient Queue Context:\n\n";
        
        patients.forEach(p => {
            if (p.triageRecords.length > 0) {
                const t = p.triageRecords[0];
                clinicContext += `- Patient: ${p.name}, Score: ${t.criticalScore}/100, Symptoms: ${t.symptoms}, Status: ${t.status}\n`;
            }
        });

        if (patients.length === 0) {
            clinicContext += "No active patients in the system right now.";
        }

        const prompt = `You are a Chief Medical Officer AI and Clinical Risk Predictor. 
Analyze the following patient data for our hospital ward. Provide an 'Evidence-Backed Decision Support Report'.
1. Identify major clinical risks or patterns (e.g. are there many burn victims, infectious cases?).
2. Recommend immediate resource allocations (e.g. 'Deploy more nurses to Trauma room').
3. Provide actionable clinical protocols to mitigate the risk of the current highest-acuity patients.

Format your response in Markdown with clear headings (## Clinical Risks, ## Resource Allocation, ## Actionable Protocols). Be concise but extremely professional and analytical.

${clinicContext}`;

        // Fetch API keys from the database
        let dbKeys: any[] = [];
        try {
            dbKeys = await prisma.apiKey.findMany();
        } catch (e) {
            console.error("[analytics] DB Error fetching API keys:", e);
        }

        const getKey = (provider: string, fallback: string | undefined) => {
            const dbKey = dbKeys.find(k => k.provider === provider)?.key;
            return dbKey ? dbKey.trim() : fallback;
        };

        const baseUrl = getKey('aicredit_url', 'https://api.aicredits.in/v1');
        const apiKey = getKey('aicredit', process.env.AICREDIT_API_KEY || '');
        
        if (!apiKey || apiKey === 'demo-key') {
             return NextResponse.json({ analysis: "## Setup Required\n\nPlease configure your AI API keys in the Settings tab to enable Evidence-Backed Decision Support." });
        }

        const client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey });

        const aiRes = await client.chat.completions.create({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3
        });

        const analysis = aiRes.choices[0]?.message?.content || "No analysis generated.";

        return NextResponse.json({ analysis });

    } catch (e: any) {
        console.error("POST /api/analytics Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
