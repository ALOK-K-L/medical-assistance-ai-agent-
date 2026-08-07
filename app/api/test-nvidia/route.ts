import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function GET() {
    const results: any = {};
    results.openrouterKeyExists = !!process.env.OPENROUTER_API_KEY;

    // Test DeepSeek V4 Flash via OpenRouter (free tier)
    try {
        const client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY!,
        });

        console.log("Testing DeepSeek V4 Flash via OpenRouter...");
        const response = await client.chat.completions.create({
            model: "deepseek/deepseek-v4-flash",
            messages: [{ role: 'user', content: 'Say hello in exactly one word.' }],
            stream: false,
            max_tokens: 50,
        });

        results.deepseekFlash = {
            success: true,
            content: response.choices[0]?.message?.content,
        };
    } catch (e: any) {
        results.deepseekFlash = {
            success: false,
            error: e.message,
            status: e.status,
        };
    }

    return new Response(JSON.stringify(results, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
