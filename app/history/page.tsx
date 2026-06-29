"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { History, Activity, Loader2, Trash2 } from "lucide-react";
import AlertDialog from "@/components/AlertDialog";

interface PredictionRecord {
  id: string;
  createdAt: string;
  symptoms: string[];
  results: { disease: string; confidence: number }[];
  modelUsed: string;
}

const getModelStyles = (model: string) => {
  switch (model?.toLowerCase()) {
    case "advanced":
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        border: "border-indigo-100",
        badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
        dateText: "text-indigo-400",
        dateNum: "text-indigo-900",
      };
    case "skin":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dateText: "text-emerald-400",
        dateNum: "text-emerald-900",
      };
    default:
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        dateText: "text-amber-400",
        dateNum: "text-amber-900",
      };
  }
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => { document.title = "Saved Reports | Asclepius AI"; }, []);
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/predictions/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-black text-indigo-900 flex items-center gap-2">
            <History size={20} /> Saved Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">Your past AI assessments.</p>
        </div>

        {records.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Activity className="text-slate-200 mx-auto mb-4" size={40} />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">No records yet</h3>
            <button
              onClick={() => router.push("/models")}
              className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-4 hover:underline"
            >
              Start a Diagnosis →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {records.map((record) => {
              const styles = getModelStyles(record.modelUsed);

              return (
                <div
                  key={record.id}
                  className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 relative"
                >
                  <div onClick={() => router.push(`/history/${record.id}`)} className="flex flex-col gap-3">
                    <div className={`flex flex-row items-center justify-between ${styles.bg} rounded-xl px-3 py-2`}>
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black ${styles.dateText} uppercase tracking-tighter`}>
                          {new Date(record.createdAt).toLocaleDateString("en-GB", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className={`text-sm md:text-lg font-black ${styles.dateNum} leading-none`}>
                          {new Date(record.createdAt).getDate()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-bold ${styles.text} tabular-nums opacity-70 block`}>
                          {new Date(record.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className={`text-[9px] font-bold ${styles.text} uppercase capitalize`}>
                          {record.modelUsed}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-black text-slate-800 truncate flex-1">
                          {record.results[0]?.disease}
                        </h3>
                        <span className={`${styles.badge} text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-sm whitespace-nowrap`}>
                          {record.results[0]?.confidence}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {record.symptoms.slice(0, 3).map((s, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 whitespace-nowrap"
                            >
                              {s.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                            </span>
                          ))}
                          {record.symptoms.length > 3 && (
                            <span className="text-[9px] font-bold text-slate-400">
                              +{record.symptoms.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(record.id);
                    }}
                    className="self-end p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-70 hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Report?"
        message="This will permanently delete this diagnostic report and all its data. This action cannot be undone."
        yesText={deleting ? "Deleting..." : "Delete"}
        noText="Cancel"
        yesColor="rose"
        onYes={handleDelete}
      />
    </div>
  );
}
