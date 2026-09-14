import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minirifle FBI",
  description: "Registro y análisis de sesiones de tiro Minirifle FBI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#14171a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
            <TargetMark />
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-foreground">
                MINIRIFLE FBI
              </h1>
              <p className="text-[11px] text-foreground-muted">
                Registro de sesiones de tiro
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}

function TargetMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#D4AF6A" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="5.2" stroke="#D4AF6A" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.8" fill="#D4AF6A" />
    </svg>
  );
}
