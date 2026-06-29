import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const doctor = await prisma.doctor.findFirst({
      where: { sessionToken: token },
      select: { id: true, name: true, email: true, specialization: true },
    });
    if (!doctor) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    return NextResponse.json(doctor);
  } catch (error) {
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 });
  }
}
