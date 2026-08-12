import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "\u0645\u0646\u0635\u0629 \u0627\u0644\u062a\u0646\u0645\u064a\u0637 \u0627\u0644\u0631\u0642\u0645\u064a | Digital Phenotyping Platform",
  description: "ASD Digital Phenotyping \u2014 Autism Spectrum Disorder Assessment through Digital Behavioral Analysis",
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={cairo.variable + " " + inter.variable + " antialiased bg-white text-gray-900 medical-bg"} style={{ fontFamily: "'Cairo', 'Inter', system-ui, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
