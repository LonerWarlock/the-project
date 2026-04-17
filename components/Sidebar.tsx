"use client";
import { useState } from "react";
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
  ShieldCheck,
  Menu, // Added for mobile trigger
  X,    // Added for mobile close
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

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
  
  const [imgError, setImgError] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Mobile toggle state

  if (status !== "authenticated") return null;

  // Shared Navigation Content to avoid repetition
  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <Link href="/" className="group block transition-all active:scale-95" onClick={() => setIsOpen(false)}>
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

      {/* Navigation Section */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)} // Close on click for mobile
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

      {/* Bottom Section */}
      <div className="p-4 mt-auto border-t border-slate-50 bg-slate-50/30 backdrop-blur-sm">
        <Link
          href="/profile"
          onClick={() => setIsOpen(false)}
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

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-red-800 transition-all hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100"
        >
          <LogOut size={16} />
          LogOut
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Mobile Toggle Button (Visible only on small screens) */}
      <div className="fixed top-4 left-4 z-[60] lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-indigo-600 active:scale-90 transition-transform"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 2. Desktop Sidebar (Visible only on lg and above) */}
      <aside className="hidden lg:flex h-screen w-72 flex-col border-r border-slate-100 bg-white/90 font-sans backdrop-blur-xl shrink-0 z-50">
        <SidebarContent />
      </aside>

      {/* 3. Mobile Overlay and Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-[55] lg:hidden"
            />
            
            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-screen w-72 flex flex-col bg-white border-r border-slate-100 z-[56] lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}