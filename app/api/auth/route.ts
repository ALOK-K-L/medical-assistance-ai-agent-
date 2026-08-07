import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, phone, action } = body;

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        if (action === 'signup') {
            if (!name) {
                return NextResponse.json({ error: "Name is required for signup" }, { status: 400 });
            }

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({ where: { phone } });
            if (existingUser) {
                return NextResponse.json({ error: "Phone number already registered. Please login." }, { status: 400 });
            }

            // Create new user with a default project for the hackathon
            const newUser = await prisma.user.create({
                data: {
                    name,
                    phone,
                    projects: {
                        create: [
                            {
                                title: `${name}'s Agentic AI Project`,
                                description: 'Developing a voice-enabled AI framework for the Neuro Bots Hackathon.',
                                status: 'building'
                            }
                        ]
                    }
                },
                include: { projects: true }
            });

            return NextResponse.json({ success: true, user: newUser });
        } 
        
        else if (action === 'login') {
            // Find existing user
            const user = await prisma.user.findUnique({
                where: { phone },
                include: { projects: true }
            });

            if (!user) {
                return NextResponse.json({ error: "User not found. Please sign up first." }, { status: 404 });
            }

            return NextResponse.json({ success: true, user });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
