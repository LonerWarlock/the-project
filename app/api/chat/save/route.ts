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

    // Find if a chat with this topic already exists for the user
    const existingChat = await prisma.chat.findFirst({
      where: { userId: session.user.id, topicName, category }
    });

    const chatData = {
      userId: session.user.id,
      category,
      topicName,
      messages: {
        create: messages.map((m: any, index: number) => ({
          role: m.role,
          content: m.content,
          options: m.options || [],
          order: index // <--- TRACK THE SEQUENCE
        }))
      }
    };

    // app/api/chat/save/route.ts

    const chat = await prisma.chat.upsert({
      where: { id: existingChat?.id || 'new-id' },
      update: {
        // FORCE UPDATE: Explicitly setting updatedAt triggers the refresh
        updatedAt: new Date(),

        // Clear old messages and replace with current ordered session
        messages: {
          deleteMany: {},
          create: chatData.messages.create
        }
      },
      create: chatData
    });

    return NextResponse.json({ success: true, chatId: chat.id });
  } catch (error) {
    console.error("Save Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}