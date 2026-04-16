import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SyncProvider from "@/components/SyncProvider";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Optimización de rutas - Entregas CR",
  description: "Organizá tus rutas de entrega en Costa Rica",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Header />
        <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
          <SyncProvider>
            {children}
          </SyncProvider>
        </main>
      </body>
    </html>
  );
}
