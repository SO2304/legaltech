import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlashJuris - Plateforme Divorce Multi-juridictions",
  description: "Analyse automatisée de dossiers de divorce pour la France, Belgique, Suisse et Luxembourg via IA.",
  keywords: ["Divorce", "LegalTech", "Analyse Dossier", "IA Juridique", "France", "Belgique", "Suisse", "Luxembourg"],
  authors: [{ name: "LegalTech Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FlashJuris - Divorce Intelligent",
    description: "Simplifiez votre procédure de divorce avec l'intelligence artificielle.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
