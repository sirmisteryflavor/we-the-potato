import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "We The Potato - 2026 NYC Primary Voter Guide",
  description: "Know your ballot. Make your choice. Share your voice. Non-partisan voter guide for the 2026 primaries.",
  keywords: ["voting", "ballot", "election", "2026", "NYC", "primary", "voter guide"],
  openGraph: {
    title: "We The Potato - 2026 NYC Primary Voter Guide",
    description: "Know your ballot. Make your choice. Share your voice.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
