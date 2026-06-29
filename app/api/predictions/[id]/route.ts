import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

function extractId(request: NextRequest, paramsId?: string): string {
  if (paramsId && paramsId !== "1") return paramsId;
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  return segments[segments.length - 1] || "";
}

export async function DELETE(
  request: NextRequest,
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = extractId(request);
    console.log("[DELETE prediction] id:", JSON.stringify(id), "url:", request.url);

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prediction = await prisma.prediction.findUnique({ where: { id } });
    if (!prediction) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }
    if (prediction.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.prediction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete prediction error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
