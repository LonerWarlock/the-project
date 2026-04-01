"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, History, User, LogOut } from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();

  return (
    <motion.aside 
      initial={{ x: -100 }} animate={{ x: 0 }}
      className="fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 p-6 flex flex-col justify-between z-50"
    >
      <div>
        <div className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent mb-10 px-2">
          MED.AI
        </div>
        
        <nav className="space-y-2">
          <Link href="/predict" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 text-slate-600 font-medium transition-all">
            <LayoutDashboard size={20} /> Diagnosis
          </Link>
          <Link href="/history" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 text-slate-600 font-medium transition-all">
            <History size={20} /> History
          </Link>
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6 px-2">
          <img src={session?.user?.image!} className="w-10 h-10 rounded-full border-2 border-indigo-100" />
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </motion.aside>
  );
}