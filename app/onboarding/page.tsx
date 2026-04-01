"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/user/update-profile", {
      method: "POST",
      body: JSON.stringify({ name, phone }),
    });
    router.push("/predict");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome! 👋</h1>
        <p className="text-slate-500 mb-8 font-medium">Let's finish setting up your profile.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Preferred Name</label>
            <input 
              className="w-full p-4 mt-1 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium"
              value={name} onChange={(e) => setName(e.target.value)} required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
            <input 
              className="w-full p-4 mt-1 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium"
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
            />
          </div>
          <button className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}