"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Stethoscope,
  MapPin,
  Phone,
  Calendar,
  X,
  CheckCircle,
  User,
  Mail,
  Heart,
  AlertCircle,
} from "lucide-react";
import { getSpecializationsForDisease } from "@/lib/disease-specialization";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  locality: string;
  contactNumber: string;
  image: string | null;
}

interface BookingForm {
  doctorId: string;
  patientName: string;
  patientAge: string;
  patientSex: string;
  locality: string;
  contactNumber: string;
  email: string;
}

const INITIAL_FORM: BookingForm = {
  doctorId: "",
  patientName: "",
  patientAge: "",
  patientSex: "",
  locality: "",
  contactNumber: "",
  email: "",
};

interface PredictionData {
  symptoms: string[];
  results: { disease: string; confidence: number }[];
  engine: string;
  date: string;
  imageUrl?: string;
}

interface Props {
  diseases: string[];
  predictionData?: PredictionData;
}

export default function DoctorRecommendation({ diseases, predictionData }: Props) {
  const { data: session } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState<BookingForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const matchedSpecs = new Set<string>();
  if (diseases && diseases.length > 0) {
    diseases.forEach((d) => getSpecializationsForDisease(d).forEach((s) => matchedSpecs.add(s)));
  }

  useEffect(() => {
    fetch("/api/doctors")
      .then((res) => res.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        if (matchedSpecs.size > 0) {
          setDoctors(all.filter((d: Doctor) => matchedSpecs.has(d.specialization)));
        } else {
          setDoctors(all);
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  const openBooking = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setForm({
      ...INITIAL_FORM,
      doctorId: doctor.id,
      email: session?.user?.email || "",
      locality: doctor.locality,
    });
    setError("");
    setSuccess(false);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, predictionData }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to book");
      }
      setSuccess(true);
      setTimeout(() => { setShowForm(false); setSuccess(false); }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
      </div>
    );
  }

  if (doctors.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={18} className="text-indigo-600" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
          Recommended {doctors.length > 0 ? doctors[0].specialization.includes(",") ? "Specialists" : doctors[0].specialization + (doctors.length > 1 ? "s" : "") : "Doctors"}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-800 truncate">
                  {doctor.name}
                </h4>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  {doctor.specialization}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  {doctor.qualification}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin size={10} />
              <span className="text-[10px] font-medium truncate">{doctor.locality}</span>
            </div>
            <button
              onClick={() => openBooking(doctor)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
            >
              <Calendar size={12} /> Book Appointment
            </button>
          </div>
        ))}
      </div>

      {showForm && selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { if (!submitting) setShowForm(false); }} />
          <div className="relative bg-white w-full max-w-lg rounded-[32px] p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              disabled={submitting}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={20} strokeWidth={3} />
            </button>

            {success ? (
              <div className="py-8 text-center">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-800">Appointment Booked!</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Your appointment with {selectedDoctor.name} has been sent. You'll be notified when confirmed.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-black text-slate-800 mb-1">Book Appointment</h3>
                <p className="text-xs font-bold text-indigo-600 mb-5">
                  with {selectedDoctor.name} ({selectedDoctor.specialization})
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" required value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                          className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="John Doe" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Age</label>
                        <input type="number" required min="1" max="150" value={form.patientAge} onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="30" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Sex</label>
                        <select required value={form.patientSex} onChange={(e) => setForm({ ...form, patientSex: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white">
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Locality</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })}
                        className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Your area / city" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Contact Number</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="tel" required value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                          className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="+91 98765 43210" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="email@example.com" />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg disabled:opacity-50 mt-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} />}
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
