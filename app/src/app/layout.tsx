import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bautista-Cayabyab Family Tree",
  description: "Interactive genealogy of the Domingo Bautista-Pastora Cayabyab Clan — Our Lineage",
};

import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

