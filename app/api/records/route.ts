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
        const { patientId, name, details } = body;

        if (!patientId || details === undefined) {
            return NextResponse.json({ error: "patientId and details are required" }, { status: 400 });
        }

        const dataToUpdate: any = { details };
        if (name !== undefined) dataToUpdate.name = name;

        const updatedPatient = await prisma.patient.update({
            where: { id: patientId },
            data: dataToUpdate
        });

        return NextResponse.json({ success: true, patient: updatedPatient });
    } catch (e: any) {
        console.error("POST /api/records Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { patientId } = body;

        if (!patientId) {
            return NextResponse.json({ error: "patientId is required" }, { status: 400 });
        }

        // Delete the patient (Prisma will cascade delete TriageRecords if configured, or we delete them first)
        // Ensure triage records are deleted first if cascade is not set up
        await prisma.triageRecord.deleteMany({
            where: { patientId }
        });

        await prisma.patient.delete({
            where: { id: patientId }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("DELETE /api/records Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
