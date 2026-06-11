import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InnoVibe CRM | EV Service Management",
  description: "Production-grade CRM for InnoVibe Mobility — manage customers, bookings, complaints, AMC and more.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" style={{ background: "#F0F4FF" }}>
      <body className={`${inter.className} h-full overflow-hidden flex`} style={{ background: "#F0F4FF" }}>
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-5" style={{ background: "#F0F4FF" }}>
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
