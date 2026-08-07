// Quick test: send a WhatsApp text message directly
const token = "EAAL71jJPZBDoBSKimGahXOLXRHEatiOEsZB9noyu8UU7EdZBZB02KCzKTHZAmQGzc62dZACO3IBXAQqRmmFiNKAv6U4i6ZALV8FQUtHR33Xf6ZBNldn4qYiC6XpDReHa9SbceZAVZB3P12Ho8tfgK2xvQHkaiUBtUv6IKIpjSwkorJWPzG1yx2Isl3Bi4wIxmHGSIjaZCokbyj4YRjyoFgyA3ZCZApmOBrdZCZADZA4Ww7w135VZCkNKLk05IFA1EMlehzIU5yg725yiIZAyiTfg7jr7xuPQyPIqOZAB6MYgjEUPFAvUWMZD";
const phoneId = "1244594752068589";
const to = "918075185774";

async function testWhatsApp() {
    const url = `https://graph.facebook.com/v25.0/${phoneId}/messages`;
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
            preview_url: false,
            body: "🏥 *NeuroBots Clinic - Test Message*\n\nThis is a test from NeuroBots AI! If you receive this, WhatsApp integration is working. 🤖"
        }
    };

    console.log("Sending WhatsApp message to:", to);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
}

testWhatsApp();
