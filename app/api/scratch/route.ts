import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    const keys = await prisma.apiKey.findMany();
    return NextResponse.json(keys);
}
