import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phoneNumber } = body;

        if (!phoneNumber) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        // Trigger VAPI Outbound Call
        // Note: You must set VAPI_PRIVATE_API_KEY in your .env.local
        // Note: You must also configure an Assistant ID and Phone Number ID in VAPI
        const vapiResponse = await fetch('https://api.vapi.ai/call', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VAPI_PRIVATE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                assistantId: process.env.VAPI_ASSISTANT_ID, // Ensure this is set in .env.local
                phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID, // Ensure this is set in .env.local
                customer: {
                    number: phoneNumber,
                }
            })
        });

        if (!vapiResponse.ok) {
            const errorText = await vapiResponse.text();
            console.error("VAPI Call Error:", errorText);
            return NextResponse.json({ error: "Failed to trigger call via VAPI" }, { status: 500 });
        }

        const data = await vapiResponse.json();
        return NextResponse.json({ success: true, callId: data.id });

    } catch (error) {
        console.error("Error triggering call:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
