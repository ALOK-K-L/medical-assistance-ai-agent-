import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("=== VAPI TOOL CALL RECEIVED ===", JSON.stringify(body, null, 2));

        // VAPI sends the tool name inside the body (varies slightly based on configuration)
        // Usually it's in body.message.toolCalls[0].function.name if it's a Server URL Tool
        const message = body.message;
        
        if (!message || message.type !== 'tool-calls') {
            return NextResponse.json({ error: "Invalid tool call request" }, { status: 400 });
        }

        let toolCall: any;
        if (message.toolWithToolCallList && message.toolWithToolCallList.length > 0) {
            toolCall = message.toolWithToolCallList[0].toolCall;
        } else if (message.toolCalls && message.toolCalls.length > 0) {
            toolCall = message.toolCalls[0];
        } else {
            return NextResponse.json({ error: "No tool calls found in request" }, { status: 400 });
        }

        const functionName = toolCall.function.name;
        
        // Parse arguments safely
        let args: any = {};
        try {
            if (toolCall.function.arguments) {
                args = typeof toolCall.function.arguments === 'string' 
                    ? JSON.parse(toolCall.function.arguments) 
                    : toolCall.function.arguments;
            }
        } catch (e) {
            console.error("Failed to parse tool arguments:", e);
        }

        let result = {};

        // Route the tool call to the correct logic
        if (functionName === 'get_user_projects') {
            const phone = args.phone;
            if (!phone) {
                result = { error: "Phone number is required to look up projects." };
            } else {
                // Query SQLite Database using Prisma
                const user = await prisma.user.findUnique({
                    where: { phone: phone },
                    include: { projects: true }
                });

                if (!user) {
                    result = { message: `No user found with phone number ${phone}.` };
                } else if (user.projects.length === 0) {
                    result = { message: `User ${user.name} has no projects registered.` };
                } else {
                    result = {
                        userName: user.name,
                        projects: user.projects.map(p => ({
                            title: p.title,
                            status: p.status,
                            description: p.description
                        }))
                    };
                }
            }
        } else if (functionName === 'get_bed_count') {
            try {
                const rooms = await prisma.room.findMany();
                const totalBeds = rooms.reduce((sum, room) => sum + room.beds, 0);
                const availableBeds = rooms.filter(room => !room.isOccupied).reduce((sum, room) => sum + room.beds, 0);
                result = { totalBeds, availableBeds };
            } catch (e: any) {
                result = { error: e.message };
            }
        } else if (functionName === 'get_available_doctors') {
            try {
                const doctors = await prisma.doctor.findMany({
                    where: {
                        availability: { contains: 'Available' }
                    }
                });
                result = { 
                    totalDoctors: doctors.length,
                    message: `Found ${doctors.length} available doctors.`,
                    doctors: doctors.map(d => ({ name: d.name, specialty: d.specialty, availability: d.availability }))
                };
            } catch (e: any) {
                result = { error: e.message };
            }
        } else if (functionName === 'get_rooms_status') {
            try {
                const rooms = await prisma.room.findMany();
                const availableRooms = rooms.filter(r => !r.isOccupied).length;
                result = {
                    totalRooms: rooms.length,
                    availableRooms: availableRooms,
                    occupiedRooms: rooms.length - availableRooms,
                    rooms: rooms.map(r => ({ roomNumber: r.roomNumber, purpose: r.purpose, isOccupied: r.isOccupied, beds: r.beds }))
                };
            } catch (e: any) {
                result = { error: e.message };
            }
        } else if (functionName === 'send_whatsapp_message') {
            try {
                const patientName = args.patientName || "Patient";
                const doctorName = args.doctorName || "Doctor";
                const appointmentDate = args.appointmentDate || "Soon";
                
                const response = await sendWhatsAppTemplateMessage(patientName, doctorName, appointmentDate);
                result = { success: true, message: "WhatsApp message sent successfully", data: response };
            } catch (e: any) {
                console.error("WhatsApp sending error:", e);
                result = { error: e.message };
            }
        } else {
            result = { error: `Unknown tool: ${functionName}` };
        }

        // Return the result to VAPI exactly as required
        return NextResponse.json({
            results: [
                {
                    toolCallId: toolCall.id,
                    result: JSON.stringify(result)
                }
            ]
        });

    } catch (error) {
        console.error("Tool execution error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
