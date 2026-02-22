import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Writing Gym",
  description: "Train your feel for writing. Read, rewrite, twist, and listen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
