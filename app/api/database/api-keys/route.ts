import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const keys = await prisma.apiKey.findMany();
        
        // Return a masked version of the keys for security in the frontend
        const safeKeys = keys.map(k => ({
            provider: k.provider,
            key: k.key ? `${k.key.substring(0, 8)}...` : '',
            hasKey: !!k.key
        }));

        return NextResponse.json(safeKeys);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { provider, key } = await req.json();

        if (!provider) {
            return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
        }

        if (!key) {
            // Delete the key if empty
            await prisma.apiKey.deleteMany({
                where: { provider }
            });
            return NextResponse.json({ success: true, action: 'deleted' });
        }

        // Upsert the key
        const updatedKey = await prisma.apiKey.upsert({
            where: { provider },
            update: { key },
            create: { provider, key }
        });

        return NextResponse.json({ 
            success: true, 
            provider: updatedKey.provider 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
