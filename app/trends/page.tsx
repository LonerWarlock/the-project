"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ExternalLink,
  Newspaper,
  AlertCircle,
  RefreshCw,
  Clock,
  Globe,
} from "lucide-react";

interface Article {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

export default function TrendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => { document.title = "Health Trends | Asclepius AI"; }, []);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchArticles = () => {
    setLoading(true);
    setError("");
    fetch("/api/trends")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setArticles(data.articles || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    fetchArticles();
  }, [status, router]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-indigo-900 flex items-center gap-2 tracking-tight">
              <Newspaper size={24} /> Health Trends
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Latest health news, studies, and medical updates from around the web.
            </p>
          </div>
          <button
            onClick={fetchArticles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-300 rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">{error}</p>
              <p className="text-xs text-amber-600 mt-1">
                Make sure NEWSAPI_KEY is set in your .env file. Get a free key at{" "}
                <a
                  href="https://newsapi.org/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-800"
                >
                  newsapi.org/register
                </a>
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 && !error ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Newspaper size={40} className="text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">No articles available</h3>
            <p className="text-slate-400 text-sm mt-2">Check back later for the latest health news.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="h-40 bg-slate-100 overflow-hidden relative">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={32} className="text-slate-200" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-[9px] font-black text-indigo-600 uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm">
                      {article.source || "News"}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3 flex-1">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={10} />
                      <span className="text-[9px] font-bold">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest group-hover:text-indigo-700 transition-colors">
                      Read <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <footer className="mt-8 pt-6 pb-4 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
            <Globe size={10} /> Powered by NewsAPI &middot; Updated daily
          </p>
        </footer>
      </div>
    </div>
  );
}
