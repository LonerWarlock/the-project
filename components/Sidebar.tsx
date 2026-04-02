"use client";
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
  User
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { name: "My Appointments", href: "/appointments", icon: Calendar },
  { name: "Saved Reports", href: "/history", icon: History },
  { name: "Diagnostic Models", href: "/models", icon: Database },
  { name: "Health Trends", href: "/trends", icon: LineChart },
  { name: "Ask AI", href: "/chat", icon: MessageSquare },

];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // 3. SIDEBAR MUST BE COMPLETELY INVISIBLE WHEN USER LOGGED OUT
  if (status !== "authenticated") {
    return null;
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white p-4 font-sans shadow-sm shrink-0">
      
      {/* 1. Header: Redirects to / */}
      <Link href="/" className="mb-25 px-2 group transition-transform active:scale-95">
        <div className="flex items-center gap-2 text-indigo-600">
          <Stethoscope size={28} strokeWidth={2.5} />
          <h1 className="text-xl font-bold tracking-tight text-indigo-900 group-hover:text-indigo-600 transition-colors">
            Core2Cover AI
          </h1>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-widest">
          Clinical Insights Engine
        </p>
      </Link>

      {/* 2. Middle Section: Navigation Tabs */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 3. Bottom Section: Profile & Logout */}
      <div className="mt-auto border-t border-slate-100 pt-3">
        
        {/* Redirects to /profile */}
        <Link 
          href="/profile" 
          className="mb-1 flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
        >
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-bold text-slate-800 group-hover:text-indigo-600">
              {session?.user?.name || "User"}
            </span>
            <span className="truncate text-xs text-slate-400">
              {session?.user?.email}
            </span>
          </div>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}