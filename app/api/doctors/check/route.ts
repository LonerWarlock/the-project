import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ isDoctor: false });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { email: session.user.email },
    });
    return NextResponse.json({ isDoctor: !!doctor, doctor });
  } catch (error) {
    return NextResponse.json({ isDoctor: false });
  }
}
