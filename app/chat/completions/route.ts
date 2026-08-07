import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

export const dynamic = 'force-dynamic';

// Health check
export async function GET() {
    return new Response(
        JSON.stringify({
            status: 'ok',
            endpoint: '/chat/completions',
            provider: 'Groq',
            timestamp: new Date().toISOString(),
            hasApiKey: !!process.env.GROQ_API_KEY,
            apiKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 8) + '...',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}

export async function POST(req: Request) {
    const startTime = Date.now();
    console.log("\n========================================");
    console.log("=== /chat/completions POST REQUEST ===");
    console.log("========================================");
    console.log("Time:", new Date().toISOString());

    try {
        // Read the raw body
        const body = await req.text();
        console.log("Raw body length:", body.length);
        
        // Parse JSON
        let payload: Record<string, unknown>;
        try {
            payload = JSON.parse(body);
        } catch (parseErr) {
            console.error("JSON parse error:", parseErr);
            return new Response(
                JSON.stringify({ error: { message: "Invalid JSON", type: "invalid_request_error" } }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log("Model requested from VAPI:", payload.model);
        console.log("Stream requested from VAPI:", payload.stream);

        // Extract messages
        const messages = payload.messages as ChatCompletionMessageParam[] | undefined;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error("No messages! Payload keys:", Object.keys(payload));
            return new Response(
                JSON.stringify({ error: { message: "No messages in request", type: "invalid_request_error" } }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Message count: ${messages.length}`);
        
        // Call Groq - using their fast llama3 model
        // We only pass the exact fields Groq expects to avoid API rejections
        const cleanMessages = messages.map(m => ({
            role: m.role,
            content: m.content,
        })) as ChatCompletionMessageParam[];

        console.log("Calling Groq API with model: llama-3.1-8b-instant");
        
        const response = await openai.chat.completions.create({
            model: 'llama-3.1-8b-instant', // Fast, cheap model on Groq
            messages: cleanMessages,
            stream: true,
            temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.7,
            ...(payload.tools ? { tools: payload.tools as any } : {})
        });

        console.log(`Groq responded in ${Date.now() - startTime}ms, streaming...`);

        // Stream SSE back to VAPI
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let chunkCount = 0;
                    for await (const chunk of response) {
                        chunkCount++;
                        const data = `data: ${JSON.stringify(chunk)}\n\n`;
                        controller.enqueue(new TextEncoder().encode(data));
                    }
                    console.log(`Stream done. ${chunkCount} chunks in ${Date.now() - startTime}ms`);
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (streamErr) {
                    console.error("Mid-stream error:", streamErr);
                    // Gracefully close with an error message so VAPI doesn't hang
                    const fallback = {
                        id: `chatcmpl-error-${Date.now()}`,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: 'error',
                        choices: [{
                            index: 0,
                            delta: { content: 'I encountered a temporary error. Please try again.' },
                            finish_reason: 'stop',
                        }],
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(fallback)}\n\n`));
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });

    } catch (error: unknown) {
        const elapsed = Date.now() - startTime;
        console.error("========================================");
        console.error("=== REQUEST FAILED ===");
        console.error("========================================");
        console.error(`Failed after ${elapsed}ms`);
        
        if (error instanceof Error) {
            console.error("Message:", error.message);
            // OpenAI SDK error details
            const apiError = error as Record<string, unknown>;
            if (apiError.status) console.error("HTTP Status:", apiError.status);
            if (apiError.error) console.error("Error Body:", JSON.stringify(apiError.error));
        } else {
            console.error("Unknown error:", error);
        }

        const errMsg = error instanceof Error ? error.message : 'Unknown server error';
        return new Response(
            JSON.stringify({
                error: {
                    message: errMsg,
                    type: 'server_error',
                    code: 'internal_error',
                },
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
