import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import AIConsultantFab from "@/components/ai/AIConsultantFab";
import { Toaster } from "sonner";
import NavigationProgress from "@/components/ui/NavigationProgress";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PECIFY | Precision Instrumentation",
  description: "Technical instrumentation for high-performance gaming ecosystems.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // cho phép zoom tới 5x mà không bị cắt layout
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <AIConsultantFab />
        <Toaster richColors closeButton position="top-right" />
        <NavigationProgress />
      </body>
    </html>
  );
}
