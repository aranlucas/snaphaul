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
  title: "Snaphaul — Photos in, listing drafts out",
  description:
    "Turn item photos into editable eBay, Etsy, Poshmark, and Mercari listing drafts with titles, descriptions, tags and price suggestions. Free beta, no account needed.",
  openGraph: {
    title: "Snaphaul — Photos in, listing drafts out",
    description:
      "Turn item photos into editable marketplace listing drafts. Review, edit and copy. Free beta, no account needed.",
    url: APP_URL,
    siteName: "Snaphaul",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Snaphaul — snap a photo, get a listing that sells",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snaphaul — Photos in, listing drafts out",
    description:
      "Turn item photos into editable marketplace listing drafts. Review, edit and copy. Free beta, no account needed.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
