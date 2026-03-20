// De Groene Pijl — Next.js root layout
import type { Metadata } from "next";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/bebas-neue";
import "./globals.css";

export const metadata: Metadata = {
  title: "De Groene Pijl — FPL Praat",
  description: "De Groene Pijl — FPL Praat",
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased bg-background-dark text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
