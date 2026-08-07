import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const doctors = await prisma.doctor.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ success: true, data: doctors });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, specialty, availability } = body;
        
        if (!name || !specialty || !availability) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const doctor = await prisma.doctor.create({
            data: { name, specialty, availability }
        });

        return NextResponse.json({ success: true, data: doctor });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "Doctor ID is required" }, { status: 400 });
        }

        await prisma.doctor.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Doctor deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
