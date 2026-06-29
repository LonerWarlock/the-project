"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, Loader2, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/doctors/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("doctor_token", data.token);
      router.push("/doctors/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-xl border border-slate-100 p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Stethoscope size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-800">Doctor Login</h1>
          <p className="text-xs text-slate-500 mt-1">Access your professional dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="doctor@clinic.com" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Enter password" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-5">
          Not registered?{" "}
          <Link href="/doctors/signup" className="font-black text-indigo-600 hover:text-indigo-800">Create account</Link>
        </p>
      </div>
    </div>
  );
}
