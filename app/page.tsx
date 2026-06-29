"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Activity, Brain, Microscope, ShieldCheck, LogOut } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white font-sans text-slate-900">
      <div className="absolute -top-40 -right-40 h-[400px] md:h-[600px] w-[400px] md:w-[600px] rounded-full bg-indigo-50/40 blur-[80px] md:blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[400px] md:h-[600px] w-[400px] md:w-[600px] rounded-full bg-emerald-50/40 blur-[80px] md:blur-[120px]" />

      <main className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4 md:px-8 py-8 md:py-10 text-center gap-12 md:gap-16">

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex w-full max-w-4xl flex-col items-center space-y-6 md:space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">
            <ShieldCheck size={12} /> Secure Multi-Modal Analysis
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-indigo-950 leading-[0.95]">
            Intelligence <br />
            <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">Meets Care.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-slate-500 sm:text-lg">
            Seamlessly analyze 42 systemic diseases and 25 dermal conditions.
            Real-time clinical insights powered by Google Gemini.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-2">
            {session ? (
              <>
                <Link
                  href="/models"
                  className="flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-12 text-lg font-bold text-white shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
                >
                  Launch Engines
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 px-8 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 active:scale-95"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="flex h-14 items-center justify-center gap-4 rounded-2xl border-2 border-indigo-600 px-12 text-lg font-bold text-indigo-600 shadow-xl shadow-slate-100 transition-all hover:bg-indigo-50 active:scale-95"
              >
                <img
                  src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                  alt="Google"
                  className="h-6 w-6"
                />
                Continue with Google
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid w-full max-w-5xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { label: "Neural Engine", desc: "42+ Systemic Types", icon: <Activity size={24} />, color: "text-amber-500" },
            { label: "Advanced Logic", desc: "Gemini 1.5 Analysis", icon: <Brain size={24} />, color: "text-indigo-500" },
            { label: "Dermal Vision", desc: "25+ Skin Classes", icon: <Microscope size={24} />, color: "text-emerald-500" }
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex flex-col items-center rounded-[2rem] border border-slate-100 bg-slate-50/30 p-6 backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100"
            >
              <div className={`mb-3 ${card.color}`}>{card.icon}</div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-950 mb-1">{card.label}</p>
              <p className="text-[10px] font-bold text-slate-400">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400">
          Asclepius Terminal | 2026 Edition
        </p>
      </main>
    </div>
  );
}
