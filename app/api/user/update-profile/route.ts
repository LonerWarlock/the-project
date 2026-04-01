import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
      hasCompletedProfile: true,
    },
  });

  return NextResponse.json({ success: true });
}