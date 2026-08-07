<div align="center">
  <h1>❤️ LifeBeat</h1>
  <p><strong>A Production-Ready Multimodal Clinical Intelligence System</strong></p>
  <p><i>Winner / Submission - Clinical Intelligence AI Hackathon</i></p>
</div>

<br/>

**LifeBeat** is a scalable, AI-powered clinical intelligence platform engineered to assist healthcare professionals in Emergency Departments, Rural Clinics, and Disaster Relief Camps. By fusing multimodal data streams—including voice, medical imaging, text, and IoT wearables—LifeBeat delivers real-time patient triage, disease probability estimation, and evidence-backed decision support.

## 🚀 Key Features

### 🎙️ Multimodal Data Fusion (Voice First)
Powered by the **Vapi Voice AI Engine**, doctors can converse hands-free to admit patients. The system extracts NLP symptoms, correlates disease pathways, and automatically integrates them into the PostgreSQL/SQLite Electronic Health Record (EHR).

### 🩻 Explainable Visual Saliency
The built-in **X-Ray Analyzer** leverages Google's **Gemini 2.5 Flash Vision Model** to detect clinical anomalies. Crucially, it fulfills the Explainable AI requirement by extracting mathematical bounding box coordinates to render precise, glowing **Heatmap overlays** on the specific pixels driving the clinical diagnosis.

### ⌚ Live Wearable IoT Telemetry
The **Patient Queue Dashboard** dynamically streams live, fluctuating vital signs from a custom biomedical REST API. The telemetry includes patient-linked profiles, Box-Muller Gaussian noise modeling, ECG waveforms, and BLE protocol metadata, representing a true-to-life integration for high-frequency health sensors.

### 💊 Clinical Drug Interaction Engine
The reasoning layer includes a multi-agent tool execution pipeline. Doctors can query the AI to check for dangerous drug-drug interactions (e.g., Warfarin + Aspirin, SSRIs + Tramadol), acting as an active clinical safeguard before prescribing medications.

### 🛡️ Privacy, Edge AI & HIPAA Compliance
- **MedGemma Local Edge Processing:** For military units or rural clinics lacking secure cloud access, LifeBeat features a toggleable **Local AI Mode**. It routes all intelligence through an offline, locally hosted `medgemma:4b` model (via Ollama), guaranteeing zero-latency privacy.
- **Enterprise Audit Logging:** A background Node.js engine strictly tracks and records every AI interaction, image analysis, and patient admission into a secure `hipaa-audit.log` file, implementing PHI-masked audit trails for complete regulatory compliance.

### ⚖️ Dynamic Triage Queue
The AI automatically calculates a unified **Emergency Severity Index (ESI) Level (1-5)** and a 0-100 Critical Score, actively reprioritizing the dashboard queue to ensure high-risk patients are seen immediately.

---

## 🛠️ Technology Stack & Architecture

- **Frontend Architecture:** Next.js 16 (App Router), React, Tailwind CSS, Lucide Icons
- **Backend Infrastructure:** Next.js Serverless API Routes, Node.js
- **Database Layer:** Prisma ORM (SQLite / PostgreSQL ready)
- **Cloud Foundation Models:** Google Gemini 2.5 Flash (Vision & Clinical Logic)
- **Edge / Local AI Models:** MedGemma:4b (via Ollama)
- **Voice Intelligence:** Vapi Assistant API
- **Data Integration:** RESTful IoT Telemetry Simulation, Local Filesystem Auditing

> **Note:** Comprehensive API Documentation and Architecture Diagrams are fully integrated into the platform UI. Check the `/api-docs` and `/architecture` routes upon starting the server!

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- Database (SQLite configured by default)
- API Keys: Google Gemini (or AICredits), Vapi

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ALOK-K-L/medical-assistance-ai-agent-.git
   cd medical-assistance-ai-agent-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file and add your credentials:
   ```env
   VAPI_PUBLIC_KEY="your_vapi_public_key"
   AICREDIT_API_KEY="your_api_key_here"
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma db push
   node seed.js
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the dashboard!

---

## 🏥 Deployment Ecosystems
LifeBeat is mathematically designed to be deployed across highly variable environments:
1. **Emergency Departments:** Using the Cloud Architecture for high-speed, parallel processing of hundreds of patients.
2. **Disaster Relief Camps & Military Units:** Using the MedGemma Edge mode for offline, private reasoning on ruggedized local hardware.

---

<div align="center">
  <p>Engineered for the Future of Medical AI.</p>
</div>
