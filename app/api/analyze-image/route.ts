import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided." }, { status: 400 });
        }

        const dbKeys = await prisma.apiKey.findMany();
        const getKey = (provider: string, fallback: string | undefined) => {
            const dbKey = dbKeys.find(k => k.provider === provider)?.key;
            return dbKey ? dbKey.trim() : fallback;
        };

        const baseUrl = getKey('aicredit_url', 'https://api.aicredits.in/v1');
        const apiKey = getKey('aicredit', process.env.AICREDIT_API_KEY || '');

        if (!apiKey) {
            return NextResponse.json({ error: "AICredits API key not configured." }, { status: 500 });
        }

        const client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey });

        const prompt = `You are a clinical expert AI. Analyze this medical image. 
If you detect any anomalies, injuries, or specific points of clinical interest, you MUST return their bounding box coordinates.
Format your response exactly like this:
ANALYSIS: [Your clinical analysis here]
BOUNDING_BOX: [ymin, xmin, ymax, xmax] (Return coordinates between 0 and 1000. If multiple, return the most critical one. If none, do not include this line.)`;

        logAudit("IMAGE_ANALYSIS", "User requested visual saliency analysis on an uploaded image.", "UNKNOWN");

        const response = await client.chat.completions.create({
            model: "google/gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageBase64 } }
                    ]
                }
            ],
            max_tokens: 1000,
        });

        const responseText = response.choices[0]?.message?.content || "";
        
        let analysis = responseText;
        let boundingBox = null;

        const boxMatch = responseText.match(/BOUNDING_BOX:\s*\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/);
        if (boxMatch) {
            boundingBox = [
                parseInt(boxMatch[1]),
                parseInt(boxMatch[2]),
                parseInt(boxMatch[3]),
                parseInt(boxMatch[4])
            ];
            analysis = responseText.replace(/BOUNDING_BOX:.*?(\n|$)/g, '').trim();
        }

        return NextResponse.json({
            analysis,
            boundingBox
        });

    } catch (e: any) {
        console.error("X-Ray Analysis Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
