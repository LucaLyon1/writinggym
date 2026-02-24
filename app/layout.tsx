import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
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
        <Script
          id="cookieyes"
          type="text/javascript"
          src="https://cdn-cookieyes.com/client_data/89f12ea21621052ee39f69acc448847c/script.js"
          strategy="afterInteractive"
        />
        <Script
          defer
          data-website-id="dfid_IBYj6a8XOWT1aRRW4PExx"
          data-domain="proselab.io"
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
        />
        <Script
          defer
          data-website-id="51d4b355-7309-41fd-84c5-cd2218b76b82"
          src="https://cloud.umami.is/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
