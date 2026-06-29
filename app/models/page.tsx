"use client";
import React, { useEffect } from "react";
import { 
  Zap, 
  BrainCircuit, 
  Camera, 
  ChevronRight, 
  Info,
  ShieldCheck,
  Loader2 
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const models = [
  {
    id: "basic",
    title: "Basic Diagnosis",
    tagline: "Symptom-based Analysis",
    description: "Our core engine uses a weighted symptom matrix to identify 42 common diseases with high accuracy.",
    icon: <Zap className="text-amber-500" size={32} />,
    color: "border-amber-200 bg-amber-50/30",
    txtColor: "text-amber-600",
    btnColor: "bg-amber-600 hover:bg-amber-700",
    features: ["Fast Processing", "42+ Diseases", "No History Required"],
    href: "/models/predict",
  },
  {
    id: "advanced",
    title: "Advanced Diagnosis",
    tagline: "Symptom-based Analysis",
    description: "Powered by Gemini 1.5, this model cross-references symptoms with medical literature for rare conditions.",
    icon: <BrainCircuit className="text-indigo-500" size={32} />,
    color: "border-indigo-200 bg-indigo-50/30",
    txtColor: "text-indigo-600",
    btnColor: "bg-indigo-600 hover:bg-indigo-700",
    features: ["Gemini AI Powered", "Risk Assessment", "Clinical Logic"],
    href: "/models/predict-advanced",
  },
  {
    id: "skin",
    title: "Dermal Vision",
    tagline: "Image-based Analysis",
    description: "Upload a clear photo of skin irregularities. Our computer vision model detects patterns of common skin conditions.",
    icon: <Camera className="text-emerald-500" size={32} />,
    color: "border-emerald-200 bg-emerald-50/30",
    txtColor: "text-emerald-600",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
    features: ["Image Upload", "Pattern Detection", "Instant Results"],
    href: "/models/predict-skin",
  },
];

export default function ModelsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 flex flex-col">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-900 tracking-tight">
          Diagnostic Models
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Select the specialised engine for your current assessment needs.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 pb-8">
        {models.map((model) => (
          <div
            key={model.id}
            className={`flex flex-col justify-between rounded-3xl border-2 p-6 md:p-8 transition-all hover:shadow-xl hover:-translate-y-1 ${model.color} shadow-sm`}
          >
            <div>
              <div className="mb-4 flex items-start justify-between">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                  {model.icon}
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <ShieldCheck size={12} /> Secure
                </div>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-1">
                {model.title}
              </h2>
              <p className={`${model.txtColor} font-bold text-xs uppercase tracking-widest mb-3`}>
                {model.tagline}
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                {model.description}
              </p>

              <div className="space-y-2">
                {model.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={model.href}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white font-bold transition-all active:scale-95 shadow-lg ${model.btnColor}`}
              >
                Launch Model <ChevronRight size={18} />
              </Link>
              <button className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <Info size={14} /> View Documentation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
