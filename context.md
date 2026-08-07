# Neuro Bots - Yelan AI Voice Assistant

> **Hackathon Project** for the Neuro Bots Agentic AI Hackathon.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: SQLite via Prisma ORM (`@libsql/client`)
- **Voice AI**: VAPI Web SDK (`@vapi-ai/web`) — browser-based WebRTC calls
- **LLM**: Configured inside VAPI Assistant dashboard (Groq / OpenRouter)
- **Styling**: Tailwind CSS (cyberpunk sci-fi theme)

## Architecture

```
Browser (page.tsx)
  ├── 1. VAPI Cloud (Custom LLM Endpoint)
  │      └── Forwards Speech-to-Text to ngrok → /api/chat
  │
  └── 2. Local Browser Engine
         └── window.SpeechRecognition transcribes and sends to → /api/chat

Next.js Server (/api/chat) -> The "Brain"
  ├── Intercepts Chat completions from VAPI or Local Engine
  ├── Executes Database Tools (get_available_doctors, etc.) via Prisma
  └── Streams final text back to VAPI or Local Engine for TTS.
```

### How It Works (Method 2: Single Source of Truth)
1. Whether using **VAPI** or **Local Browser**, all text is sent to `/api/chat`.
2. `/api/chat` asks the LLM (Groq or Ollama) for a response.
3. If the LLM needs data, `/api/chat` intercepts the tool call, queries the SQLite DB via Prisma, and feeds the data back to the LLM.
4. The final text response is streamed back to the client.
5. The client (either VAPI's cloud TTS or the browser's local TTS) speaks the text aloud.

### How It Works (Local Browser Engine)
1. User selects **Local Browser Engine** and an LLM model (Groq or Ollama) in Settings.
2. Clicks the **Audio Uplink** button.
3. Browser uses `window.SpeechRecognition` to transcribe voice locally.
4. Transcript is sent to `/api/chat` with the selected `model`.
5. `/api/chat` routes the request to Groq Cloud or `http://127.0.0.1:11434/v1` (Ollama) depending on selection.
6. The streaming text response is accumulated and spoken using `window.speechSynthesis` (prioritizing a female voice).

## Database Schema (Prisma)
| Model       | Fields |
|-------------|--------|
| User        | id, name, phone (unique), role, projects[] |
| Doctor      | id, name, specialty, availability |
| Room        | id, roomNumber, purpose, isOccupied |
| Appointment | id, time, reason, doctorId, roomId, userId |

## Key Files
- `app/page.tsx` — Sci-fi dashboard with VAPI WebRTC voice UI
- `app/api/tools/query-db/route.ts` — VAPI Server URL Tool endpoint
- `app/api/chat/route.ts` — Text chat endpoint (used by Local Engine), routes dynamically to Groq or local Ollama.
- `app/api/auth/route.ts` — Phone-based auth (legacy, not used by current UI)
- `prisma/schema.prisma` — DB schema
- `lib/db.ts` — Prisma client singleton
- `.env.local` — API keys (VAPI, Groq, OpenRouter)

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | VAPI Web SDK auth (client-side) |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | Which VAPI assistant to call |
| `VAPI_PRIVATE_API_KEY` | Server-side VAPI auth |
| `GROQ_API_KEY` | Groq LLM (for text chat fallback) |
| `OPENROUTER_API_KEY` | OpenRouter LLM |

## Current Status
- [x] Prisma schema + SQLite DB set up
- [x] Sci-fi cyberpunk dashboard UI built
- [x] VAPI Web SDK integrated (browser voice calls)
- [x] Tool webhook (`/api/tools/query-db`) for DB lookups
- [ ] **VAPI Assistant must have a valid LLM provider configured in the VAPI dashboard** (this causes "Meeting ended due to ejection" if missing)
- [ ] ngrok tunnel needed for VAPI to reach `/api/tools/query-db` locally

## Known Issue: "Meeting ended due to ejection"
This error means VAPI started the WebRTC call but the assistant immediately terminated it. Common causes:
1. **No LLM provider configured** in the VAPI Assistant dashboard (most likely).
2. **Assistant's first message / system prompt** not set — VAPI has nothing to say.
3. **Expired API keys** inside VAPI's model config.

**Fix**: Go to https://dashboard.vapi.ai → select your assistant → ensure Model Provider (e.g., Groq, OpenAI) has a valid API key and model selected.
