"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DiagnosisReport from "@/components/DiagnosisReport";
import {
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hourglass,
  User,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  CheckCheck,
  Ban,
  Activity,
  X,
} from "lucide-react";

interface Doctor {
  name: string;
  specialization: string;
  locality: string;
  contactNumber: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  patientName: string;
  patientAge: number;
  patientSex: string;
  locality: string;
  contactNumber: string;
  email: string;
  status: string;
  scheduledDate: string | null;
  rejectionReason: string | null;
  predictionData: { symptoms: string[]; results: { disease: string; confidence: number }[]; engine: string; date: string } | null;
  createdAt: string;
  doctor: Doctor;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  PENDING: {
    bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
    icon: Hourglass, label: "Pending",
  },
  ACCEPTED: {
    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
    icon: CheckCircle, label: "Accepted",
  },
  REJECTED: {
    bg: "bg-red-50", text: "text-red-700", border: "border-red-200",
    icon: XCircle, label: "Rejected",
  },
  COMPLETED: {
    bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200",
    icon: CheckCheck, label: "Completed",
  },
  CANCELLED: {
    bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200",
    icon: Ban, label: "Cancelled",
  },
};

export default function AppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<NonNullable<Appointment["predictionData"]> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget);
    setShowCancelModal(false);
    try {
      const res = await fetch(`/api/appointments/${cancelTarget}`, { method: "DELETE" });
      if (res.ok) {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === cancelTarget ? updated : a)));
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

  const countByStatus = (s: string) => appointments.filter((a) => a.status === s).length;

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-indigo-900 flex items-center gap-2 tracking-tight">
            <Calendar size={24} /> My Appointments
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track your booked appointments and their status.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", "PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                filter === s
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {s === "ALL" ? "All" : s}
              {s !== "ALL" && (
                <span className="ml-1.5 opacity-60">({countByStatus(s)})</span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Calendar size={40} className="text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">No appointments found</h3>
            <p className="text-slate-400 text-sm mt-2">
              {filter === "ALL" ? "Book a doctor after your next diagnosis to get started." : `No ${filter.toLowerCase()} appointments.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((apt) => {
              const style = STATUS_STYLES[apt.status] || STATUS_STYLES.PENDING;
              const StatusIcon = style.icon;
              return (
                <div
                  key={apt.id}
                  className={`bg-white rounded-2xl border ${style.border} shadow-sm p-4 md:p-5`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${style.bg} flex items-center justify-center`}>
                        <StatusIcon size={18} className={style.text} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Stethoscope size={12} className="text-indigo-500" />
                          <h3 className="text-sm font-black text-slate-800">{apt.doctor.name}</h3>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{apt.doctor.specialization}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <Clock size={10} />
                          <span className="text-[9px] font-bold">
                            {new Date(apt.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg ${style.bg} ${style.text} text-[9px] font-black uppercase tracking-widest border ${style.border}`}>
                      {style.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User size={12} className="text-indigo-400" />
                      <span className="text-xs font-medium">{apt.patientName} — {apt.patientAge} yrs, {apt.patientSex}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={12} className="text-indigo-400" />
                      <span className="text-xs font-medium">{apt.locality}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={12} className="text-indigo-400" />
                      <span className="text-xs font-medium">{apt.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={12} className="text-indigo-400" />
                      <span className="text-xs font-medium">{apt.email}</span>
                    </div>
                  </div>

                  {apt.scheduledDate && (
                    <div className="mb-3 p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                      <Calendar size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600">
                        Scheduled: {new Date(apt.scheduledDate).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {apt.rejectionReason && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                      <AlertCircle size={12} className="text-red-500" />
                      <span className="text-[10px] font-bold text-red-600">
                        Doctor&apos;s note: {apt.rejectionReason}
                      </span>
                    </div>
                  )}

                  {apt.predictionData && apt.predictionData.length > 0 && (
                    <div className="mb-3">
                      <button onClick={() => { setReportData(apt.predictionData); setShowReport(true); }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-200">
                        <Activity size={12} /> View Diagnosis Report</button>
                    </div>
                  )}

                  {apt.status === "PENDING" && (
                    <div className="pt-2 border-t border-slate-50">
                      <button onClick={() => { setCancelTarget(apt.id); setShowCancelModal(true); }} disabled={cancellingId === apt.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50">
                        {cancellingId === apt.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                        Cancel Appointment</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 border border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Cancel Appointment</h3>
              <p className="text-xs text-slate-500 mb-4">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => { setShowCancelModal(false); setCancelTarget(null); }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Keep</button>
                <button onClick={handleCancel} disabled={cancellingId === cancelTarget}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50">
                  {cancellingId === cancelTarget ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Yes, Cancel"}</button>
              </div>
            </div>
          </div>
        )}

        {showReport && reportData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl">
              <button onClick={() => { setShowReport(false); setReportData(null); }}
                className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur rounded-xl p-2 shadow-md text-slate-500 hover:text-slate-800 transition-all">
                <X size={18} />
              </button>
              <DiagnosisReport
                symptoms={reportData.symptoms}
                results={reportData.results}
                date={reportData.date}
                engine={reportData.engine}
              />
            </div>
          </div>
        )}

        <footer className="mt-8 pt-6 pb-4 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
            Appointment requests are subject to doctor availability and confirmation.
          </p>
        </footer>
      </div>
    </div>
  );
}
