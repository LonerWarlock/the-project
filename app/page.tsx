import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
      <main className="max-w-2xl">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-indigo-900">
          Core2Cover AI
        </h1>
        <p className="mb-8 text-lg text-slate-600">
          A professional-grade diagnostic assistant powered by Google Gemini. 
          Analyze symptoms and get clinical insights in seconds.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/predict"
            className="flex h-12 items-center justify-center rounded-full bg-indigo-600 px-8 text-lg font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
          >
            Start Diagnosis
          </Link>
          <a
            href="https://github.com/lonerwarlock/the-project"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-full border border-slate-300 px-8 text-lg font-medium text-slate-700 transition-all hover:bg-slate-100"
          >
            View Source
          </a>
        </div>
      </main>

      <footer className="mt-16 text-sm text-slate-400">
        <p>© 2026 Core2Cover. For informational purposes only.</p>
      </footer>
    </div>
  );
}