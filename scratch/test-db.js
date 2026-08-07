const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const rooms = await prisma.room.findMany();
    const totalBeds = rooms.reduce((sum, room) => sum + room.beds, 0);
    const availableBeds = rooms.filter(room => !room.isOccupied).reduce((sum, room) => sum + room.beds, 0);
    console.log("Total Beds:", totalBeds);
    console.log("Available Beds:", availableBeds);
}

test().catch(console.error).finally(() => prisma.$disconnect());
