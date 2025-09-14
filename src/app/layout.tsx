import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RFP Platform - Enterprise Request for Proposal Management",
  description: "Multi-tenant enterprise-grade platform for creating, publishing, and evaluating Requests for Proposal (RFPs)",
  keywords: ["RFP", "Procurement", "Enterprise", "Request for Proposal", "Vendor Management"],
  authors: [{ name: "RFP Platform Team" }],
  openGraph: {
    title: "RFP Platform - Enterprise Procurement Solution",
    description: "Multi-tenant enterprise-grade platform for Request for Proposal management",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RFP Platform - Enterprise Procurement Solution",
    description: "Multi-tenant enterprise-grade platform for Request for Proposal management",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
