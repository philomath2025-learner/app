import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuranLingo — Learn Every Quranic Root",
  description:
    "Gamified Quran vocabulary learning powered by root-aware deduplication and spaced repetition. Teaches every vocabulary root exactly once at its first canonical appearance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
