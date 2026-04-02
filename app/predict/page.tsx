"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Activity,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { ALL_SYMPTOMS } from "@/lib/symptoms-list";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DiagnosisReport from "@/components/DiagnosisReport";

// Utility to format symptom names (e.g., muscle_wasting -> Muscle Wasting)
const formatName = (name: string) =>
  name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const COMMON_SYMPTOMS = [
  "fatigue",
  "high_fever",
  "headache",
  "nausea",
  "vomiting",
  "cough",
  "joint_pain",
  "skin_rash",
  "itching",
  "chills",
];

export default function PredictPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- State Hooks ---
  const [isExpanded, setIsExpanded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // --- Auth Guard ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // --- Memoized Logic ---
  const visibleElsewhere = useMemo(
    () => new Set([...COMMON_SYMPTOMS, ...selected, ...related]),
    [selected, related],
  );

  const otherSymptoms = useMemo(() => {
    const uniqueAllSymptoms = Array.from(new Set(ALL_SYMPTOMS));
    return uniqueAllSymptoms.filter((s) => !visibleElsewhere.has(s));
  }, [visibleElsewhere]);

  const displayedOthers = isExpanded
    ? otherSymptoms
    : otherSymptoms.slice(0, 12);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    const normalizedQuery = query.replace(/\s+/g, "_");
    return ALL_SYMPTOMS.filter((s) => {
      const symptomName = s.toLowerCase();
      return (
        (symptomName.includes(normalizedQuery) ||
          symptomName.replace(/_/g, " ").includes(query)) &&
        !selected.includes(s)
      );
    }).slice(0, 6);
  }, [searchQuery, selected]);

  // --- Effects ---
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
          body: JSON.stringify({ symptoms: selected }),
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

  // --- Handlers ---
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
      const res = await fetch("/api/predict", {
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
          modelUsed: "basic",
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
        <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className={`${showReport ? "h-screen overflow-hidden" : "min-h-screen"} bg-slate-50 text-slate-800 p-4 font-sans flex flex-col transition-all duration-300`}
    >
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        {showReport && predictions ? (
          /* --- REPORT VIEW MODE --- */
          <div className="h-[calc(100vh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            {/* --- TOP BAR: BACK & SAVE --- */}
            <div className="flex items-center justify-between mb-4 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 py-2">
              <button
                onClick={() => setShowReport(false)}
                className="flex items-center gap-2 text-[10px] font-black text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-[0.2em]"
              >
                <ArrowLeft size={14} /> Edit
              </button>

              <button
                onClick={savePrediction}
                disabled={isSaving}
                className="flex items-center gap-2 bg-amber-900 text-amber-100 hover:text-amber-900 hover:border px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-amber-100 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                <Activity size={14} />
                {isSaving ? "Saving..." : "Save Record"}
              </button>
            </div>

            <DiagnosisReport
              symptoms={selected}
              results={predictions}
              date={new Date().toISOString()}
              engine="Basic"
            />
          </div>
        ) : (
          /* --- SELECTION UI MODE --- */
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-4 text-center">
              <h1 className="text-4xl font-black text-amber-900 mb-2 tracking-tight">
                Basic Diagnosis
              </h1>
              <p className="text-xs font-bold text-slate-400 tracking-widest">
                ID:{" "}
                <span className="text-amber-600">{session.user?.email}</span>
              </p>
            </div>

            {/* 1. COMPACT SEARCH & ACTION ROW */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 z-10">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="What's troubling you?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-11 pr-4 rounded-xl border border-amber-300 focus:border-amber-700 focus:outline-none shadow-sm text-amber-700 text-sm transition-all bg-white"
                />

                {/* Search Dropdown stays relative to the input */}
                {searchQuery.trim().length >= 2 && (
                  <div className="absolute z-20 w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl mt-1.5 overflow-hidden ring-2 ring-black/5 animate-in slide-in-from-top-1 duration-150">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Suggestions
                          </span>
                          <span className="text-[9px] font-bold text-amber-500 uppercase italic">
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
                              className="w-full text-left px-3 py-2.5 hover:bg-amber-50/50 border-b border-slate-50 last:border-none transition-all flex justify-between items-center group active:bg-amber-100"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-amber-400 transition-colors" />
                                <span className="text-xs font-bold text-slate-700 group-hover:text-amber-900 transition-colors">
                                  {formatName(s)}
                                </span>
                              </div>
                              <ChevronRight
                                size={12}
                                className="text-slate-300 group-hover:text-amber-500"
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

              {/* ANALYSIS BUTTON */}
              <div className="shrink-0 relative">
                {" "}
                {/* relative is key for tooltip positioning */}
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
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-md border-[3px] 
      ${
        selected.length < 3
          ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
          : "bg-amber-100 text-amber-900 border-amber-900 hover:bg-amber-900 hover:text-white"
      }`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Activity size={16} />
                  )}
                  {loading ? "..." : "Analyze"}
                </button>
                {/* DIALOGUE / TOOLTIP */}
                {showTooltip && (
                  <div className="absolute bottom-full mb-3 right-0 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                    <div className="relative text-[10px] font-bold leading-tight uppercase tracking-wider text-center">
                      Select at least {3 - selected.length} more symptoms to
                      analyze
                      {/* Little triangle pointer */}
                      <div className="absolute top-full right-6 mt-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Selected Symptoms */}
            <div className="mb-4 min-h-[40px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em]">
                  Selected
                </h3>
                {selected.length > 0 && (
                  <button
                    onClick={() => setSelected([])}
                    className="text-[10px] font-black text-amber-600 hover:text-amber-800 uppercase tracking-widest transition-colors"
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
                    className="group flex items-center gap-1.5 bg-amber-600 text-white pl-3 pr-2 py-1 rounded-lg text-xs font-bold shadow-sm hover:bg-amber-700 transition-all"
                  >
                    {formatName(s)}{" "}
                    <span className="opacity-60 text-sm">×</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Suggestions */}
            {related.length > 0 && (
              <div className="mb-3 p-4 bg-amber-100 border border-amber-500 rounded-2xl">
                <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] mb-3">
                  Recommended
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {related.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className="bg-white text-amber-700 border border-amber-200 px-3 py-1 rounded-md text-xs font-bold hover:bg-amber-600 hover:text-white transition-all"
                    >
                      + {formatName(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Common & Discover Unified Grid */}
            <div className="space-y-4">
              <section>
                <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] mb-3">
                  Quick Select
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {COMMON_SYMPTOMS.map(
                    (s) =>
                      !selected.includes(s) && (
                        <button
                          key={s}
                          onClick={() => toggleSymptom(s)}
                          className="text-left px-3 py-2.5 rounded-xl bg-white border border-amber-100 text-amber-600 text-[11px] font-bold hover:border-amber-600 hover:bg-amber-50 transition-all truncate shadow-sm"
                        >
                          {formatName(s)}
                        </button>
                      ),
                  )}
                </div>
              </section>

              <section className="pt-6 pb-3 border-t border-slate-200">
                <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] mb-3">
                  Symptom Library
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {displayedOthers.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-slate-50/50 border border-amber-400 text-amber-800 text-[12px] tracking-tight hover:border-amber-400 hover:bg-white hover:text-amber-700 transition-all whitespace-nowrap"
                    >
                      {formatName(s)}
                    </button>
                  ))}
                </div>
                {otherSymptoms.length > 12 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-4 py-2.5 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-white border border-amber-100 rounded-xl hover:bg-amber-50 transition-colors"
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
