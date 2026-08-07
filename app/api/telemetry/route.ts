import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Simulate real-time IoT Telemetry for a wearable device (e.g. Apple Watch)
    // We generate random fluctuations around a healthy baseline to simulate a live stream.
    
    const hr = Math.floor(Math.random() * (95 - 65 + 1)) + 65; // 65-95 BPM
    const spo2 = Math.floor(Math.random() * (100 - 95 + 1)) + 95; // 95-100%
    const temp = (Math.random() * (99.1 - 97.5) + 97.5).toFixed(1); // 97.5-99.1 F
    const bpSystolic = Math.floor(Math.random() * (125 - 110 + 1)) + 110;
    const bpDiastolic = Math.floor(Math.random() * (85 - 70 + 1)) + 70;

    const data = {
        timestamp: new Date().toISOString(),
        deviceId: 'APPLE_WATCH_S9_PRO',
        vitals: {
            heartRate: hr,
            oxygenSaturation: spo2,
            temperature: parseFloat(temp),
            bloodPressure: `${bpSystolic}/${bpDiastolic}`,
            ecgStatus: 'Normal Sinus Rhythm'
        },
        connection: 'SECURE_WSS'
    };

    return NextResponse.json(data);
}
