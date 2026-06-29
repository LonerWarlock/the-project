import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verify;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { email } });
    if (!doctor || !doctor.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!verifyPassword(password, doctor.password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.doctor.update({ where: { id: doctor.id }, data: { sessionToken: token } });

    return NextResponse.json({
      token,
      doctor: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization },
    });
  } catch (error) {
    console.error("Doctor login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
