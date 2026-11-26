import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DocuTrack HEI - Academic Document Tracking System",
  description: "A comprehensive academic document tracking and routing system for Philippine higher education institutions.",
  keywords: ["document tracking", "academic", "university", "HEI", "Philippines", "registrar", "workflow"],
  authors: [{ name: "DocuTrack HEI Team" }],
  creator: "DocuTrack HEI",
  publisher: "DocuTrack HEI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://docytrack-hei.vercel.app",
    siteName: "DocuTrack HEI",
    title: "DocuTrack HEI - Academic Document Tracking System",
    description: "A comprehensive academic document tracking and routing system for Philippine higher education institutions.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocuTrack HEI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocuTrack HEI",
    description: "Academic Document Tracking System for Philippine HEIs",
    images: ["/og-image.png"],
  },
  verification: {
    other: {
      "google-site-verification": "google-site-verification-code",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <Toaster />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}