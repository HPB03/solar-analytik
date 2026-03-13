import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Solar Analytik — Lohnt sich Solar für Ihr Dach?",
  description:
    "Kostenlose Solaranlage-Analyse für Hannover. KI berechnet Kosten, Ertrag und Amortisation in 2 Minuten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
