import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Diary - Capture Your Thoughts",
  description: "A beautiful digital diary to capture your daily thoughts, memories, and experiences.",
  keywords: "diary, journal, personal, thoughts, memories",
  authors: [{ name: "Diary App" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
