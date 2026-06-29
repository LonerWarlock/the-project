import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getDoctor(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token) {
    return prisma.doctor.findFirst({ where: { sessionToken: token } });
  }
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return prisma.doctor.findUnique({ where: { email: session.user.email } });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const doctor = await getDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Doctor appointments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}
