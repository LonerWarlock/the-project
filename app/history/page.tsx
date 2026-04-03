"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { History, ChevronRight, Activity, Loader2 } from "lucide-react";

interface PredictionRecord {
  id: string;
  createdAt: string;
  symptoms: string[];
  results: { disease: string; confidence: number }[];
  modelUsed: string;
}

// Helper for dynamic model colours
const getModelStyles = (model: string) => {
  switch (model?.toLowerCase()) {
    case "advanced":
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        border: "border-indigo-100",
        badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
        dateText: "text-indigo-300",
        dateNum: "text-indigo-900",
        hoverBg: "group-hover:bg-indigo-600",
      };
    case "skin":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dateText: "text-emerald-300",
        dateNum: "text-emerald-900",
        hoverBg: "group-hover:bg-emerald-600",
      };
    default: // basic
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        dateText: "text-amber-300",
        dateNum: "text-amber-900",
        hoverBg: "group-hover:bg-amber-600",
      };
  }
};

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
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-indigo-900 flex items-center gap-2">
            <History size={24} /> Saved Reports
          </h1>
          <p className="text-slate-400 text-sm">Your past AI assessments.</p>
        </div>

        {records.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
            <Activity className="text-slate-300 mx-auto mb-3" size={40} />
            <h3 className="font-bold text-slate-700">No records yet</h3>
            <button
              onClick={() => router.push("/models")}
              className="text-indigo-600 text-sm font-bold mt-2"
            >
              Start a Diagnosis →
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {records.map((record) => {
              // 1. Logic inside map must be inside curly braces
              const styles = getModelStyles(record.modelUsed);

              // 2. Must use explicit return
              return (
                <div
                  key={record.id}
                  onClick={() => router.push(`/history/${record.id}`)}
                  className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex items-center gap-5"
                >
                  {/* Compact Date */}
                  <div
                    className={`flex flex-col items-center justify-center ${styles.bg} rounded-xl px-3 py-2 min-w-[80px]`}
                  >
                    <span
                      className={`text-[9px] font-black ${styles.dateText} uppercase tracking-tighter`}
                    >
                      {new Date(record.createdAt).toLocaleDateString("en-GB", {
                        month: "short",
                        year: "2-digit",
                      })}
                    </span>
                    <span
                      className={`text-xl font-black ${styles.dateNum} leading-none my-0.5`}
                    >
                      {new Date(record.createdAt).getDate()}
                    </span>
                    <span
                      className={`text-[9px] font-bold ${styles.text} tabular-nums opacity-70`}
                    >
                      {new Date(record.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Info Area */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        Primary Diagnosis
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-slate-800 truncate">
                        {record.results[0]?.disease}
                      </h3>
                      <span
                        className={`${styles.badge} text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm whitespace-nowrap`}
                      >
                        {record.results[0]?.confidence}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex flex-wrap gap-1.5 mt-2 h-5 overflow-hidden">
                        {record.symptoms.map((s, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 whitespace-nowrap"
                          >
                            {s
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Match & Arrow */}
                  <div className="flex items-center gap-4">
                    <div className="text-right min-w-[60px]">
                      <span
                        className={`text-[9px] font-bold ${styles.text} uppercase capitalize`}
                      >
                        {record.modelUsed} Engine
                      </span>
                    </div>
                    <div
                      className={`h-8 w-8 rounded-full ${styles.bg} flex items-center justify-center ${styles.hoverBg} group-hover:text-white transition-colors`}
                    >
                      <ChevronRight
                        size={16}
                        className={`${styles.text} group-hover:text-white`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
