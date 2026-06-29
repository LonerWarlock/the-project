import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const doctors = [
  {
    name: "Dr. Arjun Sharma",
    email: "arjun.sharma@clinic.in",
    specialization: "General Physician",
    qualification: "MBBS, MD (Internal Medicine)",
    locality: "Andheri West, Mumbai",
    contactNumber: "+91 98765 43210",
    available: true,
  },
  {
    name: "Dr. Priya Patel",
    email: "priya.patel@cardio.in",
    specialization: "Cardiologist",
    qualification: "MBBS, DM (Cardiology)",
    locality: "Koramangala, Bangalore",
    contactNumber: "+91 87654 32109",
    available: true,
  },
  {
    name: "Dr. Rohan Mehta",
    email: "rohan.mehta@neuro.in",
    specialization: "Neurologist",
    qualification: "MBBS, DM (Neurology)",
    locality: "Connaught Place, New Delhi",
    contactNumber: "+91 76543 21098",
    available: true,
  },
  {
    name: "Dr. Ananya Gupta",
    email: "ananya.gupta@derma.in",
    specialization: "Dermatologist",
    qualification: "MBBS, MD (Dermatology)",
    locality: "Banjara Hills, Hyderabad",
    contactNumber: "+91 65432 10987",
    available: true,
  },
  {
    name: "Dr. Vikram Singh",
    email: "vikram.singh@pulmo.in",
    specialization: "Pulmonologist",
    qualification: "MBBS, DM (Pulmonology)",
    locality: "Sector 18, Noida",
    contactNumber: "+91 54321 09876",
    available: true,
  },
  {
    name: "Dr. Sneha Rao",
    email: "sneha.rao@gastro.in",
    specialization: "Gastroenterologist",
    qualification: "MBBS, DM (Gastroenterology)",
    locality: "Indiranagar, Bangalore",
    contactNumber: "+91 43210 98765",
    available: true,
  },
  {
    name: "Dr. Amit Verma",
    email: "amit.verma@ortho.in",
    specialization: "Orthopedic",
    qualification: "MBBS, MS (Orthopedics)",
    locality: "Powai, Mumbai",
    contactNumber: "+91 32109 87654",
    available: true,
  },
  {
    name: "Dr. Kavita Joshi",
    email: "kavita.joshi@gen.in",
    specialization: "General Physician",
    qualification: "MBBS, MD (Family Medicine)",
    locality: "Salt Lake, Kolkata",
    contactNumber: "+91 21098 76543",
    available: true,
  },
];

async function main() {
  for (const doctor of doctors) {
    await prisma.doctor.upsert({
      where: { email: doctor.email },
      update: {},
      create: doctor,
    });
  }
  console.log(`Seeded ${doctors.length} doctors`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
