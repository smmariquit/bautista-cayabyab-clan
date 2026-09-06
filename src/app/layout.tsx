// src/app/layout.tsx

import type { Metadata } from "next";
import { Public_Sans, Young_Serif } from "next/font/google";
import "./globals.css";

const body = Public_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Young_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });

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
        {/* Kept inline: the CSS pipeline drops top-level @page rules. */}
        <style>{"@page { size: A0 landscape; margin: 12mm; }"}</style>
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
