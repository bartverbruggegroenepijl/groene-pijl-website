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
  title: "De Groene Pijl — De Nederlandse FPL Podcast",
  description: "Wekelijkse analyse, captain picks, kooptips en breaking FPL nieuws. De enige Nederlandse Fantasy Premier League podcast.",
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
