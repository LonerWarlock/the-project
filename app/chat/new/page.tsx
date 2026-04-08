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
    Save,
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    options?: string[]; // Only stored in the latest assistant message
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
    const [isNamingTopic, setIsNamingTopic] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [saving, setSaving] = useState(false);

    const handleSaveToCloud = async () => {
        if (messages.length < 3 || saving) return;
        setSaving(true);

        try {
            const topicName = messages[2]?.content;

            const res = await fetch("/api/chat/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    topicName,
                    messages: messages
                }),
            });

            if (res.ok) {
                // 1. DELETE FROM LOCAL STORAGE
                localStorage.removeItem(`asclepius_chat_${category}`);
                router.push("/chat/history");
            } else {
                throw new Error("Failed to save");
            }
        } catch (err) {
            alert("Could not save chat. Try again later.");
        } finally {
            setSaving(false);
        }
    };

    // 1. PERSISTENCE: Load from LocalStorage on mount
    useEffect(() => {
        if (!category) return;

        const savedChat = localStorage.getItem(`asclepius_chat_${category}`);
        if (savedChat) {
            try {
                const parsed = JSON.parse(savedChat);
                const restoredMessages = parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                }));

                setMessages(restoredMessages);

                // If chat has more than 2 messages, user already named the topic
                if (restoredMessages.length > 2) {
                    setIsNamingTopic(false);
                }
            } catch (e) {
                console.error("Failed to parse local chat", e);
            }
        }
    }, [category]);

    // 2. PERSISTENCE: Save to LocalStorage whenever messages update
    useEffect(() => {
        if (category && messages.length > 0) {
            localStorage.setItem(`asclepius_chat_${category}`, JSON.stringify(messages));
        }
    }, [messages, category]);

    // 3. INITIALIZATION & GUARD: Run if no local storage exists
    useEffect(() => {
        if (status === "unauthenticated") router.push("/");

        if (status === "authenticated" && category) {
            if (!ALLOWED_CATEGORIES.includes(category)) {
                router.replace("/chat");
                return;
            }

            const hasLocalData = localStorage.getItem(`asclepius_chat_${category}`);

            if (messages.length === 0 && !hasLocalData) {
                setMessages([
                    { id: "1", role: "user", content: category, timestamp: new Date() },
                    {
                        id: "2",
                        role: "assistant",
                        content: `I'd be happy to help you with ${category.toLowerCase()}. Which specific ${category.toLowerCase()} would you like to talk about today?`,
                        timestamp: new Date(),
                        options: []
                    }
                ]);
            }
        }
    }, [status, category, messages.length, router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleReset = () => {
        if (category) {
            localStorage.removeItem(`asclepius_chat_${category}`);
            setMessages([]);
            setIsNamingTopic(true);
            setError(null);
        }
    };

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: textToSend.trim(),
            timestamp: new Date(),
        };

        // Strip options from all previous messages to keep storage clean
        // Strip options from all previous messages to keep storage clean
        setMessages((prev) =>
            prev.map((msg): Message => ({
                ...msg,
                options: undefined
            })).concat(userMessage)
        );

        setInput("");
        setLoading(true);
        setError(null);

        try {
            // VALIDATION LAYER
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
                        content: `"${textToSend}" is not recognised as a valid ${category?.toLowerCase()}. Please re-enter a valid name.`,
                        timestamp: new Date(),
                    }]);
                    setLoading(false);
                    return;
                }
                setIsNamingTopic(false);
            }

            // CHAT API CALL
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messages.map((m) => ({ role: m.role, content: m.content })).concat({ role: "user", content: userMessage.content }),
                }),
            });

            const data = await res.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
                options: data.followUps || [],
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            setError("Communication failed. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden relative font-sans">
            <div className="max-w-5xl mx-auto w-full flex flex-col h-full px-4 py-8 pb-4">

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

                    <div className="flex items-center gap-2">
                        {messages.length >= 3 && (
                            <button
                                onClick={handleSaveToCloud}
                                disabled={saving}
                                className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? "Saving..." : "Save to Cloud"}
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-500 rounded-xl transition-all active:scale-95"
                        >
                            <RotateCcw size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Reset Chat</span>
                        </button>
                    </div>
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

                        {/* Follow-ups from only the latest assistant message */}
                        {messages.length > 0 &&
                            messages[messages.length - 1].role === "assistant" &&
                            messages[messages.length - 1].options &&
                            !loading && (
                                <div className="flex flex-wrap gap-2 ml-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                    {messages[messages.length - 1].options!.map((q, i) => (
                                        <button key={i} onClick={() => handleSend(q)} className="text-xs font-bold text-indigo-600 bg-white border border-indigo-100 px-4 py-2.5 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95">{q}</button>
                                    ))}
                                </div>
                            )}
                    </div>
                    {loading && (
                        <div className="flex gap-4 justify-start">
                            <div className="h-9 w-9 rounded-xl bg-white border border-indigo-50 flex items-center justify-center shrink-0"><Bot size={18} className="text-indigo-400" /></div>
                            <div className="bg-white border border-slate-100 rounded-[24px] rounded-tl-md px-6 py-4 shadow-sm"><div className="flex gap-1.5"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" /></div></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Centered Input Bar */}
                {isNamingTopic && (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-2 shadow-2xl mb-4 mx-4 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2">
                        <textarea
                            ref={inputRef} autoFocus value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder={`Enter ${category?.toLowerCase()} name...`}
                            className="flex-1 resize-none rounded-2xl bg-transparent px-4 py-3 text-sm font-semibold outline-none leading-relaxed"
                            style={{ height: '48px', maxHeight: "150px" }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                        />
                        <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 active:scale-90 transition-all">
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                        </button>
                    </div>
                )}

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