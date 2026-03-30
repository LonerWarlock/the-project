'use client'
import { useState, useEffect, useMemo } from 'react';
import { ALL_SYMPTOMS } from '@/lib/symptoms-list';

const COMMON_SYMPTOMS = [
  "fatigue", "high_fever", "headache", "nausea", 
  "vomiting", "cough", "joint_pain", "skin_rash", 
  "itching", "chills"
];

const formatName = (name: string) => name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export default function PredictPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  // --- NEW: Search Logic ---
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return ALL_SYMPTOMS.filter(s => 
      s.toLowerCase().includes(searchQuery.toLowerCase()) && 
      !selected.includes(s)
    ).slice(0, 6); // Limit results for UI cleanliness
  }, [searchQuery, selected]);

  const toggleSymptom = (symptom: string) => {
    setSelected(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
    setPredictions(null);
  };

  // --- Logic 2: Fetch Related (Now calls Next.js API) ---
  useEffect(() => {
    const fetchRelated = async () => {
      if (selected.length === 0) { setRelated([]); return; }
      try {
        const res = await fetch('/api/related_symptoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: selected }),
        });
        const data = await res.json();
        const newRelated = data.related.filter((s: string) => !selected.includes(s));
        setRelated(newRelated);
      } catch (err) {
        console.error("Failed to fetch related symptoms");
      }
    };

    const timer = setTimeout(fetchRelated, 400);
    return () => clearTimeout(timer);
  }, [selected]);

  // --- Logic 3: Handle Prediction (Calls Gemini Route) ---
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
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">AI Diagnostic Tool</h1>
          <p className="text-slate-500">Search or select at least 3 symptoms</p>
        </div>

        {/* 1. SEARCH BAR WITH DROPDOWN */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search symptoms (e.g., abdominal pain)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-6 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none shadow-sm text-lg transition-all"
          />
          
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white border-2 border-slate-100 rounded-2xl shadow-xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {searchResults.map(s => (
                <button
                  key={s}
                  onClick={() => { toggleSymptom(s); setSearchQuery(""); }}
                  className="w-full text-left p-4 hover:bg-indigo-50 border-b last:border-none transition-colors flex justify-between items-center group"
                >
                  <span className="font-medium">{formatName(s)}</span>
                  <span className="text-indigo-400 opacity-0 group-hover:opacity-100">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. SELECTED SYMPTOMS AREA */}
        <div className="mb-8 min-h-[60px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Selected Symptoms</h3>
          <div className="flex flex-wrap gap-3">
            {selected.length === 0 && <span className="text-slate-400 text-sm italic">No symptoms selected yet...</span>}
            {selected.map(s => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className="group flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
              >
                <span>✓</span> {formatName(s)} <span className="ml-1 opacity-60 group-hover:opacity-100">×</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. RELATED & 4. COMMON (Same as before, hidden if selected) */}
        {related.length > 0 && (
          <div className="mb-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Suggested for you</h3>
            <div className="flex flex-wrap gap-2">
              {related.map(s => (
                <button key={s} onClick={() => toggleSymptom(s)} className="bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600 hover:text-white transition-colors">
                  + {formatName(s)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-10">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Common Symptoms</h3>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map(s => !selected.includes(s) && (
              <button key={s} onClick={() => toggleSymptom(s)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm hover:border-slate-400 hover:bg-slate-50 transition-all">
                {formatName(s)}
              </button>
            ))}
          </div>
        </div>

        {/* 5. PREDICT BUTTON */}
        <div className="flex justify-center mb-10">
          {selected.length >= 3 ? (
            <button onClick={handlePredict} disabled={loading} className="bg-indigo-600 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-70">
              {loading ? "Gemini is analysing..." : "Run Diagnosis"}
            </button>
          ) : (
             <div className="text-slate-400 text-sm bg-slate-100 px-4 py-2 rounded-full">
               Select {3 - selected.length} more to start
             </div>
          )}
        </div>

        {/* 6. RESULTS DISPLAY (Keep your existing high/low confidence UI here) */}
        {predictions && (
           <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-2xl">
             <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">AI Clinical Assessment</h2>
             {/* ... (Your existing predictions map logic) ... */}
             <div className="space-y-3">
                {predictions.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <span className="font-semibold text-lg text-slate-700">{p.disease}</span>
                      <span className="font-bold text-indigo-600">{p.confidence}% Match</span>
                    </div>
                ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}