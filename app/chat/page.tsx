"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Heart,
  Activity,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

export default function ChatLandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleCategorySelect = (category: string) => {
    router.push(`/chat/new?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden flex flex-col selection:bg-indigo-100">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full px-6 py-8">



        {/* Simplified Hero Section */}
        <div className="mb-10 shrink-0 animate-in fade-in slide-in-from-top-2 duration-700">
          <h2 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">
            Hello, {session?.user?.name?.split(' ')[0]}
          </h2>
          <p className="text-slate-500 text-lg  font-bold">
            What do you want to talk about today?
          </p>
        </div>

        {/* Compact Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mb-8 shrink-0">
          {[
            {
              label: "Disease",
              icon: <Stethoscope size={24} />,
              color: "text-purple-600",
              bg: "bg-purple-50",
              border: "border-purple-300 hover:border-purple-600",
              desc: "Chronic care & conditions."
            },
            {
              label: "Symptom",
              icon: <Heart size={24} />,
              color: "text-rose-600",
              bg: "bg-rose-50",
              border: "border-rose-300 hover:border-rose-600",
              desc: "Acute signs & guidance."
            },
            {
              label: "Health Habit",
              icon: <Activity size={24} />,
              color: "text-sky-600",
              bg: "bg-sky-50",
              border: "border-sky-300 hover:border-sky-600",
              desc: "Wellness & routines."
            },
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategorySelect(cat.label)}
              className={`group flex flex-col p-6 text-left bg-white border-2 ${cat.border} rounded-[28px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-slate-100/50`}
            >
              <div className={`h-11 w-11 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                {cat.icon}
              </div>
              <div>
                <h3 className={`text-lg font-black mb-1.5 ${cat.color} tracking-tight`}>{cat.label}</h3>
                <p className="text-[11px] font-semibold text-slate-400 leading-snug group-hover:text-slate-600 transition-colors">
                  {cat.desc}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-300 group-hover:text-indigo-600 transition-colors">
                  
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Separator & Saved Chats Button */}
        <div className="max-w-3xl shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          <div className="flex items-center gap-3 mb-6 opacity-40">
            <div className="h-px bg-slate-600 flex-1" />
            <span className="text-[12px] font-black text-black uppercase tracking-[0.2em]">OR</span>
            <div className="h-px bg-slate-600 flex-1" />
          </div>

          {/* Centered Compact Button */}
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/chat/history")}
              className="group flex items-center justify-between gap-12 p-2 bg-indigo-600 border border-slate-200 rounded-[24px] shadow-sm hover:border-indigo-600 transition-all active:scale-[0.98] w-fit mx-auto"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-[18px] bg-indigo-600 text-slate-200 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <MessageSquare size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left pr-4">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">View Saved Chats</span>
                </div>
              </div>
              <div className="mr-4 text-slate-300  transition-colors">
                <ArrowRight size={18} strokeWidth={3} />
              </div>
            </button>
          </div>
        </div>

        {/* Minimal Fixed Footer */}
        <footer className="mt-auto pt-6 pb-2 shrink-0 border-t border-slate-100 flex justify-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            This Chatbot does not provide Medical Advice. Consult a Medical Professional for the same.
          </p>
        </footer>
      </div>
    </div>
  );
}