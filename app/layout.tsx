import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "NovaCall Assistant Console",
  description:
    "Operational console for NovaCall, supporting Manohar Kumar Sah with outbound call preparation and execution."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">
        {children}
      </body>
    </html>
  );
}
