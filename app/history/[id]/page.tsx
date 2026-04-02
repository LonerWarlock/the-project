"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DiagnosisReport from "@/components/DiagnosisReport";
import { Loader2, ArrowLeft } from "lucide-react";

export default function DetailedHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    fetch("/api/predictions/history")
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((r: any) => r.id === id);
        setRecord(found);
      });
  }, [id]);

  if (!record)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-600" size={32} />
      </div>
    );

  return (
    /* --- h-screen and overflow-hidden prevent the browser scrollbar --- */
    <div className="h-screen overflow-hidden bg-slate-50 p-4 font-sans flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        
        {/* --- Header: Consistent with Predict Page --- */}
        <div className="flex items-center justify-between mb-4 bg-slate-50/80 backdrop-blur-sm shrink-0 py-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-[0.2em]"
          >
            <ArrowLeft size={14} /> Back to History
          </button>
          
        </div>

          <DiagnosisReport
            symptoms={record.symptoms}
            results={record.results}
            date={record.createdAt}
            engine={record.modelUsed}
          />
      </div>
    </div>
  );
}