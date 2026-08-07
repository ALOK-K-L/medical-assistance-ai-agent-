import { NextResponse } from 'next/server';
import { sendWhatsAppTextMessage, sendWhatsAppTrueTemplateMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, type } = body;

        let response;
        if (type === 'template') {
            response = await sendWhatsAppTrueTemplateMessage('hello_world');
        } else {
            if (!message) {
                return NextResponse.json({ error: "Message is required for text type" }, { status: 400 });
            }
            response = await sendWhatsAppTextMessage(message);
        }

        return NextResponse.json({ success: true, data: response });
    } catch (error: any) {
        console.error("WhatsApp Simulation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
