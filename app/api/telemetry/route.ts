import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Realistic patient-linked telemetry with physiological modeling
const PATIENT_PROFILES = [
    { id: 'P-4A8F', name: 'John Doe', baseHR: 78, baseSpo2: 97, baseTemp: 98.4, condition: 'stable' },
    { id: 'P-9B2C', name: 'Jane Smith', baseHR: 92, baseSpo2: 94, baseTemp: 99.8, condition: 'moderate' },
    { id: 'P-3D7E', name: 'Alex Johnson', baseHR: 110, baseSpo2: 91, baseTemp: 101.2, condition: 'critical' },
];

function applyPhysiologicalNoise(base: number, range: number): number {
    // Gaussian-like noise using Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.round((base + noise * range) * 10) / 10;
}

export async function GET() {
    const patient = PATIENT_PROFILES[Math.floor(Math.random() * PATIENT_PROFILES.length)];

    const hr = Math.round(applyPhysiologicalNoise(patient.baseHR, 3));
    const spo2 = Math.min(100, Math.max(85, Math.round(applyPhysiologicalNoise(patient.baseSpo2, 1))));
    const temp = applyPhysiologicalNoise(patient.baseTemp, 0.2);
    const bpSystolic = Math.round(applyPhysiologicalNoise(patient.condition === 'critical' ? 145 : 118, 4));
    const bpDiastolic = Math.round(applyPhysiologicalNoise(patient.condition === 'critical' ? 95 : 76, 3));

    // Simulated ECG waveform snippet (5 RR intervals in mV, mimicking a real ECG array)
    const ecgWaveform = Array.from({ length: 20 }, () => Math.round((Math.random() * 1.2 - 0.3) * 100) / 100);

    const data = {
        timestamp: new Date().toISOString(),
        deviceId: 'APPLE_WATCH_S9_PRO',
        protocol: 'BLE_5.3_WSS',
        patientId: patient.id,
        patientName: patient.name,
        patientCondition: patient.condition,
        vitals: {
            heartRate: hr,
            oxygenSaturation: spo2,
            temperature: parseFloat(temp.toFixed(1)),
            bloodPressure: `${bpSystolic}/${bpDiastolic}`,
            respiratoryRate: Math.round(applyPhysiologicalNoise(patient.condition === 'critical' ? 24 : 16, 2)),
            ecgStatus: patient.condition === 'critical' ? 'ST Elevation Detected' : 'Normal Sinus Rhythm',
            ecgWaveform: ecgWaveform,
        },
        connection: 'SECURE_WSS',
        batteryLevel: Math.floor(Math.random() * 40) + 60,
    };

    return NextResponse.json(data);
}
