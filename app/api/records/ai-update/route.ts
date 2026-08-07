import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { currentDetails, instructions, imageBase64 } = body;

        // Fetch the AI Credit key from DB or env
        let dbKeys: any[] = [];
        try { dbKeys = await prisma.apiKey.findMany(); } catch(e){}
        const getKey = (provider: string, fallback: string | undefined) => {
            const dbKey = dbKeys.find(k => k.provider === provider)?.key;
            return dbKey ? dbKey.trim() : fallback;
        };

        const baseUrl = getKey('aicredit_url', 'https://api.aicredits.in/v1');
        const apiKey = getKey('aicredit', process.env.AICREDIT_API_KEY || 'sk-live-f21d41923f6ca090dc26915b5ac4eb1e3907b32496718dd1e7f84031e93bb03b');
        
        const client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey });

        const systemPrompt = `You are a clinical AI assistant (LifeBeat). 
Your task is to update a patient's medical record details based on the clinician's instructions or an uploaded medical report/image.
Do not output conversational text. Output ONLY the finalized, updated clinical text that will replace the patient's current details.
Preserve important historical context unless explicitly instructed to remove it.

CURRENT PATIENT DETAILS:
${currentDetails || 'None'}
`;

        let content: any[] = [];
        if (instructions) {
            content.push({ type: "text", text: `Update Instructions: ${instructions}` });
        } else if (!imageBase64) {
            content.push({ type: "text", text: "Please clean up and structure the current details." });
        }

        if (imageBase64) {
            content.push({
                type: "image_url",
                image_url: { url: imageBase64 }
            });
        }

        const response = await client.chat.completions.create({
            model: "google/gemini-2.5-flash",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content }
            ],
            temperature: 0.2
        });

        const draftText = response.choices[0]?.message?.content || "";

        return NextResponse.json({ success: true, draft: draftText });

    } catch (e: any) {
        console.error("POST /api/records/ai-update Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
