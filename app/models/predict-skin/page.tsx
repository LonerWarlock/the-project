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
import AlertDialog from "@/components/AlertDialog";
import * as ort from "onnxruntime-web";

const SKIN_CLASSES = [
  "Acne & Rosacea", "Actinic Keratosis & Malignant Lesions", "Atopic Dermatitis",
  "Bullous Disease", "Cellulitis & Bacterial Infections", "Eczema",
  "Exanthems & Drug Eruptions", "Alopecia & Hair Diseases", "Herpes, HPV & STDs",
  "Pigmentation Disorders", "Lupus & Connective Tissue Diseases", "Melanoma & Moles",
  "Nail Fungus & Nail Diseases", "Other / Unclassified", "Healthy Skin",
  "Poison Ivy & Contact Dermatitis", "Psoriasis & Lichen Planus",
  "Scabies, Lyme & Bug Bites", "Seborrheic Keratoses & Benign Tumors",
  "Systemic Disease", "Ringworm, Candidiasis & Fungal Infections",
  "Urticaria (Hives)", "Vascular Tumors", "Vasculitis", "Warts, Molluscum & Viral Infections",
];

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => x / sum);
}

export default function PredictSkinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const processImageToTensor = async (file: File): Promise<ort.Tensor> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, 224, 224);
        const imageData = ctx.getImageData(0, 0, 224, 224).data;
        const float32Data = new Float32Array(3 * 224 * 224);
        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];

        for (let i = 0; i < 224 * 224; i++) {
          const r = imageData[i * 4] / 255.0;
          const g = imageData[i * 4 + 1] / 255.0;
          const b = imageData[i * 4 + 2] / 255.0;
          float32Data[i] = (r - mean[0]) / std[0];
          float32Data[224 * 224 + i] = (g - mean[1]) / std[1];
          float32Data[2 * 224 * 224 + i] = (b - mean[2]) / std[2];
        }
        resolve(new ort.Tensor("float32", float32Data, [1, 3, 224, 224]));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

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
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setPredictions(null);
    setShowReport(false);
  };

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const inputTensor = await processImageToTensor(image);
      const session = await ort.InferenceSession.create("/skin_model_9625_v4.onnx");
      const feeds = { input: inputTensor };
      const results = await session.run(feeds);
      const outputTensor = results[session.outputNames[0]];
      const rawScores = Array.from(outputTensor.data as Float32Array);
      const probabilities = softmax(rawScores);

      const mappedResults = probabilities
        .map((prob, index) => ({
          disease: SKIN_CLASSES[index],
          confidence: Math.round(prob * 100)
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      if (mappedResults[0].disease === "Other / Unclassified") {
        setIsAlertOpen(true);
      } else {
        setPredictions(mappedResults);
        setShowReport(true);
      }
    } catch (err: any) {
      setError("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const savePrediction = async () => {
    if (!predictions || !image) return;
    setIsSaving(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", image);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData });
      if (!uploadRes.ok) throw new Error("Failed to upload image");
      const { url } = await uploadRes.json();
      const res = await fetch("/api/predictions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: [image.name], results: predictions, modelUsed: "skin", imageUrl: url }),
      });
      if (res.ok) router.push("/history");
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setPredictions(null);
    setShowReport(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans transition-all duration-300">
      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Unclear Image Detected"
        message="Please ensure you upload a clear, well-lit, close-up photo of human skin only."
        yesText="Okay"
        yesColor="indigo"
        noText=""
        onYes={() => { setIsAlertOpen(false); clearImage(); }}
      />

      <div className="max-w-4xl mx-auto w-full">
        {showReport && predictions ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <button
                onClick={() => setShowReport(false)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black text-emerald-600 hover:text-emerald-800 transition-colors uppercase tracking-[0.2em]"
              >
                <ArrowLeft size={14} /> Back to Edit
              </button>
              <button
                onClick={savePrediction}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-900 text-emerald-100 px-6 py-3 rounded-xl text-[10px] font-black hover:bg-emerald-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                <Activity size={14} />
                {isSaving ? "Saving..." : "Save Record"}
              </button>
            </div>
            <DiagnosisReportImg
              symptoms={[image?.name || "Uploaded Image"]}
              results={predictions}
              date={new Date().toISOString()}
              engine="Dermal Vision"
              imagePreview={imagePreview}
            />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 text-center">
              <h1 className="text-3xl md:text-5xl font-black text-emerald-600 mb-2 tracking-tight">Dermal Vision</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate max-w-xs mx-auto">
                ID: <span className="text-emerald-600">{session?.user?.email}</span>
              </p>
            </header>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <p className="text-xs font-bold text-red-700">{error}</p>
              </div>
            )}

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Upload */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Upload Image</h3>
                {!imagePreview ? (
                  <div
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all min-h-[250px] flex flex-col items-center justify-center p-6 ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-200 bg-white hover:border-emerald-400'}`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} className="hidden" />
                    <Upload className="text-emerald-300 mb-4" size={48} />
                    <p className="text-sm font-bold text-emerald-700">Drag image here or tap to browse</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Max 10MB (JPG, PNG, WEBP)</p>
                  </div>
                ) : (
                  <div className="relative group rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-xl bg-white">
                    <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-[300px] md:max-h-[500px] object-cover" />
                    <button onClick={clearImage} className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-red-500 hover:text-white rounded-full transition-all shadow-lg">
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </section>

              {/* Right Column: Tips & Action */}
              <section className="space-y-6">
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                  <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4">Tips for Best Results</h3>
                  <ul className="space-y-3">
                    {["Good lighting & clear focus", "Close-up of the affected area", "Avoid shadows & glare", "Include surrounding healthy skin"].map((tip, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs text-emerald-700 font-bold">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" /> {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={loading || !image}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm transition-all shadow-xl ${!image ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]'}`}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
                  {loading ? "Analyzing Specimen..." : "Begin Neural Analysis"}
                </button>

                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed text-center px-4">
                  Preliminary neural analysis. Consult a dermatologist for professional medical advice.
                </p>
              </section>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}