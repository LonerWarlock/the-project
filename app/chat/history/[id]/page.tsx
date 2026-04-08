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
  Sparkles 
} from "lucide-react";

export default function ChatDetailView() {
  const { id } = useParams(); // Get ID from URL
  const { status } = useSession();
  const router = useRouter();
  
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    const fetchAndFilter = async () => {
      try {
        // Fetch ALL chats (The "Diagnosis Report" way)
        const res = await fetch("/api/chat/history");
        const data = await res.json();
        
        // Find the specific chat locally
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
      fetchAndFilter();
    }
  }, [status, id, router]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  if (!chat) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4">
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Record Not Found</p>
      <button onClick={() => router.push("/chat/history")} className="text-indigo-600 font-bold text-xs underline">Return to History</button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full px-6 py-8">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 shrink-0">
          <button onClick={() => router.push("/chat/history")} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
            <ArrowLeft size={14} /> Back to Records
          </button>
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <Calendar size={12} />
            {new Date(chat.createdAt).toLocaleDateString("en-GB")}
          </div>
        </header>

        {/* Identity Card */}
        <div className="bg-white border border-slate-100 rounded-[40px] p-8 mb-8 shadow-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">{chat.category}</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{chat.topicName}</h2>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
             <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure Archive</span>
             </div>
             <p className="text-[10px] text-slate-300 font-bold uppercase tabular-nums tracking-widest">ID: {chat.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-10">
          {chat.messages.map((message: any) => (
            <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="h-10 w-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot size={20} className="text-indigo-600" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-[28px] px-6 py-4 ${message.role === "user" ? "bg-slate-800 text-white rounded-tr-none shadow-md" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm"}`}>
                <p className="text-base font-medium leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="py-6 border-t border-slate-100 shrink-0">
           <p className="text-[10px] font-black text-center text-slate-400 uppercase tracking-[0.2em]">Official Medical Consultation Archive</p>
        </footer>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}