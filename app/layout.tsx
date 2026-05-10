import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import FirstVisitModal from "@/components/FirstVisitModal";

export const metadata: Metadata = {
  title: "MIRA — Healthcare Navigator",
  description:
    "Find care, lower costs, understand documents, and get help with paperwork — without an account.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <FirstVisitModal />
        <footer className="text-center text-xs text-slate-500 py-6 px-4">
          MIRA · This is information, not medical advice. Consult a healthcare professional for your specific situation.
        </footer>
      </body>
    </html>
  );
}
