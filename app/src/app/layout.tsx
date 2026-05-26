import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bautista-Cayabyab Family Tree",
  description: "Interactive genealogy of the Domingo Bautista-Pastora Cayabyab Clan — Our Lineage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="header-inner">
            <a href="/" className="header-brand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L12 8" />
                <path d="M12 8C12 8 8 10 6 14" />
                <path d="M12 8C12 8 16 10 18 14" />
                <path d="M6 14C6 14 4 18 5 22" />
                <path d="M18 14C18 14 20 18 19 22" />
                <path d="M12 8C12 8 12 14 12 22" />
                <circle cx="12" cy="2" r="1" fill="currentColor" />
              </svg>
              <div>
                <div className="header-title">Our Lineage</div>
                <div className="header-subtitle">Bautista–Cayabyab Clan</div>
              </div>
            </a>
            <nav className="header-nav">
              <a href="/" className="active">Tree</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
