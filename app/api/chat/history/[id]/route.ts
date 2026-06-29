import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = extractId(request);
    console.log("[DELETE chat] id:", JSON.stringify(id), "url:", request.url);

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({ where: { id } });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chat.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
