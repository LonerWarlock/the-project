// app/page.tsx
"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  // 1. If no session exists, show the login UI
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-2 text-3xl font-bold text-indigo-900">Welcome</h2>
          <p className="mb-6 text-slate-600">Please sign in to access Core2Cover AI</p>
          <button
            onClick={() => signIn("google")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-all hover:bg-slate-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // 2. If session exists, show the landing page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
      {/* Logout button in top right */}
      <div className="absolute right-6 top-6 flex items-center gap-4">
        <p className="text-sm text-slate-600">Hello, {session.user?.name}</p>
        <button
          onClick={() => signOut()}
          className="text-sm font-semibold text-red-600 hover:underline"
        >
          Sign Out
        </button>
      </div>

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
            href="/models"
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