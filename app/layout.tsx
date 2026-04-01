// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Core2Cover AI",
  description: "A professional-grade diagnostic assistant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 overflow-hidden"> {/* Prevent body scroll */}
        <SessionWrapper>
          <div className="flex h-screen w-full"> {/* Force screen height */}
            
            {/* Sidebar stays on the left, takes 64px width */}
            <Sidebar />

            {/* Main content takes remaining space and scrolls internally */}
            <main className="flex-1 h-full overflow-y-auto">
              {children}
            </main>
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}