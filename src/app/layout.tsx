import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/pharma/Header";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PharmaInsight — Scientific Evidence-Based Intelligence Platform",
  description:
    "Evaluate drug-herb interactions and explore pharmacological profiles with weighted evidence scoring. Developed by Dr. Mahmoud Mostafa. Powered by PubMed, CrossRef, OpenAlex, and OpenFDA.",
  keywords: [
    "PharmaInsight",
    "drug-herb interaction",
    "pharmacology",
    "phytochemistry",
    "evidence-based",
    "PubMed",
    "CrossRef",
    "OpenAlex",
    "OpenFDA",
    "scientific literature",
  ],
  authors: [{ name: "Dr. Mahmoud Mostafa" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "PharmaInsight — Evidence-Based Intelligence",
    description:
      "Scientific evidence-based platform for drug-herb interaction and pharmacology analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
      <AuthProvider>
        <Header />
        {children}
        <Toaster />
      </AuthProvider>
      </body>
    </html>
  );
}
