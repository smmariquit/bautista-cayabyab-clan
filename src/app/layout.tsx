// src/app/layout.tsx

import type { Metadata } from "next";
import { Big_Shoulders, Public_Sans } from "next/font/google";
import "./globals.css";

const body = Public_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Big_Shoulders({ subsets: ["latin"], weight: "800", variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Bautista-Cayabyab Family Tree",
  description: "Printable wall genealogy of the Domingo Bautista-Pastora Cayabyab Clan",
};

import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <head>
        {/* Inline because the CSS pipeline drops @page; explicit mm because Chromium ignores "A0 landscape" here. */}
        <style>{"@page { size: 1189mm 841mm; margin: 12mm; }"}</style>
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to family tree
        </a>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
