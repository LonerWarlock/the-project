"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DiagnosisReport from "@/components/DiagnosisReport";
import DiagnosisReportAdv from "@/components/DiagnosisReportAdv";
import DiagnosisReportImg from "@/components/DiagnosisReportImg";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import AlertDialog from "@/components/AlertDialog";

export default function DetailedHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { document.title = "Saved Report | Asclepius AI"; }, []);

  useEffect(() => {
    fetch("/api/predictions/history")
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((r: any) => r.id === id);
        setRecord(found);
      });
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/predictions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/history");
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  if (!record)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
              record.modelUsed === "basic"
                ? "text-amber-600 hover:text-amber-800"
                : record.modelUsed === "advanced"
                  ? "text-indigo-600 hover:text-indigo-800"
                  : "text-emerald-600 hover:text-emerald-800"
            }`}
          >
            <ArrowLeft size={14} /> Back to History
          </button>
          <button
            onClick={() => setShowDeleteAlert(true)}
            className="flex items-center gap-2 px-3 py-2.5 text-red-500 hover:text-white hover:bg-red-600 border-2 border-red-200 hover:border-red-600 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <Trash2 size={14} />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Delete</span>
          </button>
        </div>

        <div className="flex-1 pb-10">
          {record.modelUsed === "basic" ? (
            <DiagnosisReport
              symptoms={record.symptoms}
              results={record.results}
              date={record.createdAt}
              engine={record.modelUsed}
            />
          ) : record.modelUsed === "advanced" ? (
            <DiagnosisReportAdv
              symptoms={record.symptoms}
              results={record.results}
              date={record.createdAt}
              engine={record.modelUsed}
            />
          ) : (
            <DiagnosisReportImg
              symptoms={record.symptoms}
              results={record.results}
              date={record.createdAt}
              engine={record.modelUsed}
              imagePreview={record.imageUrl}
            />
          )}
        </div>
      </div>

      <AlertDialog
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
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
