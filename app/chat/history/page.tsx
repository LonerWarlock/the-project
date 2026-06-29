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
    Plus,
    Trash2,
} from "lucide-react";
import AlertDialog from "@/components/AlertDialog";

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
                icon: <Sparkles size={18} className="text-indigo-600"/>
            };
    }
};

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    useEffect(() => { document.title = "Saved Chats | Asclepius AI"; }, []);
    const [chats, setChats] = useState<ChatRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/chat/history/${deleteId}`, { method: "DELETE" });
            if (res.ok) {
                setChats((prev) => prev.filter((c) => c.id !== deleteId));
            }
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans">
            <div className="max-w-4xl mx-auto">

                <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-indigo-900 flex items-center gap-2 tracking-tight">
                            <History size={20} /> Saved Chats
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Your archived AI-guided consultations.</p>
                    </div>

                    <button
                        onClick={() => router.push("/chat")}
                        className="flex items-center gap-2 px-5 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all active:scale-95 font-black uppercase text-xs shadow-lg"
                    >
                        <Plus size={14} strokeWidth={5} />
                        New Chat
                    </button>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chats.length === 0 ? (
                        <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center shadow-sm">
                            <MessageSquare size={40} className="text-slate-200 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">No saved records</h3>
                            <button
                                onClick={() => router.push("/chat")}
                                className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-4 hover:underline"
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
                                    className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 relative"
                                >
                                    <div onClick={() => router.push(`/chat/history/${chat.id}`)} className="flex flex-col gap-3">
                                        <div className={`flex flex-row items-center justify-between ${styles.bg} rounded-xl px-3 py-2`}>
                                            <div className="flex flex-col">
                                                <span className={`text-[9px] font-black ${styles.dateText} uppercase tracking-tighter`}>
                                                    {new Date(chat.updatedAt).toLocaleDateString("en-GB", {
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                                <span className={`text-sm md:text-lg font-black ${styles.dateNum} leading-none`}>
                                                    {new Date(chat.updatedAt).getDate()}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[9px] font-bold ${styles.text} tabular-nums opacity-70 block`}>
                                                    {new Date(chat.updatedAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true
                                                    })}
                                                </span>
                                                <span className={`text-[9px] font-bold ${styles.text} uppercase`}>
                                                    {chat.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-hidden w-full">
                                            <h3 className="text-base font-black text-slate-800 truncate tracking-tight w-full">
                                                {chat.topicName}
                                            </h3>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className={`h-8 w-8 rounded-lg ${styles.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                                    {styles.icon}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteId(chat.id);
                                        }}
                                        className="self-end p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-70 hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <AlertDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
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
