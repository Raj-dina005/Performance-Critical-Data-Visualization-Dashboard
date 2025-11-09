// app/layout.tsx
'use client'; // Must be the first line

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";

// Load Geist fonts with CSS variables
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <title>Performance Dashboard</title>
        <meta
          name="description"
          content="Realtime performance-critical dashboard"
        />
        <link rel="icon" href="/next.svg" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="min-h-screen flex flex-col">{children}</div>
        <style jsx global>{`
          body {
            transition: background-color 0.3s ease, color 0.3s ease;
          }
        `}</style>
      </body>
    </html>
  );
}
