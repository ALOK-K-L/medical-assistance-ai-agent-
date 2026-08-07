const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding dummy patients and triage records...");
    
    // Clear existing to avoid clutter (optional)
    await prisma.triageRecord.deleteMany();
    await prisma.patient.deleteMany();

    // Dummy Patients
    const p1 = await prisma.patient.create({
        data: { name: 'Ram Madhav M', details: '99 y/o, History of heart disease' }
    });
    const p2 = await prisma.patient.create({
        data: { name: 'Sreya', details: '21 y/o, No known allergies' }
    });
    const p3 = await prisma.patient.create({
        data: { name: 'John Doe', details: '45 y/o, Diabetic' }
    });
    const p4 = await prisma.patient.create({
        data: { name: 'Jane Smith', details: '32 y/o, Pregnant (3rd trimester)' }
    });
    const p5 = await prisma.patient.create({
        data: { name: 'Michael Chang', details: '28 y/o, Athlete' }
    });

    // Dummy Triage Records
    await prisma.triageRecord.create({
        data: {
            patientId: p1.id,
            criticalScore: 98,
            symptoms: 'Severe crushing chest pain radiating to left arm, shortness of breath, diaphoresis.',
            analysis: 'Patient shows classic signs of acute myocardial infarction (Heart Attack). Immediate intervention and Cath Lab activation required.',
            status: 'waiting'
        }
    });

    await prisma.triageRecord.create({
        data: {
            patientId: p3.id,
            criticalScore: 85,
            symptoms: 'Slurred speech, facial drooping on the right side, weakness in right arm. Onset 45 mins ago.',
            analysis: 'High probability of acute ischemic stroke. Fast track for CT scan and evaluation for tPA/thrombolytics.',
            status: 'waiting'
        }
    });

    await prisma.triageRecord.create({
        data: {
            patientId: p2.id,
            criticalScore: 65,
            symptoms: 'Persistent abdominal pain in lower right quadrant, slight fever (100.4F), nausea.',
            analysis: 'Symptoms are consistent with acute appendicitis. Requires urgent surgical evaluation and imaging.',
            status: 'waiting'
        }
    });

    await prisma.triageRecord.create({
        data: {
            patientId: p4.id,
            criticalScore: 40,
            symptoms: 'Mild headache and nausea. Vitals stable. BP 120/80.',
            analysis: 'Low acute risk. Symptoms likely related to pregnancy. Monitor vitals and place in standard waiting queue.',
            status: 'waiting'
        }
    });

    await prisma.triageRecord.create({
        data: {
            patientId: p5.id,
            criticalScore: 15,
            symptoms: 'Sprained right ankle during basketball. Swelling but can bear partial weight.',
            analysis: 'Non-urgent. Probable grade 1 or 2 ankle sprain. Order X-Ray to rule out fracture, provide ice and elevation.',
            status: 'waiting'
        }
    });

    console.log("Seeding complete! 5 patients added.");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
