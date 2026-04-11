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
import AlertDialog from "@/components/AlertDialog"; // <-- Imported Alert Dialog
import * as ort from "onnxruntime-web";

// ⚠️ MUST remain in alphabetical order based on the original training folders!
const SKIN_CLASSES = [
  "Acne & Rosacea",                               // 0
  "Actinic Keratosis & Malignant Lesions",        // 1
  "Atopic Dermatitis",                            // 2
  "Bullous Disease",                              // 3
  "Cellulitis & Bacterial Infections",            // 4
  "Eczema",                                       // 5
  "Exanthems & Drug Eruptions",                   // 6
  "Alopecia & Hair Diseases",                     // 7
  "Herpes, HPV & STDs",                           // 8
  "Pigmentation Disorders",                       // 9
  "Lupus & Connective Tissue Diseases",           // 10
  "Melanoma & Moles",                             // 11
  "Nail Fungus & Nail Diseases",                  // 12
  "Other / Unclassified",                         // 13
  "Healthy Skin",                                 // 14
  "Poison Ivy & Contact Dermatitis",              // 15
  "Psoriasis & Lichen Planus",                    // 16
  "Scabies, Lyme & Bug Bites",                    // 17
  "Seborrheic Keratoses & Benign Tumors",         // 18
  "Systemic Disease",                             // 19
  "Ringworm, Candidiasis & Fungal Infections",    // 20
  "Urticaria (Hives)",                            // 21
  "Vascular Tumors",                              // 22
  "Vasculitis",                                   // 23
  "Warts, Molluscum & Viral Infections",          // 24
];

// Mathematical Softmax function to convert raw scores into percentages
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

  // --- State Hooks ---
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false); // <-- Alert Box State

  // --- Auth Guard ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // --- Image Processing Pipeline ---
  const processImageToTensor = async (file: File): Promise<ort.Tensor> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 1. Create a hidden 224x224 canvas
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        // 2. Draw and squish the image to exactly 224x224
        ctx.drawImage(img, 0, 0, 224, 224);
        const imageData = ctx.getImageData(0, 0, 224, 224).data;

        // 3. Prepare the Float32Array for PyTorch (1 batch, 3 channels, 224x224)
        const float32Data = new Float32Array(3 * 224 * 224);
        const mean = [0.485, 0.456, 0.406]; // ImageNet standard means
        const std = [0.229, 0.224, 0.225];  // ImageNet standard deviations

        // 4. Extract pixels, Normalize, and arrange in NCHW format
        for (let i = 0; i < 224 * 224; i++) {
          const r = imageData[i * 4] / 255.0;
          const g = imageData[i * 4 + 1] / 255.0;
          const b = imageData[i * 4 + 2] / 255.0;

          float32Data[i] = (r - mean[0]) / std[0]; // Red Channel
          float32Data[224 * 224 + i] = (g - mean[1]) / std[1]; // Green Channel
          float32Data[2 * 224 * 224 + i] = (b - mean[2]) / std[2]; // Blue Channel
        }

        resolve(new ort.Tensor("float32", float32Data, [1, 3, 224, 224]));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

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
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setPredictions(null);
    setShowReport(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
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
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setPredictions(null);
    setShowReport(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- THE ONNX INFERENCE ENGINE ---
  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Process Image into Tensor
      const inputTensor = await processImageToTensor(image);

      // 2. Load ONNX Model
      const session = await ort.InferenceSession.create("/skin_model_7025_v2.onnx");

      // 3. Run Inference
      const feeds = { input: inputTensor };
      const results = await session.run(feeds);

      // 4. Extract outputs and calculate softmax percentages
      const outputTensor = results[session.outputNames[0]];
      const rawScores = Array.from(outputTensor.data as Float32Array);
      const probabilities = softmax(rawScores);

      // 5. Map to Class Names, Sort, and grab Top 3
      const mappedResults = probabilities
        .map((prob, index) => ({
          disease: SKIN_CLASSES[index],
          confidence: Math.round(prob * 100)
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      // 6. 🛑 INTERCEPT: Check if top result is "Other / Unclassified"
      if (mappedResults[0].disease === "Other / Unclassified") {
        setIsAlertOpen(true);
      } else {
        setPredictions(mappedResults);
        setShowReport(true);
      }

    } catch (err: any) {
      console.error(err);
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

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");
      const { url } = await uploadRes.json();

      const res = await fetch("/api/predictions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: [image.name],
          results: predictions,
          modelUsed: "skin",
          imageUrl: url,
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

      {/* --- ALERT DIALOG FOR UNCLASSIFIED IMAGES --- */}
      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Unclear Image Detected"
        message="Please ensure you upload a clear, well-lit, close-up photo of human skin only."
        yesText="Okay"
        yesColor="indigo"
        noText=""
        onYes={() => {
          setIsAlertOpen(false);
          clearImage(); // Clears the bad image out of the UI
        }}
      />

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

            <div className="mt-auto p-3 rounded-2xl flex items-start gap-3 shrink-0">
              
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                This tool provides preliminary analysis only. Consult your dermatologist for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}