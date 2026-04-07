"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Activity,
  Loader2,
  ArrowLeft,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DiagnosisReportImg from "@/components/DiagnosisReportImg";

export default function PredictSkinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // --- State Hooks ---
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Auth Guard ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // --- Handlers ---
  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPredictions(null);
    setShowReport(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setPredictions(null);
    setShowReport(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPredictions([
        { disease: "Eczema (Atopic Dermatitis)", confidence: 87 },
        { disease: "Psoriasis", confidence: 62 },
        { disease: "Contact Dermatitis", confidence: 41 },
      ]);
      setShowReport(true);
    } catch (err: any) {
      setError(err.message || "Error generating prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const savePrediction = async () => {
    if (!predictions) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/predictions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: [image?.name || "skin_image"],
          results: predictions,
          modelUsed: "dermal_vision",
        }),
      });
      if (res.ok) router.push("/history");
      else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "Failed to save"}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Middle Ellipsis Logic for Filename
  const formatFileName = (name: string) => {
    if (name.length <= 20) return name;
    const extension = name.split('.').pop();
    const baseName = name.substring(0, name.lastIndexOf('.'));
    return `${baseName.substring(0, 10)}...${baseName.slice(-5)}.${extension}`;
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-800 p-4 font-sans flex flex-col transition-all duration-300">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        {showReport && predictions ? (
          /* --- REPORT VIEW MODE --- */
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-4 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 py-2 shrink-0">
              <button
                onClick={() => setShowReport(false)}
                className="flex items-center gap-2 text-[10px] font-black text-emerald-600 hover:text-emerald-800 transition-colors uppercase tracking-[0.2em]"
              >
                <ArrowLeft size={14} /> Edit
              </button>

              <button
                onClick={savePrediction}
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-900 text-emerald-100 hover:text-emerald-900 hover:border px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                <Activity size={14} />
                {isSaving ? "Saving..." : "Save Record"}
              </button>
            </div>

            {/* Centered Report Card Wrapper */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden pb-10">
                <DiagnosisReportImg
                symptoms={[formatFileName(image?.name || "Uploaded Image")]}
                results={predictions}
                date={new Date().toISOString()}
                engine="Dermal Vision"
                imagePreview={imagePreview}
                />
            </div>
          </div>
        ) : (
          /* --- UPLOAD UI MODE --- */
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full overflow-hidden">
            <div className="mb-4 text-center shrink-0">
              <h1 className="text-4xl font-black text-emerald-600 mb-2 tracking-tight">
                Dermal Vision
              </h1>
              <p className="text-xs font-bold text-slate-400 tracking-widest">
                ID:{" "}
                <span className="text-emerald-600">{session.user?.email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 shrink-0">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-bold text-red-700">{error}</p>
              </div>
            )}

            {/* Image Upload Area */}
            <div className="mb-4 shrink-0">
              <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-3">
                Upload Image
              </h3>

              {!imagePreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all h-48 flex items-center justify-center border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-50">
                      <Upload className="text-emerald-400" size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">
                        Drag & drop an image or click to browse
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        PNG, JPG, WEBP (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="relative group inline-block">
                    <div className="relative rounded-2xl border-[3px] border-emerald-500 overflow-hidden shadow-2xl transition-all group-hover:border-emerald-400">
                      <img
                        src={imagePreview}
                        alt="Uploaded skin image"
                        className="block h-auto w-auto object-contain"
                        style={{
                          maxHeight: "calc(100vh - 32rem)",
                          maxWidth: "100%"
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest truncate">
                          {formatFileName(image?.name || "")}
                        </p>
                        <p className="text-emerald-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                          {(image?.size ? (image.size / 1024 / 1024).toFixed(2) : 0)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearImage}
                      className="absolute -top-3 -right-3 z-20 p-2.5 bg-white rounded-full shadow-xl border border-slate-100 text-slate-400 hover:text-red-600 hover:scale-110 active:scale-95 transition-all"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl shrink-0">
              <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-2">
                Tips for Best Results
              </h3>
              <div className="space-y-1.5">
                {[
                  "Ensure good lighting and clear focus",
                  "Capture the affected area at close range",
                  "Avoid shadows and glare on the image",
                  "Include surrounding healthy skin for reference",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-center shrink-0">
              <button
                onClick={handlePredict}
                disabled={loading || !image}
                className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg border-[3px] ${!image
                    ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
                    : "bg-emerald-100 text-emerald-900 border-emerald-900 hover:bg-emerald-900 hover:text-white"
                  }`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Activity size={18} />
                )}
                {loading ? "Analyzing..." : "Analyze Image"}
              </button>
            </div>

            <div className="mt-auto p-3 bg-slate-100 rounded-2xl flex items-start gap-3 shrink-0">
              <AlertTriangle className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                This tool provides preliminary analysis only. Always consult a qualified dermatologist for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}