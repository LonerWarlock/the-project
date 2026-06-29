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
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col min-h-screen px-4 md:px-6 py-6 md:py-10">

        <div className="mb-8 md:mb-10 shrink-0 animate-in fade-in slide-in-from-top-2 duration-700">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-1 tracking-tight">
            Hello, {session?.user?.name?.split(' ')[0]}
          </h2>
          <p className="text-slate-500 text-lg font-bold">
            What do you want to talk about today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mb-8 shrink-0">
          {[
            {
              label: "Disease",
              icon: <Stethoscope size={24} />,
              color: "text-purple-600",
              bg: "bg-purple-50",
              border: "border-purple-200 hover:border-purple-500",
              desc: "Chronic care & conditions"
            },
            {
              label: "Symptom",
              icon: <Heart size={24} />,
              color: "text-rose-600",
              bg: "bg-rose-50",
              border: "border-rose-200 hover:border-rose-500",
              desc: "Acute signs & guidance"
            },
            {
              label: "Health Habit",
              icon: <Activity size={24} />,
              color: "text-sky-600",
              bg: "bg-sky-50",
              border: "border-sky-200 hover:border-sky-500",
              desc: "Wellness & routines"
            },
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategorySelect(cat.label)}
              className={`group flex flex-col p-6 text-left bg-white border-2 ${cat.border} rounded-[28px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm`}
            >
              <div className={`h-12 w-12 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                {cat.icon}
              </div>
              <div>
                <h3 className={`text-lg font-black mb-1.5 ${cat.color} tracking-tight`}>{cat.label}</h3>
                <p className="text-xs font-semibold text-slate-400 leading-snug group-hover:text-slate-600 transition-colors">
                  {cat.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="max-w-3xl shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">OR</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => router.push("/chat/history")}
              className="group flex items-center justify-between gap-6 p-2 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-indigo-600 hover:shadow-md transition-all active:scale-[0.98] w-fit mx-auto"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-[18px] bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-700 transition-all">
                  <MessageSquare size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="text-left pr-4">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest group-hover:text-indigo-700 transition-colors">View Saved Chats</span>
                </div>
              </div>
              <div className="mr-4 text-slate-400 group-hover:text-indigo-600 transition-colors">
                <ArrowRight size={18} strokeWidth={3} />
              </div>
            </button>
          </div>
        </div>

        <footer className="mt-auto pt-8 pb-4 shrink-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
            This Chatbot does not provide Medical Advice. Consult a Medical Professional for the same.
          </p>
        </footer>
      </div>
    </div>
  );
}
