import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Panel de Administración | EnkargoRD",
  description: "Panel centralizado de operaciones de la transportadora EnkargoRD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.variable} min-h-full bg-[#F8F9FB]`}>
        {children}
      </body>
    </html>
  );
}
