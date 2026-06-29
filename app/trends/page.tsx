"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Activity,
  Thermometer,
  Droplets,
  LineChart,
  Loader2,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface VitalsEntry {
  date: string;
  heartRate: number;
  systolic: number;
  diastolic: number;
  temperature: number;
  oxygen: number;
}

const VITALS_RANGES = {
  heartRate: { min: 60, max: 100, label: "Heart Rate", unit: "bpm", icon: Heart, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
  systolic: { min: 90, max: 120, label: "Systolic", unit: "mmHg", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200" },
  diastolic: { min: 60, max: 80, label: "Diastolic", unit: "mmHg", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200" },
  temperature: { min: 36.1, max: 37.2, label: "Temperature", unit: "°C", icon: Thermometer, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  oxygen: { min: 95, max: 100, label: "Oxygen Sat.", unit: "%", icon: Droplets, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TREND_HISTORY: VitalsEntry[] = [
  { date: "Mon", heartRate: 72, systolic: 118, diastolic: 76, temperature: 36.6, oxygen: 98 },
  { date: "Tue", heartRate: 75, systolic: 121, diastolic: 78, temperature: 36.8, oxygen: 97 },
  { date: "Wed", heartRate: 78, systolic: 119, diastolic: 77, temperature: 36.5, oxygen: 98 },
  { date: "Thu", heartRate: 71, systolic: 115, diastolic: 74, temperature: 36.7, oxygen: 99 },
  { date: "Fri", heartRate: 74, systolic: 120, diastolic: 79, temperature: 36.6, oxygen: 97 },
  { date: "Sat", heartRate: 80, systolic: 122, diastolic: 80, temperature: 36.9, oxygen: 96 },
  { date: "Sun", heartRate: 76, systolic: 117, diastolic: 75, temperature: 36.7, oxygen: 98 },
];

export default function TrendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedMetric, setSelectedMetric] = useState<keyof VitalsEntry>("heartRate");
  const [showAllVitals, setShowAllVitals] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  const latest = TREND_HISTORY[TREND_HISTORY.length - 1];
  const metricConfig = VITALS_RANGES[selectedMetric as keyof typeof VITALS_RANGES];
  const metricValues = TREND_HISTORY.map((e) => Number(e[selectedMetric]));
  const maxVal = Math.max(...metricValues);
  const minVal = Math.min(...metricValues);
  const avgVal = metricValues.reduce((a, b) => a + b, 0) / metricValues.length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-indigo-900 flex items-center gap-2 tracking-tight">
            <LineChart size={24} /> Health Trends
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track and monitor your vital signs over time.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {Object.entries(VITALS_RANGES).map(([key, config]) => {
            const value = latest[key as keyof VitalsEntry] as number;
            const isNormal = value >= config.min && value <= config.max;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key as keyof VitalsEntry)}
                className={`${config.bg} ${config.border} border-2 rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                  selectedMetric === key ? "ring-2 ring-indigo-400 shadow-md scale-[1.02]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <config.icon size={18} className={config.color} />
                  {!isNormal && <AlertTriangle size={14} className="text-amber-500" />}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{config.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-800">{typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}</span>
                  <span className="text-[10px] font-bold text-slate-400">{config.unit}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">{metricConfig.label} — 7-Day Trend</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">
                Avg: {avgVal.toFixed(1)} {metricConfig.unit} &nbsp;|&nbsp; Range: {minVal.toFixed(1)} – {maxVal.toFixed(1)} {metricConfig.unit}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              (latest[selectedMetric] as number) >= metricConfig.min && (latest[selectedMetric] as number) <= metricConfig.max
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}>
              {(latest[selectedMetric] as number) >= metricConfig.min && (latest[selectedMetric] as number) <= metricConfig.max ? "Normal Range" : "Out of Range"}
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-48 md:h-56 pt-4">
            {TREND_HISTORY.map((entry, i) => {
              const value = Number(entry[selectedMetric]);
              const pct = ((value - minVal * 0.9) / (maxVal * 1.1 - minVal * 0.9)) * 100;
              const isToday = i === TREND_HISTORY.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[9px] font-black text-slate-400">{typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}</span>
                  <div
                    className={`w-full max-w-[40px] rounded-xl transition-all duration-500 ${
                      isToday ? "bg-indigo-500" : "bg-indigo-200 hover:bg-indigo-300"
                    }`}
                    style={{ height: `${Math.max(pct, 8)}%` }}
                  />
                  <span className={`text-[10px] font-bold ${isToday ? "text-indigo-600" : "text-slate-400"}`}>{entry.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAllVitals(!showAllVitals)}
            className="w-full flex items-center justify-between p-6 md:p-8 text-left"
          >
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Complete Vitals Log</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">7-day record of all tracked metrics.</p>
            </div>
            {showAllVitals ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
          </button>

          {showAllVitals && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Day</th>
                    {Object.entries(VITALS_RANGES).map(([key, config]) => (
                      <th key={key} className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{config.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TREND_HISTORY.map((entry, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 pr-4 text-xs font-bold text-slate-600">{entry.date}</td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-black text-rose-600">{entry.heartRate}</span>
                        <span className="text-[9px] text-slate-400 ml-0.5">bpm</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-black text-indigo-600">{entry.systolic}/{entry.diastolic}</span>
                        <span className="text-[9px] text-slate-400 ml-0.5">mmHg</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-black text-amber-600">{entry.temperature.toFixed(1)}</span>
                        <span className="text-[9px] text-slate-400 ml-0.5">°C</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-black text-emerald-600">{entry.oxygen}</span>
                        <span className="text-[9px] text-slate-400 ml-0.5">%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
          <AlertTriangle size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700 leading-relaxed">
            These vitals are sample readings for demonstration. Regularly monitoring your heart rate, blood pressure, temperature, and oxygen saturation helps detect early warning signs. Always consult a medical professional for abnormal readings.
          </p>
        </div>

        <footer className="mt-8 pt-6 pb-4 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
            This data is for illustration only. Not a substitute for professional medical monitoring.
          </p>
        </footer>
      </div>
    </div>
  );
}
