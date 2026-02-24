import type { Metadata } from "next";
import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthNav } from "@/components/auth/AuthNav";

// Import Cormorant Garamond font from Google Fonts (local or CDN)
import { Cormorant_Garamond } from "next/font/google";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProseLab",
  description:
    "Train your voice. Study passages with AI craft analysis, write your own version, get feedback, and track your progress.",
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${GeistMono.variable} ${cormorantGaramond.variable}`}>
      <body>
        <header className="auth-header">
          <Link href="/" className="auth-header-logo">
            <span style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}>
              Proselab
            </span>
          </Link>
          <AuthNav />
        </header>
        {children}
      </body>
    </html>
  );
}
