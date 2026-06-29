"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Loader2, 
  ArrowLeft, 
  Bot,
  ShieldCheck, 
  Sparkles,
  MessageSquare,
  MessageCircle,
  Trash2,
} from "lucide-react";
import AlertDialog from "@/components/AlertDialog";

export default function ChatDetailView() {
  const { id } = useParams();
  const { status } = useSession();
  const router = useRouter();
  
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleResumeChat = () => {
    if (!chat) return;

    localStorage.setItem(`asclepius_chat_${chat.category}`, JSON.stringify(chat.messages));
    localStorage.setItem(`asclepius_topic_${chat.category}`, chat.topicName);
    localStorage.setItem(`asclepius_active_id_${chat.category}`, chat.id);
    router.push(`/chat/new?category=${chat.category}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/chat/history");
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4 bg-slate-50 p-4">
        <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
           <MessageSquare size={28} />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Record Not Found</p>
        <button 
          onClick={() => router.push("/chat/history")} 
          className="bg-indigo-600 text-white px-5 md:px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg"
        >
          Return to History
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto w-full flex flex-col min-h-screen px-3 md:px-4 py-4 md:py-6">
        
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 md:mb-8 px-2 md:px-4 shrink-0 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3 md:gap-4 w-full">
            <div className="h-10 md:h-12 w-10 md:w-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight truncate">
                {chat.topicName}
              </h1>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-emerald-500" />
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                  {chat.category} Archive
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">
                    <>Last Updated:  </>
                    {new Date(chat.updatedAt || chat.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    }).replace(",", " •")}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteAlert(true)}
              className="flex items-center gap-2 px-3 py-2.5 text-red-500 hover:text-white hover:bg-red-600 border-2 border-red-200 hover:border-red-600 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              <Trash2 size={14} />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Delete</span>
            </button>
            <button
              onClick={() => router.push("/chat/history")}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-white border-2 border-slate-200 hover:border-indigo-200 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft size={14} />
              <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto mb-4 space-y-6 px-2 md:px-4">
          <div className="space-y-6 pb-10">
            {chat.messages.map((message: any) => (
              <div 
                key={message.id} 
                className={`flex gap-2 md:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-4 duration-500`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 md:h-9 w-8 md:w-9 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot size={16} className="text-indigo-600" />
                  </div>
                )}
                <div 
                  className={`max-w-[75%] md:max-w-[80%] rounded-[20px] md:rounded-[24px] px-4 md:px-5 py-3 md:py-4 shadow-sm ${
                    message.role === "user" 
                      ? "bg-indigo-600 text-white rounded-br-md" 
                      : "bg-white border border-slate-100 text-slate-800 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-4 shrink-0 flex flex-col items-center gap-4">
            <button
                onClick={handleResumeChat}
                className="group flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
            >
                <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
                Resume Chat
            </button>
        </div>

        <footer className="mt-auto pt-6 pb-2 shrink-0 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
            This Chatbot does not provide Medical Advice. Consult a Medical Professional for the same.
          </p>
        </footer>
      </div>

      <AlertDialog
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        title="Delete Chat?"
        message="This will permanently delete this chat and all its messages. This action cannot be undone."
        yesText={deleting ? "Deleting..." : "Delete"}
        noText="Cancel"
        yesColor="rose"
        onYes={handleDelete}
      />
    </div>
  );
}
