"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, MessageSquare, ChevronRight, Sparkles, ArrowLeft } from "lucide-react";

interface ChatRecord {
  id: string;
  category: string;
  topicName: string;
  createdAt: string;
  messages: any[]; // You can make this more specific if you like
}

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [chats, setChats] = useState<ChatRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/");

        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/chat/history");
                const data = await res.json();
                setChats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (status === "authenticated") fetchHistory();
    }, [status, router]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
            <div className="max-w-4xl mx-auto w-full px-6 py-12">

                {/* Navigation */}
                <button onClick={() => router.push("/chat")} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Health Records</h1>
                    <p className="text-slate-500 font-medium">Review your previous AI consultations and health enquiries.</p>
                </header>

                <div className="space-y-4">
                    {chats.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                            <MessageSquare size={48} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-semibold">No saved consultations found.</p>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => router.push(`/chat/history/${chat.id}`)} // Added navigation
                                className="group bg-white border border-slate-100 p-6 rounded-[32px] hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{chat.category}</span>
                                            <span className="text-slate-300">•</span>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                                <Calendar size={10} />
                                                {new Date(chat.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{chat.topicName}</h3>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}