"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DiagnosisReport from "@/components/DiagnosisReport";
import {
  Loader2,
  Stethoscope,
  CheckCircle,
  XCircle,
  Hourglass,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  LogOut,
  CheckCheck,
  Activity,
  X,
} from "lucide-react";

interface Appointment {
  id: string;
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
}

interface DoctorInfo {
  id: string;
  name: string;
  specialization: string;
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
};

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("doctor_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DoctorDashboard() {
  const router = useRouter();
  useEffect(() => { document.title = "Doctor Dashboard | Asclepius AI"; }, []);
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<NonNullable<Appointment["predictionData"]> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("doctor_token");
    if (!token) { router.push("/doctors/login"); return; }

    Promise.all([
      fetch("/api/doctors/auth/me", { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch("/api/doctors/appointments", { headers: getAuthHeaders() }).then((r) => r.json()),
    ])
      .then(([docData, aptData]) => {
        if (docData.error || !docData.id) { localStorage.removeItem("doctor_token"); router.push("/doctors/login"); return; }
        setDoctor(docData);
        if (Array.isArray(aptData)) setAppointments(aptData);
      })
      .catch(() => { localStorage.removeItem("doctor_token"); router.push("/doctors/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  const updateStatus = async (id: string, newStatus: string, extra: Record<string, any> = {}) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAccept = () => {
    if (!acceptTarget) return;
    updateStatus(acceptTarget, "ACCEPTED", { scheduledDate });
    setShowAcceptModal(false);
    setAcceptTarget(null);
    setScheduledDate("");
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    updateStatus(rejectTarget, "REJECTED", { rejectionReason });
    setShowRejectModal(false);
    setRejectTarget(null);
    setRejectionReason("");
  };

  const openAccept = (id: string) => {
    setAcceptTarget(id);
    setScheduledDate("");
    setShowAcceptModal(true);
  };

  const openReject = (id: string) => {
    setRejectTarget(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleLogout = async () => {
    await fetch("/api/doctors/auth/logout", { method: "POST", headers: getAuthHeaders() });
    localStorage.removeItem("doctor_token");
    router.push("/doctors/login");
  };

  const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <Stethoscope size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-indigo-900 tracking-tight">Doctor Dashboard</h1>
              <p className="text-xs font-bold text-indigo-500">{doctor.name} — {doctor.specialization}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-300 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>

        {pendingCount > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-700">
              {pendingCount} pending appointment{pendingCount > 1 ? "s" : ""} require{pendingCount === 1 ? "s" : ""} your response.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", "PENDING", "ACCEPTED", "REJECTED", "COMPLETED"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                filter === s
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
              }`}>{s === "ALL" ? "All" : s}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Calendar size={40} className="text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">No appointments</h3>
            <p className="text-slate-400 text-sm mt-2">No {filter.toLowerCase()} appointments to show.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((apt) => {
              const style = STATUS_STYLES[apt.status] || STATUS_STYLES.PENDING;
              const StatusIcon = style.icon;
              return (
                <div key={apt.id} className={`bg-white rounded-2xl border ${style.border} shadow-sm p-4 md:p-5`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${style.bg} flex items-center justify-center`}>
                        <StatusIcon size={18} className={style.text} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">{apt.patientName}</h3>
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
                      <span className="text-xs font-medium">{apt.patientAge} yrs, {apt.patientSex}</span>
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
                    <div className="mb-3 p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
                      <Calendar size={12} className="text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-600">
                        Scheduled: {new Date(apt.scheduledDate).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {apt.rejectionReason && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                      <XCircle size={12} className="text-red-500" />
                      <span className="text-[10px] font-bold text-red-600">
                        Reason: {apt.rejectionReason}
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
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      <button onClick={() => openAccept(apt.id)} disabled={updatingId === apt.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                        {updatingId === apt.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Accept</button>
                      <button onClick={() => openReject(apt.id)} disabled={updatingId === apt.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50">
                        {updatingId === apt.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Reject</button>
                    </div>
                  )}

                  {apt.status === "ACCEPTED" && (
                    <div className="pt-2 border-t border-slate-50">
                      <button onClick={() => updateStatus(apt.id, "COMPLETED")} disabled={updatingId === apt.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                        {updatingId === apt.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                        Mark Completed</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-8 pt-6 pb-4 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Doctor Dashboard</p>
        </footer>
      </div>

      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Schedule Appointment</h3>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Date & Time</label>
            <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none transition-all mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowAcceptModal(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleAccept} disabled={!scheduledDate || updatingId === acceptTarget}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50">
                {updatingId === acceptTarget ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Confirm Accept"}</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Reject Appointment</h3>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Reason for rejection</label>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="e.g. Not accepting new patients..."
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-red-400 focus:outline-none transition-all mb-4 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleReject} disabled={!rejectionReason || updatingId === rejectTarget}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50">
                {updatingId === rejectTarget ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Confirm Reject"}</button>
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
    </div>
  );
}
