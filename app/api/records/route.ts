import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const patients = await prisma.patient.findMany({
            include: {
                triageRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ patients });
    } catch (e: any) {
        console.error("GET /api/records Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { patientId, details } = body;

        if (!patientId || details === undefined) {
            return NextResponse.json({ error: "patientId and details are required" }, { status: 400 });
        }

        const updatedPatient = await prisma.patient.update({
            where: { id: patientId },
            data: { details }
        });

        return NextResponse.json({ success: true, patient: updatedPatient });
    } catch (e: any) {
        console.error("POST /api/records Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
