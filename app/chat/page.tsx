"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Heart,
  Activity,
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
    // Navigate to the new chat page with the category in the URL
    router.push(`/chat/new?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden relative font-sans">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full px-4 py-8">
        
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guided Health Enquiry</p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero & Categories */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[80%] animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 mb-6">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Asclepius Intelligence</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Hello, {session?.user?.name?.split(' ')[0]}
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-md mx-auto leading-relaxed">Choose an area to explore with our AI expert.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4 max-w-4xl">
            {[
              { label: "Disease", icon: <Stethoscope size={28} />, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100 hover:border-purple-400", desc: "Enquire about specific medical conditions and care." },
              { label: "Symptoms", icon: <Heart size={28} />, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100 hover:border-rose-400", desc: "Discuss physical signs and receive guidance." },
              { label: "Health Habits", icon: <Activity size={28} />, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100 hover:border-sky-400", desc: "Explore routines, nutrition, and wellness." },
            ].map((cat) => (
              <button 
                key={cat.label} 
                onClick={() => handleCategorySelect(cat.label)} 
                className={`group relative flex flex-col p-8 text-left bg-white border ${cat.border} rounded-[40px] transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-xl `}
              >
                <div className={`h-15 w-15 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>{cat.icon}</div>
                <div className="flex-1">
                  <h3 className={`text-xl font-black mb-3 ${cat.color} tracking-tight`}>{cat.label}</h3>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed group-hover:text-slate-600">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-2">
          <p className="text-[12px] font-black text-center text-slate-600 uppercase tracking-tighter">
            This chatbot does not provide medical advice. Consult a professional.
          </p>
        </div>
      </div>
    </div>
  );
}