import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Asclepius AI",
    template: "%s | Asclepius AI",
  },
  description: "Professional-grade AI-powered diagnostic assistant for multi-modal health analysis, disease prediction, and doctor appointment scheduling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionWrapper>
          <div className="flex flex-col lg:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 w-full min-h-screen">
              {children}
            </main>
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
