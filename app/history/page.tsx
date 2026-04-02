"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  History, 
  Calendar, 
  ChevronRight, 
  Activity, 
  Clock, 
  Loader2, 
  AlertCircle 
} from "lucide-react";

interface PredictionRecord {
  id: string;
  createdAt: string;
  symptoms: string[];
  results: { disease: string; confidence: number }[];
  modelUsed: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetch("/api/predictions/history")
        .then((res) => res.json())
        .then((data) => {
          setRecords(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-indigo-900 flex items-center gap-3">
            <History size={32} /> Prediction History
          </h1>
          <p className="text-slate-500 mt-2">
            Review your past AI diagnostic assessments and clinical insights.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No records found</h3>
            <p className="text-slate-500 mb-6">You haven't saved any diagnostic results yet.</p>
            <button 
              onClick={() => router.push("/models")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition-all"
            >
              Start New Diagnosis
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {records.map((record) => (
              <div 
                key={record.id} 
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                {/* Date/Time Block */}
                <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-2xl p-4 min-w-[100px]">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">
                    {new Date(record.createdAt).toLocaleDateString('en-GB', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-black text-indigo-900">
                    {new Date(record.createdAt).getDate()}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold mt-1">
                    <Clock size={10} /> {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Content Block */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {record.symptoms.slice(0, 4).map((s, i) => (
                      <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase">
                        {s.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {record.symptoms.length > 4 && (
                      <span className="text-[10px] font-bold text-slate-400">+{record.symptoms.length - 4} more</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-800">
                      Top Result: {record.results[0]?.disease}
                    </h3>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full">
                      {record.results[0]?.confidence}% Match
                    </span>
                  </div>
                </div>

                {/* Model Badge & Action */}
                <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="hidden lg:block text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine Used</p>
                    <p className="text-sm font-bold text-indigo-600 capitalize">{record.modelUsed || 'Standard'}</p>
                  </div>
                  <button 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
                  >
                    View Full Report <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 flex items-center gap-2 text-slate-400 text-xs bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
          <AlertCircle size={14} />
          <span>These records are for informational purposes only. Always verify with a healthcare professional before taking action.</span>
        </footer>
      </div>
    </div>
  );
}