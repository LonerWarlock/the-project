"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    MessageSquare,
    Sparkles,
    Activity,
    Stethoscope,
    Heart,
    History,
    Plus // Added for New Chat button
} from "lucide-react";

interface ChatRecord {
    id: string;
    category: string;
    topicName: string;
    createdAt: string;
    updatedAt: string;
    messages: any[];
}

const getCategoryStyles = (category: string) => {
    switch (category?.toLowerCase()) {
        case "disease":
            return {
                bg: "bg-purple-50",
                text: "text-purple-600",
                border: "border-purple-100",
                badge: "bg-purple-100 text-purple-700 border-purple-200",
                dateText: "text-purple-500",
                dateNum: "text-purple-900",
                hoverBg: "group-hover:bg-purple-600",
                icon: <Stethoscope size={18} className="text-purple-600"/> 
            };
        case "symptom":
            return {
                bg: "bg-rose-50",
                text: "text-rose-600",
                border: "border-rose-100",
                badge: "bg-rose-100 text-rose-700 border-rose-200",
                dateText: "text-rose-500",
                dateNum: "text-rose-900",
                hoverBg: "group-hover:bg-rose-600",
                icon: <Heart size={18} className="text-rose-600" />
            };
        case "health habit":
            return {
                bg: "bg-sky-50",
                text: "text-sky-600",
                border: "border-sky-100",
                badge: "bg-sky-100 text-sky-700 border-sky-200",
                dateText: "text-sky-500",
                dateNum: "text-sky-900",
                hoverBg: "group-hover:bg-sky-600",
                icon: <Activity size={18} className="text-sky-600" />
            };
        default:
            return {
                bg: "bg-indigo-50",
                text: "text-indigo-600",
                border: "border-indigo-100",
                badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
                dateText: "text-indigo-500",
                dateNum: "text-indigo-900",
                hoverBg: "group-hover:bg-indigo-600",
                icon: <Sparkles size={18} className="text-indigo-600"/>
            };
    }
};

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

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header with Side-by-Side Action */}
                <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-indigo-900 flex items-center gap-2 tracking-tight">
                            <History size={24} /> Saved Chats
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">Your archived AI-guided consultations.</p>
                    </div>

                    {/* NEW CHAT BUTTON */}
                    <button
                        onClick={() => router.push("/chat")}
                        className="flex items-center gap-2 px-4 py-4 hover:text-indigo-700 text-white hover:bg-white bg-indigo-700 border-2 hover:border-indigo-700 rounded-xl transition-all active:scale-95 font-black uppercase text-[13px]"
                    >
                        <Plus size={14} strokeWidth={5} />
                        New Chat
                    </button>
                </header>

                <div className="grid gap-3">
                    {chats.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center shadow-sm">
                            <MessageSquare size={40} className="text-slate-200 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">No saved records</h3>
                            <button
                                onClick={() => router.push("/chat")}
                                className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-4 hover:underline"
                            >
                                Start a Consultation →
                            </button>
                        </div>
                    ) : (
                        chats.map((chat) => {
                            const styles = getCategoryStyles(chat.category);

                            return (
                                <div
                                    key={chat.id}
                                    onClick={() => router.push(`/chat/history/${chat.id}`)}
                                    className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex items-center gap-5"
                                >
                                    {/* Compact Date Block */}
                                    <div className={`flex flex-col items-center justify-center ${styles.bg} rounded-xl px-3 py-2 min-w-[80px] transition-colors`}>
                                        <span className={`text-[9px] font-black ${styles.dateText} uppercase tracking-tighter`}>
                                            {new Date(chat.updatedAt).toLocaleDateString("en-GB", {
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                        <span className={`text-xl font-black ${styles.dateNum} leading-none my-0.5`}>
                                            {new Date(chat.updatedAt).getDate()}
                                        </span>
                                        <span className={`text-[9px] font-bold ${styles.text} tabular-nums opacity-70`}>
                                            {new Date(chat.updatedAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true
                                            })}
                                        </span>
                                    </div>

                                    {/* Info Area */}
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black ${styles.text} uppercase tracking-widest`}>
                                                {chat.category}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 truncate tracking-tight">
                                            {chat.topicName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                                            {chat.updatedAt !== chat.createdAt && (
                                                <>
                                                    Created: 
                                                    <span className="text-slate-400">
                                                        {new Date(chat.createdAt).toLocaleString("en-GB", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                        }).replace(",", " •")}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Icon Area */}
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl ${styles.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                            {styles.icon}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}