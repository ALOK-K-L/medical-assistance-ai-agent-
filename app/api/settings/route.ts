import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const settings = await prisma.globalSetting.findMany();
        const settingsObj = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
        
        return NextResponse.json(settingsObj);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Use Prisma transaction to upsert multiple settings at once
        const operations = Object.entries(body).map(([key, value]) => {
            if (typeof value !== 'string') return null;
            return prisma.globalSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            });
        }).filter(Boolean);

        await prisma.$transaction(operations as any);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
