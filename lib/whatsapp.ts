/**
 * WhatsApp Cloud API Integration
 * Sends messages via the Meta Graph API (WhatsApp Business)
 */

// Send a plain text WhatsApp message (works instantly with verified test numbers)
export async function sendWhatsAppTextMessage(
    message: string,
    toNumber?: string
) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const defaultTo = process.env.WHATSAPP_DEFAULT_TO_NUMBER;

    if (!token || !phoneId) {
        throw new Error("WhatsApp credentials are not configured in environment variables.");
    }

    const recipient = toNumber || defaultTo;

    if (!recipient) {
        throw new Error("No recipient phone number provided.");
    }

    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
            preview_url: false,
            body: message
        }
    };

    console.log("[WhatsApp] Sending message to:", recipient);
    console.log("[WhatsApp] Message:", message);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("[WhatsApp] API Error:", JSON.stringify(data, null, 2));
        throw new Error(`WhatsApp API failed: ${data?.error?.message || response.statusText}`);
    }

    console.log("[WhatsApp] Message sent successfully:", JSON.stringify(data));
    return data;
}

// Convenience wrapper: builds a nice appointment confirmation message
export async function sendWhatsAppTemplateMessage(
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    toNumber?: string
) {
    const message = `🏥 *NeuroBots Clinic - Appointment Confirmation*\n\nHello ${patientName}!\n\nYour appointment has been confirmed:\n👨‍⚕️ *Doctor:* ${doctorName}\n📅 *Date:* ${appointmentDate}\n\nPlease arrive 15 minutes early. Reply to this message if you need to reschedule.\n\nThank you for choosing NeuroBots Clinic! 🤖`;
    
    return sendWhatsAppTextMessage(message, toNumber);
}

// Sends a true Meta WhatsApp Template (e.g., hello_world)
export async function sendWhatsAppTrueTemplateMessage(
    templateName: string = 'hello_world',
    toNumber?: string
) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const defaultTo = process.env.WHATSAPP_DEFAULT_TO_NUMBER;

    if (!token || !phoneId) {
        throw new Error("WhatsApp credentials are not configured in environment variables.");
    }

    const recipient = toNumber || defaultTo;

    if (!recipient) {
        throw new Error("No recipient phone number provided.");
    }

    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en_US" }
        }
    };

    console.log(`[WhatsApp] Sending template '${templateName}' to:`, recipient);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("[WhatsApp] API Error:", JSON.stringify(data, null, 2));
        throw new Error(`WhatsApp API failed: ${data?.error?.message || response.statusText}`);
    }

    console.log("[WhatsApp] Template sent successfully:", JSON.stringify(data));
    return data;
}
