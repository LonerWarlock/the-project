"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, Loader2, User, Mail, MapPin, Phone, BookOpen, ShieldCheck, AlertCircle } from "lucide-react";

export default function DoctorSignup() {
  const router = useRouter();
  useEffect(() => { document.title = "Doctor Registration | Asclepius AI"; }, []);
  const [form, setForm] = useState({
    name: "", email: "", specialization: "", qualification: "", locality: "", contactNumber: "", password: "", confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/doctors/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, specialization: form.specialization,
          qualification: form.qualification, locality: form.locality, contactNumber: form.contactNumber, password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      router.push("/doctors/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-[32px] shadow-xl border border-slate-100 p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Stethoscope size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-800">Doctor Registration</h1>
          <p className="text-xs text-slate-500 mt-1">Create your professional account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Dr. John Doe" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="doctor@clinic.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Specialization</label>
              <select required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white">
                <option value="">Select</option>
                <option>General Physician</option>
                <option>Cardiologist</option>
                <option>Neurologist</option>
                <option>Dermatologist</option>
                <option>Pulmonologist</option>
                <option>Gastroenterologist</option>
                <option>Orthopedic</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Qualification</label>
              <div className="relative">
                <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="MBBS, MD" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Locality / Practice Address</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="City, Area" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Contact Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" required value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Min 6 chars" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
              <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Repeat password" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-5">
          Already registered?{" "}
          <Link href="/doctors/login" className="font-black text-indigo-600 hover:text-indigo-800">Login here</Link>
        </p>
      </div>
    </div>
  );
}
