import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/providers/AuthProvider";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "EnkargoRD - Envíos y Logística Express",
  description: "Plataforma de envíos y logística en República Dominicana",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EnkargoRD",
  },
};

export const viewport: Viewport = {
  themeColor: "#d3121a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} min-h-full bg-[#F8F9FB]`}>
        <AuthProvider>
          <PwaInstallPrompt />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
