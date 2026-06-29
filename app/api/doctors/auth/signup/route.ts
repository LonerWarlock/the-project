import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, specialization, qualification, locality, contactNumber, password } = body;

    const missing = ["name", "email", "specialization", "qualification", "locality", "contactNumber", "password"].filter(
      (f) => !body[f]
    );
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const existing = await prisma.doctor.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        specialization,
        qualification,
        locality,
        contactNumber,
        password: hashPassword(password),
      },
      select: { id: true, name: true, email: true, specialization: true, qualification: true, locality: true, contactNumber: true },
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error) {
    console.error("Doctor signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
