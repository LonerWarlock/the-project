import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { available: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Doctors fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}
