import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/bebas-neue";
import "./globals.css";

export const metadata: Metadata = {
  title: "De Groene Pijl",
  description: "De Nederlandse Fantasy Premier League Podcast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased font-body">
        {children}
      </body>
    </html>
  );
}
