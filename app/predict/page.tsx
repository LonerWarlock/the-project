'use client'
import { useState, useEffect } from 'react';

// A starting list for the user (The "Most Common" section)
const COMMON_SYMPTOMS = [
  "fatigue", "high_fever", "headache", "nausea", 
  "vomiting", "cough", "joint_pain", "skin_rash", 
  "itching", "chills"
];

// Helper to format text (e.g., "skin_rash" -> "Skin Rash")
const formatName = (name: string) => name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export default function PredictPage() {
  // State variables
  const [selected, setSelected] = useState<string[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Full symptom list (Fetched from API or hardcoded for search)
  // For simplicity, let's assume this list is available or we search dynamically.
  // Ideally, you'd fetch the full list from the API on mount.

  // --- Logic 1: Handle Selection ---
  const toggleSymptom = (symptom: string) => {
    setSelected(prev => {
      if (prev.includes(symptom)) {
        // Remove it
        return prev.filter(s => s !== symptom);
      } else {
        // Add it
        return [...prev, symptom];
      }
    });
    // Reset prediction when symptoms change
    setPredictions(null);
  };

  // --- Logic 2: Fetch Related Symptoms ---
  useEffect(() => {
    const fetchRelated = async () => {
      if (selected.length === 0) {
        setRelated([]);
        return;
      }
      try {
        const res = await fetch('/api/related_symptoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: selected }),
        });
        const data = await res.json();
        // Only show related if they aren't already selected
        const newRelated = data.related.filter((s: string) => !selected.includes(s));
        setRelated(newRelated);
      } catch (err) {
        console.error("Failed to fetch related symptoms");
      }
    };

    // Debounce the call slightly to avoid too many requests
    const timer = setTimeout(fetchRelated, 300);
    return () => clearTimeout(timer);
  }, [selected]);

  // --- Logic 3: Handle Prediction ---
  const handlePredict = async () => {
    if (selected.length < 3) return;
    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">AI Diagnostic Tool</h1>
          <p className="text-slate-500">Select at least 3 symptoms to begin analysis</p>
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
          {/* Note: In a real app, you would render a dropdown of search results here */}
        </div>

        {/* 2. SELECTED SYMPTOMS AREA */}
        <div className="mb-8 min-h-[60px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Selected Symptoms</h3>
          <div className="flex flex-wrap gap-3">
            {selected.length === 0 && (
              <span className="text-slate-400 text-sm italic">No symptoms selected yet...</span>
            )}
            {selected.map(s => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className="group flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg animate-in fade-in zoom-in duration-200"
              >
                <span>✓</span>
                {formatName(s)}
                <span className="ml-1 opacity-60 group-hover:opacity-100">×</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. RELATED SYMPTOMS (Dynamic) */}
        {related.length > 0 && (
          <div className="mb-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Frequently Associated With Your Selection</h3>
            <div className="flex flex-wrap gap-2">
              {related.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className="bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors"
                >
                  + {formatName(s)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. COMMON SYMPTOMS */}
        <div className="mb-10">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Common Symptoms</h3>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map(s => {
              // Hide if already selected or in related list (to prevent duplicates)
              if (selected.includes(s) || related.includes(s)) return null;
              
              return (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm hover:border-slate-400 hover:bg-slate-50 transition-all"
                >
                  {formatName(s)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. PREDICT BUTTON */}
        <div className="flex justify-center mb-10">
          {selected.length >= 3 ? (
            <button
              onClick={handlePredict}
              disabled={loading}
              className="bg-indigo-600 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Analysing Clinical Data..." : "Run Diagnosis"}
            </button>
          ) : (
             <div className="text-slate-400 text-sm bg-slate-100 px-4 py-2 rounded-full">
               Select {3 - selected.length} more symptom{3 - selected.length > 1 ? 's' : ''} to predict
             </div>
          )}
        </div>

        {/* 6. RESULTS DISPLAY */}
        {predictions && (
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">Clinical Assessment</h2>
            
            {predictions[0].confidence >= 90 ? (
              // HIGH CONFIDENCE VIEW
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <p className="text-green-600 font-bold uppercase tracking-widest text-xs mb-2">High Confidence Match</p>
                <h3 className="text-3xl font-bold text-green-800 mb-2">{predictions[0].disease}</h3>
                <div className="w-full bg-green-200 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: `${predictions[0].confidence}%` }}></div>
                </div>
                <p className="text-right text-xs text-green-700 mt-1">{predictions[0].confidence}% Probability</p>
              </div>
            ) : (
              // LOW CONFIDENCE / MULTIPLE VIEW
              <div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex gap-3 items-center text-amber-800 text-sm">
                  <span className="text-xl">⚠️</span>
                  <p>Symptoms are ambiguous. Please review the top possibilities.</p>
                </div>
                
                <div className="space-y-3">
                  {predictions.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="bg-white w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shadow-sm text-slate-400">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-lg text-slate-700">{p.disease}</span>
                      </div>
                      <div className="text-right">
                         <span className="block font-bold text-indigo-600">{p.confidence}%</span>
                         <span className="text-xs text-slate-400">Match</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}