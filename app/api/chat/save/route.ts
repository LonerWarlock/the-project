import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, topicName, messages } = await request.json();

    // Find or Create the Chat head
    const chat = await prisma.chat.upsert({
      where: {
        // We use a combination check to see if this user has a chat for this specific topic
        id: (await prisma.chat.findFirst({
          where: { userId: session.user.id, topicName, category }
        }))?.id || 'new-id' 
      },
      update: {
        // Clear old messages and replace with current session
        messages: {
          deleteMany: {},
          create: messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            options: m.options || []
          }))
        }
      },
      create: {
        userId: session.user.id,
        category,
        topicName,
        messages: {
          create: messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            options: m.options || []
          }))
        }
      }
    });

    return NextResponse.json({ success: true, chatId: chat.id });
  } catch (error) {
    console.error("Save Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}