"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Activity, Brain, Microscope, ShieldCheck, LogOut } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-white font-sans text-slate-900">
        {/* Dynamic Background elements */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-50/40 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-50/40 blur-[120px]" />

        <main className="relative z-10 flex h-full w-full flex-col items-center justify-between px-8 py-10 text-center">

          {/* Core Hero Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex w-full max-w-4xl flex-col items-center space-y-[4vh]"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">
              <ShieldCheck size={12} /> Secure Multi-Modal Analysis
            </div>
            
            <h1 className="text-5xl font-black tracking-tighter text-indigo-950 sm:text-7xl md:text-8xl leading-[0.95]">
              Intelligence <br />
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">Meets Care.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-slate-500 sm:text-lg">
              Seamlessly analyze 42 systemic diseases and 25 dermal conditions. 
              Real-time clinical insights powered by Google Gemini.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-2">
              <Link
                href="/models"
                className="flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-12 text-lg font-bold text-white shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
              >
                Launch Engines
              </Link>
              <Link
                href="/history"
                className="flex h-14 items-center justify-center rounded-2xl border-2 border-slate-100 bg-white px-10 text-lg font-bold text-slate-500 transition-all hover:bg-slate-50"
              >
                Review Records
              </Link>
            </div>
          </motion.div>

          {/* Engine Cards (Dynamic Scaling) */}
          <div className="grid w-full max-w-5xl grid-cols-3 gap-6">
            {[
              { label: "Neural Engine", desc: "42+ Systemic Types", icon: <Activity size={24} />, color: "text-amber-500" },
              { label: "Dermal Vision", desc: "25+ Skin Classes", icon: <Microscope size={24} />, color: "text-emerald-500" },
              { label: "Advanced Logic", desc: "Gemini 1.5 Analysis", icon: <Brain size={24} />, color: "text-indigo-500" }
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center rounded-[2rem] border border-slate-50 bg-slate-50/30 p-6 backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100"
              >
                <div className={`mb-3 ${card.color}`}>{card.icon}</div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-950 mb-1">{card.label}</p>
                <p className="text-[10px] font-bold text-slate-400">{card.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
            Core2Cover Terminal / 2026 Edition
          </p>
        </main>
      </div>
    );
  }

  // Login Screen (remains the same for consistency)
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[3rem] bg-white p-12 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-white"
      >
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-200">
          <Activity size={32} className="text-white" />
        </div>
        <h2 className="mb-3 text-3xl font-black tracking-tight text-indigo-950">System Entry</h2>
        <p className="mb-10 text-sm font-medium leading-relaxed text-slate-400">
          Access the professional multi-modal diagnostic suite. Please authenticate via Google.
        </p>
        
        <button
          onClick={() => signIn("google")}
          className="flex w-full items-center justify-center gap-4 rounded-2xl border-2 border-slate-100 bg-white py-4 font-black text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}