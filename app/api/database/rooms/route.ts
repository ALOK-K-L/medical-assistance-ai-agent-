import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: { roomNumber: 'asc' }
        });
        return NextResponse.json({ success: true, data: rooms });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { roomNumber, purpose, isOccupied, beds } = body;
        
        if (!roomNumber || !purpose || beds === undefined) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const room = await prisma.room.create({
            data: { 
                roomNumber, 
                purpose, 
                isOccupied: isOccupied === true || isOccupied === 'true', 
                beds: parseInt(beds) 
            }
        });

        return NextResponse.json({ success: true, data: room });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 });
        }

        await prisma.room.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Room deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
