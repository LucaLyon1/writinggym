import type { Metadata } from "next";
import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthNav } from "@/components/auth/AuthNav";

export const metadata: Metadata = {
  title: "Proselab",
  description:
    "Train your voice. Study passages with AI craft analysis, write your own version, get feedback, and track your progress.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${GeistMono.variable}`}>
      <body>
        <header className="auth-header">
          <Link href="/" className="auth-header-logo">
            Proselab
          </Link>
          <AuthNav />
        </header>
        {children}
      </body>
    </html>
  );
}
