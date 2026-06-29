import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const appointments = await prisma.appointment.findMany({
      where: { userId: session.user.id },
      include: { doctor: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Appointments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { doctorId, patientName, patientAge, patientSex, locality, contactNumber, email, predictionData } = body;

    if (!doctorId || !patientName || !patientAge || !patientSex || !locality || !contactNumber || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        doctorId,
        patientName,
        patientAge: parseInt(patientAge),
        patientSex,
        locality,
        contactNumber,
        email,
        status: "PENDING",
        predictionData: predictionData || undefined,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Appointment create error:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
