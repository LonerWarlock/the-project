import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symptoms, results } = await req.json();

  const prediction = await prisma.prediction.create({
    data: {
      userId: session.user.id,
      symptoms,
      results, // This saves the Top 3 array as JSON
    },
  });

  return NextResponse.json(prediction);
}