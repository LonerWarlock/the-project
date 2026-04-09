"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2,
  ArrowLeft,
  Bot,
  Calendar,
  ShieldCheck,
  Sparkles,
  MessageSquare
} from "lucide-react";

export default function ChatDetailView() {
  const { id } = useParams();
  const { status } = useSession();
  const router = useRouter();

  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    const fetchChat = async () => {
      try {
        const res = await fetch("/api/chat/history");
        const data = await res.json();
        const found = data.find((c: any) => c.id === id);

        if (found) {
          setChat(found);
        }
      } catch (err) {
        console.error("Error fetching chat:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchChat();
    }
  }, [status, id, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <MessageSquare size={32} />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Record Not Found</p>
        <button
          onClick={() => router.push("/chat/history")}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
        >
          Return to History
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden relative font-sans">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full px-4 py-8 pb-4">

        {/* Header - Styled like NewChatPage */}
        <header className="flex items-center justify-between mb-8 px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-xl shadow-indigo-200">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                {chat.topicName}
              </h1>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {chat.category} Archive
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">
                  {(() => {
                    const dateToDisplay = new Date(chat.updatedAt || chat.createdAt);
                    return dateToDisplay.toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }).replace(",", " •"); // Adds a subtle separator between date and time
                  })()}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/chat/history")}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-600 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </button>
          </div>
        </header>

        {/* Chat Thread - Styled exactly like NewChatPage */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-6 px-4 custom-scrollbar">
          <div className="space-y-6 pb-10">
            {chat.messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-4 duration-500`}
              >
                {message.role === "assistant" && (
                  <div className="h-9 w-9 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot size={18} className="text-indigo-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-[24px] px-5 py-4 shadow-sm ${message.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md shadow-indigo-100"
                      : "bg-white border border-slate-100 text-slate-800 rounded-bl-md"
                    }`}
                >
                  <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                  <div className={`text-[10px] font-bold uppercase mt-2 opacity-50 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    {(() => {
                    const dateToDisplay = new Date(message.createdAt);
                    return dateToDisplay.toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }).replace(",", " •"); // Adds a subtle separator between date and time
                  })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-6 pb-2 shrink-0 flex justify-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            This Chatbot does not provide Medical Advice. Consult a Medical Professional for the same.
          </p>
        </footer>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}