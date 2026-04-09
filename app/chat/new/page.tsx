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
    X,
    Save,
} from "lucide-react";
import AlertDialog from "@/components/AlertDialog";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    options?: string[];
}

const ALLOWED_CATEGORIES = ["Disease", "Symptom", "Health Habit"];

export default function NewChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isNamingTopic, setIsNamingTopic] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false); // Keyboard lock state
    const [error, setError] = useState<string | null>(null);
    const [existingChatId, setExistingChatId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [saving, setSaving] = useState(false);
    const [topicName, setTopicName] = useState<string | null>(null);
    const [showExitAlert, setShowExitAlert] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        yesText: string;
        noText: string;
        action: () => void;
    } | null>(null);

    const handleSaveToCloud = async () => {
        if (messages.length < 3 || saving || !topicName) return;
        setSaving(true);
        try {
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
                localStorage.removeItem(`asclepius_chat_${category}`);
                localStorage.removeItem(`asclepius_topic_${category}`);
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

    useEffect(() => {
        if (!category) return;
        const savedChat = localStorage.getItem(`asclepius_chat_${category}`);
        const savedId = localStorage.getItem(`asclepius_active_id_${category}`);
        const savedTopic = localStorage.getItem(`asclepius_topic_${category}`);
        if (savedChat) {
            try {
                const parsed = JSON.parse(savedChat);
                const restoredMessages = parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                }));
                setMessages(restoredMessages);
                if (savedTopic) {
                    setTopicName(savedTopic);
                    setIsNamingTopic(false);
                } else if (restoredMessages.length > 2) {
                    setIsNamingTopic(false);
                }
                if (savedId) {
                    setExistingChatId(savedId);
                }
            } catch (e) {
                console.error("Failed to restore session", e);
            }
        }
    }, [category]);

    useEffect(() => {
        if (category && messages.length > 0) {
            localStorage.setItem(`asclepius_chat_${category}`, JSON.stringify(messages));
            if (topicName) {
                localStorage.setItem(`asclepius_topic_${category}`, topicName);
            }
        }
    }, [messages, category, topicName]);

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
            localStorage.removeItem(`asclepius_topic_${category}`);
            setMessages([]);
            setTopicName(null);
            setIsNamingTopic(true);
            setIsConfirming(false);
            setError(null);
        }
    };

    const handleClose = () => {
        if (category) {
            const Id = localStorage.getItem(`asclepius_active_id_${category}`);
            const hasId = Id ? true : false;
            localStorage.removeItem(`asclepius_chat_${category}`);
            localStorage.removeItem(`asclepius_topic_${category}`);
            localStorage.removeItem(`asclepius_active_id_${category}`);
            if (hasId) {
                router.push("/chat/history")
            } else {
                router.push("/chat");
            }
        }
    };

    const handleSend = async (overrideInput?: string) => {
        let textToSend = overrideInput || input;

        // Handle Disambiguation Options
        if (overrideInput === "No, let me re-type") {
            setIsConfirming(false);
            setInput("");
            return;
        }

        if (overrideInput === "Yes") {
            const lastMsg = messages[messages.length - 1].content;
            const confirmedName = lastMsg.replace("Did you mean ", "").replace("?", "");
            const formatted = confirmedName
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");

            setTopicName(formatted);
            setIsNamingTopic(false);
            setIsConfirming(false);
            textToSend = confirmedName;
        }

        if (!textToSend.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: textToSend.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => {
            const cleanedHistory = prev.map((msg): Message => ({
                ...msg,
                options: undefined
            }));

            return [...cleanedHistory, userMessage];
        });
        setInput("");
        setLoading(true);
        setError(null);

        try {
            // VALIDATION LAYER (Only if not already confirmed)
            if (isNamingTopic && overrideInput !== "Yes") {
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

                if (valData.status === "INVALID") {
                    setMessages((prev) => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: `"${textToSend}" is not recognised. Please enter a valid ${category?.toLowerCase()} name.`,
                        timestamp: new Date(),
                    }]);
                    setLoading(false);
                    return;
                }

                if (valData.status === "SUGGEST") {
                    setIsConfirming(true); // DISAPPEAR INPUT BOX
                    setMessages((prev) => [...prev, {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: `Did you mean ${valData.validatedName}?`,
                        timestamp: new Date(),
                        options: ["Yes", "No, let me re-type"]
                    }]);
                    setLoading(false);
                    return;
                }

                // Perfectly Valid
                const cleanName = valData.validatedName || textToSend;
                const formattedName = cleanName
                    .split(" ")
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(" ");

                setTopicName(formattedName);
                setIsNamingTopic(false);
            }

            // CHAT API CALL
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messages.map((m) => ({ role: m.role, content: m.content })).concat({ role: "user", content: textToSend }),
                    topicContext: topicName || textToSend // Pass context to AI
                }),
            });

            const data = await res.json();
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
                options: data.followUps || [],
            }]);
        } catch (err) {
            setError("Communication failed. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden relative font-sans">
            <div className="max-w-5xl mx-auto w-full flex flex-col h-full px-4 py-8 pb-4">

                <header className="flex items-center justify-between mb-4 px-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-xl shadow-indigo-200">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">
                                {topicName || "New Chat"}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {category} Intelligence
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {topicName && (
                            <button
                                onClick={handleSaveToCloud}
                                disabled={saving}
                                className="flex items-center gap-2 px-3 py-2 text-indigo-700 hover:text-white hover:bg-indigo-700 border-2 border-indigo-700 rounded-xl transition-all active:scale-95"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span className="text-xs font-black uppercase tracking-widest">{saving ? "Saving..." : "Save"}</span>
                            </button>
                        )}
                        {!existingChatId && (

                            <button
                                onClick={() => {
                                    if (topicName) {
                                        setAlertConfig({
                                            title: "Reset Chat?",
                                            message: "Are you sure you want to reset this chat? Your current progress will be lost.",
                                            action: handleReset,
                                            yesText: "Yes, Reset",
                                            noText: "No, Stay"
                                        });
                                    } else {
                                        handleReset();
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-white hover:bg-slate-600 border-2 border-slate-400 hover:border-slate-600 rounded-xl transition-all active:scale-95"
                            >
                                <RotateCcw size={18} />
                                <span className="text-xs font-black uppercase tracking-widest">Reset</span>
                            </button>




                        )}

                        <button
                            onClick={() => {
                                if (topicName) {
                                    setAlertConfig({
                                        title: "Close Chat?",
                                        message: "Are you sure you want to close this chat? Your current progress will be lost if it is not saved.",
                                        action: handleClose,
                                        yesText: "Yes, Close",
                                        noText: "No, Stay"
                                    });
                                } else {
                                    handleClose();
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-rose-500 hover:text-white hover:bg-rose-600 border-2 border-rose-300 hover:border-rose-600 rounded-xl transition-all active:scale-95"
                        >
                            <X size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Close</span>
                        </button>
                        <AlertDialog
                            isOpen={!!alertConfig}
                            onClose={() => setAlertConfig(null)}
                            title={alertConfig?.title || ""}
                            message={alertConfig?.message || ""}
                            yesText={alertConfig?.yesText || ""}
                            noText={alertConfig?.noText || ""}
                            onYes={() => {
                                alertConfig?.action();
                                setAlertConfig(null);
                            }}
                        />

                    </div>
                </header>

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
                            <div className="bg-white border border-slate-100 rounded-[24px] rounded-tl-md px-6 py-4 shadow-sm">
                                <div className="flex gap-1.5"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" /></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar (Disappears when confirming) */}
                {isNamingTopic && !isConfirming && (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-2 shadow-2xl mb-4 mx-4 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2">
                        <textarea
                            ref={inputRef} autoFocus value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder={`Enter ${category?.toLowerCase()} name...`}
                            className="flex-1 resize-none rounded-2xl bg-transparent px-4 py-3 text-sm font-semibold outline-none leading-relaxed"
                            style={{ height: '48px', maxHeight: "150px" }}
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