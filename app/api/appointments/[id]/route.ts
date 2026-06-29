import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getDoctor(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token && token.length > 10) {
    return prisma.doctor.findFirst({ where: { sessionToken: token } });
  }
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return prisma.doctor.findUnique({ where: { email: session.user.email } });
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctor = await getDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: "Only doctors can update appointment status" }, { status: 403 });
    }

    const body = await request.json();
    const { status, scheduledDate, rejectionReason } = body;

    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appointment.doctorId !== doctor.id) {
      return NextResponse.json({ error: "Not your appointment" }, { status: 403 });
    }

    const data: Record<string, any> = { status };
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
    if (rejectionReason) data.rejectionReason = rejectionReason;

    const updated = await prisma.appointment.update({
      where: { id },
      data,
      include: { doctor: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Appointment update error:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Not your appointment" }, { status: 403 });
    }
    if (appointment.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending appointments can be cancelled" }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { doctor: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Appointment cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
