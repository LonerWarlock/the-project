"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Activity,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { ALL_SYMPTOMS_ANN } from "@/lib/symptoms-list-ann";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DiagnosisReportAdv from "@/components/DiagnosisReportAdv";
import DoctorRecommendation from "@/components/DoctorRecommendation";

const formatName = (name: string) =>
  name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const COMMON_SYMPTOMS = [
  "fatigue",
  "fever",
  "headache",
  "nausea",
  "vomiting",
  "cough",
  "joint pain",
  "skin rash",
  "itching of skin",
  "chills",
];

export default function PredictPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const visibleElsewhere = useMemo(
    () => new Set([...COMMON_SYMPTOMS, ...selected, ...related]),
    [selected, related],
  );

  const otherSymptoms = useMemo(() => {
    const uniqueAllSymptoms = Array.from(new Set(ALL_SYMPTOMS_ANN));
    return uniqueAllSymptoms.filter((s) => !visibleElsewhere.has(s));
  }, [visibleElsewhere]);

  const displayedOthers = isExpanded
    ? otherSymptoms
    : otherSymptoms.slice(0, 12);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    const normalizedQuery = query.replace(/\s+/g, "_");
    return ALL_SYMPTOMS_ANN.filter((s: string) => {
      const symptomName = s.toLowerCase();
      return (
        symptomName.includes(normalizedQuery) &&
        !selected.includes(s)
      );
    }).slice(0, 6);
  }, [searchQuery, selected]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (selected.length !== 1) {
        if (selected.length === 0) setRelated([]);
        return;
      }
      try {
        const res = await fetch("/api/related_symptoms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms: selected, modelType: "advanced" }),
        });
        const data = await res.json();
        const newRelated = data.related.filter(
          (s: string) => !selected.includes(s),
        );
        setRelated(newRelated);
      } catch (err) {
        console.error("Failed to fetch related symptoms");
      }
    };
    const timer = setTimeout(fetchRelated, 300);
    return () => clearTimeout(timer);
  }, [selected]);

  const toggleSymptom = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
    setPredictions(null);
  };

  const handlePredict = async () => {
    if (selected.length < 3) return;
    setLoading(true);
    try {
      const res = await fetch("/api/predict-ann", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selected }),
      });
      const data = await res.json();
      setPredictions(data.predictions);
      setShowReport(true);
    } catch (err) {
      alert("Error generating prediction.");
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
          symptoms: selected,
          results: predictions,
          modelUsed: "advanced",
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

  const [showTooltip, setShowTooltip] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-3 md:p-4 lg:p-6 font-sans flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        {showReport && predictions ? (
          <div className="flex flex-col min-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 py-3 shrink-0 border-b border-slate-100">
              <button
                onClick={() => setShowReport(false)}
                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-[0.2em]"
              >
                <ArrowLeft size={14} /> Edit
              </button>

              <button
                onClick={savePrediction}
                disabled={isSaving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                <Activity size={14} />
                {isSaving ? "Saving..." : "Save Record"}
              </button>
            </div>

            <div className="flex-1 pb-8">
              <DiagnosisReportAdv
                symptoms={selected}
                results={predictions}
                date={new Date().toISOString()}
                engine="Advanced"
              />
              <DoctorRecommendation diseases={predictions.map(p => p.disease)} predictionData={{ symptoms: selected, results: predictions, engine: "Advanced", date: new Date().toISOString() }} />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
            <div className="mb-5 text-center">
              <h1 className="text-3xl md:text-4xl font-black text-indigo-600 mb-1 tracking-tight">
                Advanced Diagnosis
              </h1>
              <p className="text-xs font-bold text-slate-400 tracking-widest">
                ID:{" "}
                <span className="text-indigo-600">{session.user?.email}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 z-10">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="What's troubling you?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-11 pr-4 rounded-xl border border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm text-indigo-700 text-sm transition-all bg-white"
                />

                {searchQuery.trim().length >= 2 && (
                  <div className="absolute z-20 w-full bg-white backdrop-blur-md border border-slate-200 rounded-xl shadow-xl mt-1.5 overflow-hidden animate-in slide-in-from-top-1 duration-150">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Suggestions
                          </span>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase italic">
                            {searchResults.length} matches
                          </span>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto">
                          {searchResults.map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                toggleSymptom(s);
                                setSearchQuery("");
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 border-b border-slate-50 last:border-none transition-all flex justify-between items-center group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
                                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-900 transition-colors">
                                  {formatName(s)}
                                </span>
                              </div>
                              <ChevronRight
                                size={12}
                                className="text-slate-300 group-hover:text-indigo-500"
                              />
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-xs font-black text-slate-500 uppercase">
                        No symptoms found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    if (selected.length < 3) {
                      setShowTooltip(true);
                      setTimeout(() => setShowTooltip(false), 2000);
                      return;
                    }
                    handlePredict();
                  }}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-md border-2 w-full sm:w-auto ${
                    selected.length < 3
                      ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
                      : "bg-indigo-100 text-indigo-900 border-indigo-900 hover:bg-indigo-900 hover:text-white"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Activity size={16} />
                  )}
                  {loading ? "..." : "Analyze"}
                </button>
                {showTooltip && (
                  <div className="absolute bottom-full mb-3 right-0 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                    <div className="relative text-[10px] font-bold leading-tight uppercase tracking-wider text-center">
                      Select at least {3 - selected.length} more symptoms to
                      analyze
                      <div className="absolute top-full right-6 mt-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 min-h-[40px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em]">
                  Selected ({selected.length})
                </h3>
                {selected.length > 0 && (
                  <button
                    onClick={() => setSelected([])}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.length === 0 && (
                  <span className="text-slate-400 text-xs italic">
                    Select at least 3 symptoms to begin...
                  </span>
                )}
                {selected.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className="group flex items-center gap-1.5 bg-indigo-600 text-white pl-3 pr-2 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all"
                  >
                    {formatName(s)}{" "}
                    <span className="opacity-60 text-sm">×</span>
                  </button>
                ))}
              </div>
            </div>

            {related.length > 0 && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em] mb-3">
                  Recommended
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {related.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className="bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      + {formatName(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em] mb-3">
                  Quick Select
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {COMMON_SYMPTOMS.map(
                    (s) =>
                      !selected.includes(s) && (
                        <button
                          key={s}
                          onClick={() => toggleSymptom(s)}
                          className="text-left px-3 py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-[11px] font-bold hover:border-indigo-500 hover:bg-indigo-50 transition-all truncate shadow-sm"
                        >
                          {formatName(s)}
                        </button>
                      ),
                  )}
                </div>
              </section>

              <section className="pt-6 pb-3 border-t border-slate-200">
                <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em] mb-3">
                  Symptom Library
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {displayedOthers.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-white border border-indigo-300 text-indigo-800 text-xs tracking-tight hover:border-indigo-500 hover:bg-indigo-50 transition-all whitespace-nowrap"
                    >
                      {formatName(s)}
                    </button>
                  ))}
                </div>
                {otherSymptoms.length > 12 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-4 py-2.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    {isExpanded
                      ? "Collapse ↑"
                      : `Show ${otherSymptoms.length - 12} More ↓`}
                  </button>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
