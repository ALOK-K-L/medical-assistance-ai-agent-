import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        console.log('Seeding Clinic Database...');

        // 1. Create default user
        const existingUser = await prisma.user.findUnique({ where: { phone: '+1234567890' } });
        let user;
        if (!existingUser) {
            user = await prisma.user.create({
                data: {
                    name: 'John Doe',
                    phone: '+1234567890',
                    role: 'patient',
                },
            });
        } else {
            user = existingUser;
        }

        // 2. Clear existing data to allow re-seeding
        await prisma.appointment.deleteMany();
        await prisma.doctor.deleteMany();
        await prisma.room.deleteMany();

        // 3. Create Doctors
        const doctors = [
            { name: 'Dr. ALOK', specialty: 'Neurology', availability: 'Available 9AM - 5PM' },
            { name: 'Dr. SREYA', specialty: 'Cardiology', availability: 'Available 10AM - 6PM' },
            { name: 'Dr. RAM', specialty: 'General Practice', availability: 'Available 8AM - 4PM' },
            { name: 'Dr. ANITA', specialty: 'Pediatrics', availability: 'Available 9AM - 1PM' },
            { name: 'Dr. VIKRAM', specialty: 'Orthopedics', availability: 'Available 12PM - 8PM' },
            { name: 'Dr. PRIYA', specialty: 'Dermatology', availability: 'Available 10AM - 4PM' },
            { name: 'Dr. RAJESH', specialty: 'Oncology', availability: 'Available 8AM - 2PM' },
            { name: 'Dr. SNEHA', specialty: 'Psychiatry', availability: 'Available 11AM - 7PM' },
            { name: 'Dr. AMIT', specialty: 'Heart Surgeon', availability: 'Available 2PM - 10PM' },
            { name: 'Dr. KAVITA', specialty: 'Gynaecology', availability: 'Available 9AM - 3PM' },
            { name: 'Dr. SANJAY', specialty: 'Urology', availability: 'Available 10AM - 5PM' },
            { name: 'Dr. NEHA', specialty: 'Ophthalmology', availability: 'Available 9AM - 4PM' },
            { name: 'Dr. ARUN', specialty: 'ENT', availability: 'Available 11AM - 6PM' },
            { name: 'Dr. MEERA', specialty: 'Endocrinology', availability: 'Available 8AM - 1PM' },
            { name: 'Dr. KUNAL', specialty: 'Gastroenterology', availability: 'Available 1PM - 7PM' },
            { name: 'Dr. DIVYA', specialty: 'Nephrology', availability: 'Available 10AM - 2PM' },
            { name: 'Dr. RAHUL', specialty: 'Pulmonology', availability: 'Available 3PM - 9PM' },
            { name: 'Dr. POOJA', specialty: 'Rheumatology', availability: 'Available 9AM - 5PM' },
            { name: 'Dr. MANISH', specialty: 'Neurology', availability: 'Available 12PM - 6PM' },
            { name: 'Dr. SHILPA', specialty: 'Cardiology', availability: 'Available 8AM - 4PM' },
            { name: 'Dr. TARUN', specialty: 'General Surgery', availability: 'Available 10AM - 8PM' },
            { name: 'Dr. RITU', specialty: 'Plastic Surgery', availability: 'Available 11AM - 5PM' },
            { name: 'Dr. VARUN', specialty: 'Radiology', availability: 'Available 9AM - 1PM' },
            { name: 'Dr. ANJALI', specialty: 'Pathology', availability: 'Available 8AM - 3PM' },
            { name: 'Dr. SUNIL', specialty: 'Anesthesiology', availability: 'Available 2PM - 8PM' },
            { name: 'Dr. KIRAN', specialty: 'Emergency Medicine', availability: 'Available 24/7' },
            { name: 'Dr. SAMEER', specialty: 'Dentistry', availability: 'Available 10AM - 6PM' },
            { name: 'Dr. LATA', specialty: 'Physiotherapy', availability: 'Available 9AM - 4PM' },
            { name: 'Dr. ROHIT', specialty: 'Sports Medicine', availability: 'Available 3PM - 8PM' },
            { name: 'Dr. SIMRAN', specialty: 'Dietetics', availability: 'Available 11AM - 3PM' }
        ];

        for (const doc of doctors) {
            await prisma.doctor.create({ data: doc });
        }

        // 4. Create Rooms
        const rooms = [
            { roomNumber: '101A', purpose: 'General Ward', isOccupied: false, beds: 20 },
            { roomNumber: '102B', purpose: 'ICU', isOccupied: true, beds: 5 },
            { roomNumber: '205C', purpose: 'Private Room', isOccupied: false, beds: 1 },
            { roomNumber: '301A', purpose: 'Maternity Ward', isOccupied: false, beds: 15 },
            { roomNumber: '302B', purpose: 'NICU', isOccupied: true, beds: 8 },
            { roomNumber: '401', purpose: 'VIP Suite', isOccupied: false, beds: 1 },
            { roomNumber: '402', purpose: 'Isolation Ward', isOccupied: true, beds: 4 },
            { roomNumber: '501A', purpose: 'Recovery Room', isOccupied: false, beds: 10 }
        ];

        for (const room of rooms) {
            await prisma.room.create({ data: room });
        }

        // Fetch what we have now
        const allDoctors = await prisma.doctor.findMany();
        const allRooms = await prisma.room.findMany();

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully!',
            data: {
                doctors: allDoctors,
                rooms: allRooms,
                user: { id: user.id, name: user.name },
            },
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
