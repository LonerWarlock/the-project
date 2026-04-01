"use client";

import { useState, useEffect, useMemo } from "react";
import { Bookmark, Search, Activity, ChevronRight, Loader2 } from "lucide-react";
import { ALL_SYMPTOMS } from "@/lib/symptoms-list";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

const formatName = (name: string) =>
  name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export default function PredictPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- 1. All Hooks (State, Memo, Effects) must be at the very top ---
  const [isExpanded, setIsExpanded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Authentication Redirect Hook
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Filtering Logic
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
    : otherSymptoms.slice(0, 10);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, "_");
    return ALL_SYMPTOMS.filter((s) => {
      const symptomName = s.toLowerCase();
      return (
        (symptomName.includes(normalizedQuery) ||
          symptomName.replace(/_/g, " ").includes(searchQuery.toLowerCase())) &&
        !selected.includes(s)
      );
    }).slice(0, 6);
  }, [searchQuery, selected]);

  // Related Symptoms Effect
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

  // --- 2. Conditional Returns (After Hooks) ---
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // --- 3. Logic Handlers ---
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
    } catch (err) {
      alert("Error generating prediction.");
    } finally {
      setLoading(false);
    }
  };

  const savePrediction = async () => {
    try {
      await fetch("/api/predictions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: selected,
          results: predictions,
          userEmail: session.user?.email,
        }),
      });
      alert("Saved to history!");
    } catch (err) {
      alert("Failed to save record.");
    }
  };

  // --- 4. Main UI Render ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-900 mb-2">
            AI Diagnostic Tool
          </h1>
          <p className="text-slate-500">
            Authenticated as <span className="font-semibold">{session.user?.email}</span>
          </p>
        </div>

        {/* 1. SEARCH BAR */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search symptoms (e.g., abdominal pain)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-6 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none shadow-sm text-lg transition-all"
          />

          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white border-2 border-slate-100 rounded-2xl shadow-xl mt-2 overflow-hidden">
              {searchResults.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    toggleSymptom(s);
                    setSearchQuery("");
                  }}
                  className="w-full text-left p-4 hover:bg-indigo-50 border-b last:border-none transition-colors flex justify-between items-center group"
                >
                  <span className="font-medium">{formatName(s)}</span>
                  <span className="text-indigo-400 opacity-0 group-hover:opacity-100 font-bold">
                    + Add
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. SELECTED SYMPTOMS AREA */}
        <div className="mb-8 min-h-[60px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Selected Symptoms
            </h3>

            {selected.length > 0 && (
              <button
                onClick={() => {
                  setSelected([]);
                  setPredictions(null);
                  setRelated([]);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider active:scale-95"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {selected.length === 0 && (
              <span className="text-slate-400 text-sm italic">
                No symptoms selected yet...
              </span>
            )}
            {selected.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className="group flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
              >
                <span>✓</span> {formatName(s)}{" "}
                <span className="ml-1 opacity-60 group-hover:opacity-100 text-lg">
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. SUGGESTED SYMPTOMS */}
        {related.length > 0 && (
          <div className="mb-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
              Suggested for you
            </h3>
            <div className="flex flex-wrap gap-2">
              {related
                .filter((s) => !selected.includes(s))
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className="bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    + {formatName(s)}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* 4. COMMON SYMPTOMS */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Common Symptoms
          </h3>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map(
              (s) =>
                !selected.includes(s) && (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    {formatName(s)}
                  </button>
                ),
            )}
          </div>
        </div>

        {/* 5. DISCOVER ALL SYMPTOMS (Collapsible) */}
        <div className="mb-10 pt-8 border-t border-slate-200">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Discover All Symptoms
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayedOthers.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 active:scale-95 transition-all"
              >
                + {formatName(s)}
              </button>
            ))}
          </div>

          {otherSymptoms.length > 10 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-6 py-2 rounded-full transition-colors border border-indigo-100 shadow-sm"
              >
                {isExpanded ? "Show Less Symptoms ↑" : "View All Symptoms ↓"}
              </button>
            </div>
          )}
        </div>

        {/* 6. PREDICT ACTION */}
        <div className="flex flex-col items-center mb-12">
          {selected.length >= 3 ? (
            <button
              onClick={handlePredict}
              disabled={loading}
              className="bg-indigo-600 text-white text-xl font-bold px-12 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
            >
              {loading ? "Analysing Symptoms..." : "Run AI Diagnosis"}
            </button>
          ) : (
            <div className="text-slate-400 text-sm bg-slate-200 px-6 py-2 rounded-full font-medium">
              Select {3 - selected.length} more to start analysis
            </div>
          )}
        </div>

        {/* 7. RESULTS */}
        {predictions && (
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">
              Diagnosis Results
            </h2>
            <div className="space-y-4">
              {predictions.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <span className="font-semibold text-lg text-slate-700">
                    {p.disease}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-indigo-600 text-xl">
                      {p.confidence}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Match
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={savePrediction}
              className="mt-8 flex items-center justify-center gap-2 w-full bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
            >
              <Bookmark size={20} /> Save to My Records
            </button>

            <p className="mt-6 text-xs text-slate-400 text-center italic leading-relaxed">
              Disclaimer: This is an AI-generated assessment for informational
              purposes only. Consult a healthcare professional for actual medical advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}