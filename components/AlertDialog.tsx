"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  yesText: string;
  noText: string;
  yesLink?: string;
  noLink?: string;
  yesColor?: string; // Made optional
  noColor?: string;  // Made optional
  onYes?: () => void;
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  yesText,
  noText,
  yesLink,
  noLink,
  yesColor = "rose", // Default to rose
  noColor = "white", // Default to white
  onYes,
}: AlertDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // Mapping simple names to full Tailwind background classes
  const colorMap: Record<string, string> = {
    rose: "bg-rose-600 hover:bg-rose-700 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
    sky: "bg-sky-600 hover:bg-sky-700 text-white",
    white: "bg-white hover:bg-slate-100 text-slate-600 border-2 border-slate-400",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };

  const handleYes = () => {
    if (onYes) onYes();
    if (yesLink) router.push(yesLink);
    onClose();
  };

  const handleNo = () => {
    if (noLink) router.push(noLink);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl shadow-indigo-500 border-2 border-indigo-600 animate-in zoom-in-95 duration-300 font-sans">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-black text-indigo-600 tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleYes}
            className={`flex-1 px-6 py-3.5 ${colorMap[yesColor] || colorMap.rose} rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 shadow-lg`}
          >
            {yesText}
          </button>
          
          {noText !== "" && (
            <button
              onClick={handleNo}
              className={`flex-1 px-6 py-3.5 ${colorMap[noColor] || colorMap.white} rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95`}
            >
              {noText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}