import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await prisma.chat.findMany({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { 
            order: 'asc' // <--- SORT BY ORDER INSTEAD OF TIMESTAMP
          }
        }
      },
      orderBy: { updatedAt: 'desc' } // Most recently active chats first
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}