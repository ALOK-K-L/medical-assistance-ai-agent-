const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

const libsql = createClient({ url: 'file:./dev.db' });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Clinic Database...');

  // 1. Create default user
  const user = await prisma.user.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      name: 'John Doe',
      phone: '+1234567890',
      role: 'patient',
    },
  });

  // 2. Create Doctors
  const doctors = [
    { name: 'Dr. Sarah Connor', specialty: 'Cardiology', availability: 'Available' },
    { name: 'Dr. Gregory House', specialty: 'Diagnostics', availability: 'In Surgery' },
    { name: 'Dr. Stephen Strange', specialty: 'Neurology', availability: 'Available' },
  ];

  for (const doc of doctors) {
    await prisma.doctor.create({
      data: doc,
    });
  }

  // 3. Create Rooms
  const rooms = [
    { roomNumber: '101A', purpose: 'Consultation', isOccupied: false },
    { roomNumber: '102B', purpose: 'Surgery', isOccupied: true },
    { roomNumber: '205C', purpose: 'MRI', isOccupied: false },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: room,
    });
  }

  console.log('Seeding complete! Added Doctors and Rooms.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
