import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import FirstVisitModal from "@/components/FirstVisitModal";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MIRA — Healthcare Navigator",
  description:
    "Find care, lower costs, understand documents, and get help with paperwork — without an account.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <Header />
        <main className="flex-1">{children}</main>
        <FirstVisitModal />
        <Footer />
      </body>
    </html>
  );
}
