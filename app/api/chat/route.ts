import { OpenAI } from 'openai';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    return new Response(
        JSON.stringify({ status: 'ok', endpoint: '/api/chat', timestamp: new Date().toISOString() }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Extract potential patient names from a message
// ─────────────────────────────────────────────────────────────────────────────
function extractPotentialNames(text: string): string[] {
    const names: string[] = [];
    // Match capitalized words (2+ chars) that could be names
    const capitalizedWords = text.match(/\b[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?\b/g);
    if (capitalizedWords) names.push(...capitalizedWords);
    // Also try the whole text as a search term (for lowercase input like "shreya")
    const words = text.split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()));
    names.push(...words);
    return [...new Set(names)];
}

const STOP_WORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
    'was', 'one', 'our', 'out', 'has', 'his', 'how', 'its', 'may', 'new', 'now',
    'old', 'see', 'way', 'who', 'did', 'get', 'let', 'say', 'she', 'too', 'use',
    'what', 'when', 'where', 'which', 'with', 'this', 'that', 'from', 'have', 'been',
    'will', 'would', 'could', 'should', 'about', 'after', 'before', 'between',
    'patient', 'doctor', 'search', 'find', 'tell', 'show', 'give', 'name', 'named',
    'check', 'look', 'help', 'need', 'want', 'know', 'please', 'hello', 'thank',
    'analyze', 'analysis', 'triage', 'admit', 'symptoms', 'history', 'details',
    'medical', 'clinical', 'hospital', 'health', 'score', 'level', 'critical',
    'image', 'photo', 'report', 'test', 'result', 'diagnosis', 'treatment',
    'pain', 'fever', 'cough', 'cold', 'head', 'chest', 'back', 'stomach',
    'breathing', 'blood', 'pressure', 'heart', 'rate', 'pulse', 'oxygen',
    'called', 'about', 'information', 'info', 'data', 'record', 'records',
    'lifebeat', 'medgemma', 'agent', 'assistant', 'copilot', 'system',
]);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Search the database for matching patients
// ─────────────────────────────────────────────────────────────────────────────
async function searchPatientsInDB(searchTerms: string[]): Promise<any[]> {
    const allPatients: any[] = [];
    const seenIds = new Set<string>();

    for (const term of searchTerms) {
        if (term.length < 2) continue;
        try {
            const found = await prisma.patient.findMany({
                where: { name: { contains: term, mode: 'insensitive' } },
                include: {
                    triageRecords: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            });
            for (const p of found) {
                if (!seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    allPatients.push(p);
                }
            }
        } catch (e) {
            console.error(`[search] Error searching for "${term}":`, e);
        }
    }
    return allPatients;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Format patient data for context injection
// ─────────────────────────────────────────────────────────────────────────────
function formatPatientContext(patients: any[]): string {
    if (patients.length === 0) return '';

    let ctx = `\n\n─── DATABASE QUERY RESULTS ───\nThe following patient records were found in the hospital database:\n\n`;

    for (const p of patients) {
        const esiFromScore = (s: number) => s >= 90 ? 1 : s >= 70 ? 2 : s >= 40 ? 3 : s >= 20 ? 4 : 5;
        ctx += `## Patient: ${p.name}\n`;
        ctx += `- **ID**: ${p.id.substring(0, 8).toUpperCase()}\n`;
        ctx += `- **Medical Details**: ${p.details || 'No details on file'}\n`;
        ctx += `- **Registered**: ${new Date(p.createdAt).toLocaleDateString()}\n`;

        if (p.triageRecords && p.triageRecords.length > 0) {
            ctx += `- **Triage History** (${p.triageRecords.length} records):\n`;
            for (const t of p.triageRecords) {
                const esi = esiFromScore(t.criticalScore);
                ctx += `  - [${new Date(t.createdAt).toLocaleString()}] ESI Level ${esi} | Critical Score: ${t.criticalScore}/100 | Status: ${t.status}\n`;
                ctx += `    Symptoms: ${t.symptoms}\n`;
                ctx += `    AI Analysis: ${t.analysis}\n`;
            }
        } else {
            ctx += `- **Triage History**: No previous triage records.\n`;
        }
        ctx += `\n`;
    }

    ctx += `─── END DATABASE RESULTS ───\n\nPresent this data clearly to the clinician. If the clinician asked about a specific patient, focus on that patient's data.`;
    return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT SYSTEM PROMPT — LifeBeat Clinical Intelligence Agent
// ─────────────────────────────────────────────────────────────────────────────
const LIFEBEAT_SYSTEM_PROMPT = `You are **LifeBeat**, an advanced AI Clinical Intelligence Agent powering a next-generation triage decision-support system. You were built by NeuroBots for a hackathon.

## YOUR IDENTITY
- Your name is **LifeBeat**.
- You are a **clinical analyst and agentic AI assistant**.
- You are NOT a doctor. You are NOT a receptionist. You are NOT a general chatbot.
- You exist to assist trained healthcare professionals (doctors, nurses, triage officers) with instant clinical analysis, patient data retrieval, and triage recommendations.

## YOUR AGENTIC DATABASE POWERS
You have DIRECT, AUTONOMOUS ACCESS to the hospital database using your available tools. You can and should proactively use your tools to:
- Check doctor availability, room status, and bed counts.
- Send WhatsApp messages.
- Search for a specific patient's full medical record by name.
- Search the entire database for patients matching a specific medical condition or symptom (e.g. "cancer").
- Update a patient's medical record based on voice instructions.

Additionally, if a patient's name is mentioned, the system may automatically inject their records as "DATABASE QUERY RESULTS". 
When discussing patient records:
- Present the patient's full profile clearly: name, ID, medical details, registration date.
- Show their complete triage history: each visit's ESI level, critical score, symptoms, AI analysis, and status.
- Highlight any trends or concerning patterns across visits.
- If the patient is NOT found, tell the clinician the patient doesn't exist in the system yet.

## CLINICAL ANALYSIS CAPABILITIES
When analyzing symptoms, images, or clinical data:
- Provide detailed clinical reasoning with differential diagnoses.
- Suggest recommended diagnostic tests and imaging.
- Assess urgency and recommend an ESI level (1=Resuscitation, 2=Emergent, 3=Urgent, 4=Less Urgent, 5=Non-Urgent).
- Suggest a critical score (0-100) based on symptom severity.
- Recommend next steps and specialist referrals.

## BEHAVIOR RULES
- **This is a hackathon demonstration for judges.** Provide thorough, impressive clinical analysis freely.
- Do NOT refuse to analyze symptoms or images. Do NOT say "I cannot provide medical advice" or add excessive disclaimers.
- Do NOT call yourself anything other than LifeBeat. Do NOT say you are Neurobot, Yelan, MedGemma, or any other name.
- Be confident, precise, and clinically articulate.
- If a patient does NOT exist in the database, DO NOT tell the user to use a button. Use your 'admit_patient' tool to register them and log their symptoms immediately!`;

export async function POST(req: Request) {
    const startTime = Date.now();
    console.log("=== /api/chat POST REQUEST ===");

    try {
        const body = await req.text();
        let payload: Record<string, unknown>;
        try {
            payload = JSON.parse(body);
        } catch (parseErr) {
            return new Response(
                JSON.stringify({ error: { message: "Invalid JSON", type: "invalid_request_error" } }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const messages = payload.messages as ChatCompletionMessageParam[] | undefined;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: { message: "No messages in request" } }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const cleanMessages = messages.map(msg => {
            const { name, ...rest } = msg as any;
            return rest;
        }) as ChatCompletionMessageParam[];

        // ─────────────────────────────────────────────────────────────────
        // AGENTIC CONTEXT INJECTION — Search DB for patient names
        // ─────────────────────────────────────────────────────────────────
        // Get the latest user message
        const lastUserMsg = [...cleanMessages].reverse().find(m => m.role === 'user');
        let patientContext = '';

        if (lastUserMsg) {
            const msgText = typeof lastUserMsg.content === 'string'
                ? lastUserMsg.content
                : Array.isArray(lastUserMsg.content)
                    ? (lastUserMsg.content as any[]).filter(c => c.type === 'text').map(c => c.text).join(' ')
                    : '';

            if (msgText) {
                const searchTerms = extractPotentialNames(msgText);
                console.log(`[agent] Extracted search terms from message: ${searchTerms.join(', ')}`);

                if (searchTerms.length > 0) {
                    try {
                        const foundPatients = await searchPatientsInDB(searchTerms);
                        console.log(`[agent] Found ${foundPatients.length} patients in DB`);
                        patientContext = formatPatientContext(foundPatients);
                    } catch (dbErr) {
                        console.error("[agent] DB Search Error:", dbErr);
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // PROVIDER ROUTING SETUP
        // ─────────────────────────────────────────────────────────────────
        const requestedModel = typeof payload.model === 'string' ? payload.model : 'groq/llama-3.1-8b-instant';
        const isOllama = requestedModel.startsWith('ollama/');
        const isNvidia = requestedModel.startsWith('nvidia/');
        const isOpenAI = requestedModel.startsWith('openai/');
        const isAICredit = requestedModel.startsWith('aicredit/');
        const isGoogle = requestedModel.startsWith('google/');

        // ─────────────────────────────────────────────────────────────────
        // SYSTEM PROMPT — Always use LifeBeat agent prompt
        // ─────────────────────────────────────────────────────────────────
        let fullSystemPrompt = LIFEBEAT_SYSTEM_PROMPT + patientContext;
        
        if (isOllama) {
            fullSystemPrompt += `\n\nCRITICAL: You are running in LOCAL MODE and do not support JSON tools. If you need to admit a patient to the database, you MUST include this exact string format in your response: [ADMIT: patient_name | symptoms: their_symptoms].`;
        }

        // Replace or inject the system message — ALWAYS use our LifeBeat prompt
        const sysIdx = cleanMessages.findIndex(m => m.role === 'system');
        if (sysIdx >= 0) {
            cleanMessages[sysIdx] = { role: 'system', content: fullSystemPrompt };
        } else {
            cleanMessages.unshift({ role: 'system', content: fullSystemPrompt });
        }
        
        let dbKeys: any[] = [];
        try {
            dbKeys = await prisma.apiKey.findMany();
        } catch (e) {
            console.error("[chat] DB Error fetching API keys:", e);
        }

        const getKey = (provider: string, fallback: string | undefined) => {
            const dbKey = dbKeys.find(k => k.provider === provider)?.key;
            return dbKey ? dbKey.trim() : fallback;
        };

        let client: OpenAI;
        let actualModel: string;

        if (isOllama) {
            actualModel = requestedModel.replace('ollama/', '');
            client = new OpenAI({ baseURL: 'http://127.0.0.1:11434/v1', apiKey: 'ollama' });
        } else if (isNvidia) {
            const isFlash = requestedModel.includes('flash');
            actualModel = isFlash ? 'deepseek/deepseek-v4-flash' : 'deepseek/deepseek-v4-pro';
            client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: getKey('openrouter', process.env.OPENROUTER_API_KEY) });
        } else if (isAICredit) {
            actualModel = requestedModel.replace('aicredit/', ''); 
            const baseUrl = getKey('aicredit_url', 'https://api.aicredits.in/v1');
            const apiKey = getKey('aicredit', process.env.AICREDIT_API_KEY || '');
            client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey });
        } else if (isOpenAI) {
            actualModel = requestedModel.replace('openai/', '');
            client = new OpenAI({ apiKey: getKey('openai', process.env.OPENAI_API_KEY) });
        } else if (isGoogle) {
            actualModel = requestedModel; // "google/gemini-2.5-flash"
            const baseUrl = getKey('aicredit_url', 'https://api.aicredits.in/v1');
            const apiKey = getKey('aicredit', process.env.AICREDIT_API_KEY || '');
            client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey });
        } else {
            actualModel = requestedModel.replace('groq/', '');
            client = new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: getKey('groq', process.env.GROQ_API_KEY) });
        }

        console.log(`[chat] Provider routing => requested: ${requestedModel}, actual: ${actualModel}`);
        
        // ─────────────────────────────────────────────────────────────────
        // TOOL DEFINITIONS (for providers that support them)
        // ─────────────────────────────────────────────────────────────────
        const clinicTools = [
            {
                type: "function",
                function: {
                    name: "get_available_doctors",
                    description: "Get a list of all available doctors in the clinic and their specialties.",
                    parameters: { type: "object", properties: { specialty: { type: "string" } } }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_rooms_status",
                    description: "Check the status of all rooms in the clinic.",
                    parameters: { type: "object", properties: {} }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_bed_count",
                    description: "Get the total number of beds and the number of available beds in the clinic.",
                    parameters: { type: "object", properties: {} }
                }
            },
            {
                type: "function",
                function: {
                    name: "send_whatsapp_message",
                    description: "Send a WhatsApp confirmation message to the patient when they book an appointment.",
                    parameters: {
                        type: "object",
                        properties: {
                            patientName: { type: "string", description: "Name of the patient" },
                            doctorName: { type: "string", description: "Name of the doctor they are seeing" },
                            appointmentDate: { type: "string", description: "Date and time of the appointment" }
                        },
                        required: ["patientName", "doctorName", "appointmentDate"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_medical_record",
                    description: "Search the hospital database for a patient's medical record and triage history by their name.",
                    parameters: { type: "object", properties: { patientName: { type: "string" } }, required: ["patientName"] }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_patients_by_condition",
                    description: "Search all patient medical records and triage histories for a specific medical condition, symptom, or keyword (e.g., 'cancer', 'diabetes').",
                    parameters: { type: "object", properties: { condition: { type: "string" } }, required: ["condition"] }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_medical_record",
                    description: "Update a patient's active medical details in the database.",
                    parameters: { type: "object", properties: { patientId: { type: "string", description: "The UUID of the patient" }, newDetails: { type: "string", description: "The updated clinical details to save" } }, required: ["patientId", "newDetails"] }
                }
            },
            {
                type: "function",
                function: {
                    name: "admit_patient",
                    description: "Automatically register a new patient in the hospital system and log their initial symptoms for triage.",
                    parameters: {
                        type: "object",
                        properties: {
                            patientName: { type: "string", description: "The name of the new patient." },
                            medicalDetails: { type: "string", description: "Any known medical history or demographics (e.g., '12-year-old male')." },
                            symptoms: { type: "string", description: "The present symptoms or injuries." }
                        },
                        required: ["patientName", "symptoms"]
                    }
                }
            }
        ];

        // Only use tools with providers that support them
        const supportsTools = !isOllama;

        let responseStream: any;
        let initialResponse;

        try {
            initialResponse = await client.chat.completions.create({
                model: actualModel,
                messages: cleanMessages,
                stream: false,
                temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.7,
                ...(supportsTools ? { tools: clinicTools as any } : {})
            });
        } catch (toolErr: any) {
            console.error("[chat] Initial call failed with primary provider, retrying without tools:", toolErr.message);
            try {
                initialResponse = await client.chat.completions.create({
                    model: actualModel,
                    messages: cleanMessages,
                    stream: false,
                    temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.7
                });
            } catch (fallbackErr: any) {
                if (isOllama) {
                    console.error("[chat] Ollama provider failed completely. Skipping fallback per user request.", fallbackErr.message);
                    return new Response(
                        JSON.stringify({ error: { message: "Local MedGemma failed: " + fallbackErr.message } }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    );
                }

                console.error("[chat] Primary provider failed completely, falling back to AICredit Gemini:", fallbackErr.message);
                const aiCreditClient = new OpenAI({ baseURL: getKey('aicredit_url', 'https://api.aicredits.in/v1'), apiKey: getKey('aicredit', process.env.AICREDIT_API_KEY || '') });
                
                actualModel = 'google/gemini-2.5-flash'; 
                client = aiCreditClient; 
                
                initialResponse = await client.chat.completions.create({
                    model: actualModel,
                    messages: cleanMessages,
                    stream: false,
                    temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.7
                });
            }
        }

        const message = initialResponse.choices[0].message;

        // ─────────────────────────────────────────────────────────────────
        // LOCAL OLLAMA INTENT PARSER (Polyfill for Tool Calls)
        // ─────────────────────────────────────────────────────────────────
        if (isOllama && typeof message.content === 'string') {
            const admitMatch = message.content.match(/\[ADMIT:\s*(.+?)\s*\|\s*symptoms:\s*(.+?)\]/i);
            if (admitMatch) {
                if (!message.tool_calls) message.tool_calls = [];
                message.tool_calls.push({
                    id: 'call_local_' + Date.now(),
                    type: 'function',
                    function: {
                        name: 'admit_patient',
                        arguments: JSON.stringify({ patientName: admitMatch[1].trim(), symptoms: admitMatch[2].trim() })
                    }
                });
                console.log("[agent] Local MedGemma intent parsed successfully:", admitMatch[1]);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // TOOL CALL EXECUTION
        // ─────────────────────────────────────────────────────────────────
        if (message.tool_calls && message.tool_calls.length > 0) {
            cleanMessages.push(message);

            for (const toolCall of message.tool_calls) {
                const funcName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments || '{}');
                let result: any = {};

                try {
                    if (funcName === 'get_available_doctors') {
                        const whereClause = args.specialty ? { specialty: { contains: args.specialty } } : {};
                        const docs = await prisma.doctor.findMany({ where: whereClause });
                        result = { totalDoctors: docs.length, doctors: docs };
                    } else if (funcName === 'get_rooms_status') {
                        const rooms = await prisma.room.findMany();
                        const availableRooms = rooms.filter(r => !r.isOccupied).length;
                        result = { totalRooms: rooms.length, availableRooms, occupiedRooms: rooms.length - availableRooms, rooms };
                    } else if (funcName === 'get_bed_count') {
                        const rooms = await prisma.room.findMany();
                        const totalBeds = rooms.reduce((sum, room) => sum + room.beds, 0);
                        const availableBeds = rooms.filter(room => !room.isOccupied).reduce((sum, room) => sum + room.beds, 0);
                        result = { totalBeds, availableBeds };
                    } else if (funcName === 'send_whatsapp_message') {
                        const response = await sendWhatsAppTemplateMessage(
                            args.patientName || "Patient",
                            args.doctorName || "Doctor",
                            args.appointmentDate || "Soon"
                        );
                        result = { success: true, message: "WhatsApp message sent successfully", data: response };
                    } else if (funcName === 'search_medical_record') {
                        const patients = await prisma.patient.findMany({
                            where: { name: { contains: args.patientName, mode: 'insensitive' } },
                            include: { triageRecords: { orderBy: { createdAt: 'desc' }, take: 5 } }
                        });
                        if (patients.length > 0) logAudit("SEARCH_RECORD", `Agent searched for patient ${args.patientName}`, patients[0].id);
                        result = { success: true, count: patients.length, patients };
                    } else if (funcName === 'search_patients_by_condition') {
                        const patients = await prisma.patient.findMany({
                            where: {
                                OR: [
                                    { details: { contains: args.condition, mode: 'insensitive' } },
                                    { triageRecords: { some: { symptoms: { contains: args.condition, mode: 'insensitive' } } } },
                                    { triageRecords: { some: { analysis: { contains: args.condition, mode: 'insensitive' } } } }
                                ]
                            },
                            include: { triageRecords: { orderBy: { createdAt: 'desc' }, take: 1 } }
                        });
                        result = { success: true, count: patients.length, patients };
                    } else if (funcName === 'update_medical_record') {
                        const updated = await prisma.patient.update({
                            where: { id: args.patientId },
                            data: { details: args.newDetails }
                        });
                        logAudit("UPDATE_RECORD", `Agent updated medical details`, updated.id);
                        result = { success: true, message: "Medical record updated successfully.", patient: updated };
                    } else if (funcName === 'admit_patient') {
                        const newPatient = await prisma.patient.create({
                            data: {
                                name: args.patientName,
                                details: args.medicalDetails || '',
                                triageRecords: {
                                    create: {
                                        symptoms: args.symptoms,
                                        criticalScore: 50, // Default pending full AI analysis
                                        analysis: "Initial voice registration. Awaiting full clinical analysis.",
                                        status: "waiting"
                                    }
                                }
                            },
                            include: { triageRecords: true }
                        });
                        logAudit("ADMIT_PATIENT", `Agent admitted new patient: ${args.patientName}`, newPatient.id);
                        result = { success: true, message: `Patient ${args.patientName} has been successfully admitted and added to the Patient Queue.`, patient: newPatient };
                    } else {
                        result = { error: 'Unknown tool' };
                    }
                } catch (e: any) {
                    console.error(`[chat] Tool "${funcName}" error:`, e.message);
                    result = { error: e.message };
                }

                cleanMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                } as ChatCompletionMessageParam);
            }

            responseStream = await client.chat.completions.create({
                model: actualModel,
                messages: cleanMessages,
                stream: true,
                temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.7,
                ...(supportsTools ? { tools: clinicTools as any } : {})
            });
        } else {
            // No tool calls — simulate streaming
            const text = message.content || '';
            const chunks = text.match(/.{1,4}/g) || [];
            
            const simulatedStream = new ReadableStream({
                async start(controller) {
                    const id = `chatcmpl-${Date.now()}`;
                    
                    // First chunk MUST contain the role for strict OpenAI parsers like Vapi
                    const initialData = {
                        id,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: actualModel,
                        choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(initialData)}\n\n`));
                    
                    for (const chunk of chunks) {
                        const data = {
                            id,
                            object: 'chat.completion.chunk',
                            created: Math.floor(Date.now() / 1000),
                            model: actualModel,
                            choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }]
                        };
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
                        await new Promise(resolve => setTimeout(resolve, 5));
                    }
                    const endData = {
                        id,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: actualModel,
                        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(endData)}\n\n`));
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                }
            });

            return new Response(simulatedStream, {
                status: 200,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no',
                },
            });
        }

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of responseStream) {
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
                    }
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (streamErr) {
                    const fallback = {
                        id: `chatcmpl-error-${Date.now()}`,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: 'error',
                        choices: [{ index: 0, delta: { content: 'Error processing response.' }, finish_reason: 'stop' }],
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

    } catch (error: any) {
        console.error("[chat] FATAL ERROR:", error.message, error.status, error.code);
        return new Response(
            JSON.stringify({ error: { message: error.message || "Internal server error" } }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}