"use client";
import { useState } from "react"; // 1. Added useState
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  History,
  MessageSquare,
  Database,
  LineChart,
  LogOut,
  Stethoscope,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Appointments", href: "/appointments", icon: Calendar, desc: "Schedule visits" },
  { name: "Saved Reports", href: "/history", icon: History, desc: "Clinical archive" },
  { name: "AI Models", href: "/models", icon: Database, desc: "Diagnostic suite" },
  { name: "Health Trends", href: "/trends", icon: LineChart, desc: "Vitals tracking" },
  { name: "Ask AI", href: "/chat", icon: MessageSquare, desc: "Gemini assist" },
];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // 2. Define the missing state for the image fallback
  const [imgError, setImgError] = useState(false);

  if (status !== "authenticated") return null;

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-100 bg-white/90 font-sans backdrop-blur-xl shrink-0 z-50">

      {/* 1. Brand Header */}
      <div className="p-6 pb-4">
        <Link href="/" className="group block transition-all active:scale-95">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 group-hover:shadow-indigo-200 transition-all">
              <Stethoscope size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-indigo-950 leading-none">
                Asclepius <span className="font-light text-indigo-500">AI</span>
              </h1>
              <div className="flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <ShieldCheck size={10} className="text-emerald-500" /> Secure Terminal
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Navigation Section */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                isActive
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }`}
            >
              <div className="flex items-center gap-3.5">
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-tight">{item.name}</span>
                  {!isActive && (
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-indigo-400 transition-colors">
                      {item.desc}
                    </span>
                  )}
                </div>
              </div>
              {isActive && (
                <motion.div layoutId="activeArrow">
                  <ChevronRight size={14} className="text-indigo-200" />
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Bottom Section: Profile & System Controls */}
      <div className="p-4 mt-auto border-t border-slate-50 bg-slate-50/30 backdrop-blur-sm">

        {/* User Identity Card */}
        <Link
          href="/profile"
          className="group flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm border border-slate-100 transition-all hover:border-indigo-200 hover:shadow-md mb-3"
        >
          <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center text-indigo-600 font-black text-sm border border-white overflow-hidden shadow-inner">
            {session?.user?.image && !imgError ? (
              <img
                src={session.user.image}
                alt="" 
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="animate-in fade-in duration-300">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden text-left">
            <span className="truncate text-xs font-black text-indigo-950 uppercase tracking-tighter">
              {session?.user?.name || "Practitioner"}
            </span>
            <span className="truncate text-[10px] font-bold text-slate-400 italic">
              Active Session
            </span>
          </div>
        </Link>

        {/* System Exit */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-red-800 transition-all hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100"
        >
          <LogOut size={16} />
          LogOut
        </button>
      </div>
    </aside>
  );
}