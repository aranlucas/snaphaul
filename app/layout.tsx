import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.APP_URL || "https://snaphaul-ten.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Snaphaul — Snap a photo, get a listing that sells",
  description:
    "Turn item photos into optimized eBay, Etsy, Poshmark, and Mercari listings — title, description, tags, and price suggestions in seconds. Free, no signup.",
  openGraph: {
    title: "Snaphaul — Snap a photo, get a listing that sells",
    description:
      "Turn item photos into optimized eBay, Etsy, Poshmark, and Mercari listings in seconds. Free, no signup.",
    url: APP_URL,
    siteName: "Snaphaul",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Snaphaul — snap a photo, get a listing that sells" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snaphaul — Snap a photo, get a listing that sells",
    description:
      "Turn item photos into optimized eBay, Etsy, Poshmark, and Mercari listings in seconds. Free, no signup.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
