"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Loader2,
    Bot,
    RotateCcw,
    Sparkles,
    ShieldCheck,
    ArrowRight,
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const ALLOWED_CATEGORIES = ["Disease", "Symptoms", "Health Habits"];

export default function NewChatPage() {


    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [followUps, setFollowUps] = useState<string[]>([]);
    const [isNamingTopic, setIsNamingTopic] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initialize Chat based on URL category
    useEffect(() => {
        if (status === "unauthenticated") router.push("/");

        // --- CATEGORY VALIDATION LOGIC ---
        if (status === "authenticated" && category) {
            if (!ALLOWED_CATEGORIES.includes(category)) {
                // Option A: Redirect back to landing page if it's a fake category
                router.replace("/chat");
                return;
            }

            if (messages.length === 0) {
                setMessages([
                    { id: "1", role: "user", content: category, timestamp: new Date() },
                    {
                        id: "2",
                        role: "assistant",
                        content: `I'd be happy to help you with ${category.toLowerCase()}. Which specific ${category.toLowerCase()} would you like to talk about today?`,
                        timestamp: new Date()
                    }
                ]);
            }
        }
    }, [status, category, messages.length, router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, followUps]);

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: textToSend.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setFollowUps([]);

        try {
            if (isNamingTopic && !overrideInput) {
                const valRes = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [{ role: "user", content: textToSend }],
                        validateOnly: true,
                        category: category
                    }),
                });
                const valData = await valRes.json();

                if (!valData.isValid) {
                    setMessages((prev) => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: `"${textToSend}" does not seem to be a valid ${category?.toLowerCase()}. Please re-enter a valid name.`,
                        timestamp: new Date(),
                    }]);
                    setLoading(false);
                    return;
                }
                setIsNamingTopic(false);
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messages.map((m) => ({ role: m.role, content: m.content })).concat({ role: "user", content: userMessage.content }),
                }),
            });

            const data = await res.json();
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
            }]);
            setFollowUps(data.followUps || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden relative">
            <div className="max-w-5xl mx-auto w-full flex flex-col h-full px-4 py-8 pb-4">

                {/* Header */}
                {/* Header */}
                <header className="flex items-center justify-between mb-4 px-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-xl shadow-indigo-200">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">Asclepius <span className="text-indigo-600">AI</span></h1>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category} Enquiry</p>
                            </div>
                        </div>
                    </div>

                    {/* NEW RESET BUTTON: Stays on page but clears state */}
                    <button
                        onClick={() => {
                            setMessages([]);
                            setFollowUps([]);
                            setIsNamingTopic(true);
                            setError(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-500 rounded-xl transition-all active:scale-95"
                    >
                        <RotateCcw size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Reset Chat</span>
                    </button>
                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-6 px-4 custom-scrollbar">
                    <div className="space-y-6 pb-4">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-4 duration-500`}>
                                {message.role === "assistant" && <div className="h-9 w-9 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm mt-1"><Bot size={18} className="text-indigo-600" /></div>}
                                <div className={`max-w-[80%] rounded-[24px] px-5 py-4 ${message.role === "user" ? "bg-indigo-600 text-white rounded-br-md shadow-lg shadow-indigo-100" : "bg-white border border-slate-100 text-slate-800 rounded-bl-md shadow-sm"}`}>
                                    <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                                </div>
                            </div>
                        ))}

                        {followUps.length > 0 && !loading && (
                            <div className="flex flex-wrap gap-2 ml-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                {followUps.map((q, i) => (
                                    <button key={i} onClick={() => handleSend(q)} className="text-xs font-bold text-indigo-600 bg-white border border-indigo-100 px-4 py-2.5 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95">{q}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    {loading && (
                        <div className="flex gap-4 justify-start animate-pulse">
                            <Bot size={18} className="text-indigo-400 ml-4" />
                            <div className="bg-slate-200 h-10 w-24 rounded-2xl" />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                {isNamingTopic && (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-2 shadow-2xl mb-4 mx-4 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2">
                        <textarea
                            ref={inputRef}
                            autoFocus
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder={`Enter ${category} name...`}
                            className="flex-1 resize-none rounded-2xl bg-transparent px-4 py-3 text-sm font-semibold outline-none leading-relaxed"
                            style={{ height: '48px', maxHeight: "150px" }}
                        />
                        <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 active:scale-90 transition-all">
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                        </button>
                    </div>
                )}

                <div className="px-6 py-2">
                    <p className="text-[12px] font-black text-center text-slate-600 uppercase tracking-tighter">
                        This chatbot does not provide medical advice. Consult a professional.
                    </p>
                </div>
            </div>
        </div>
    );
}