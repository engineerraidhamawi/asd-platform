import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const notoArabic = Noto_Sans_Arabic({ variable: "--font-noto-arabic", subsets: ["arabic"], display: "swap" });

export const metadata: Metadata = {
  title: "\u0645\u0646\u0635\u0629 \u0627\u0644\u062a\u0646\u0645\u064a\u0637 \u0627\u0644\u0631\u0642\u0645\u064a | Digital Phenotyping Platform",
  description: "ASD Digital Phenotyping \u2014 Autism Spectrum Disorder Assessment through Digital Behavioral Analysis",
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={inter.variable + " " + notoArabic.variable + " antialiased bg-white text-gray-900 medical-bg"} style={{ fontFamily: "var(--font-noto-arabic), var(--font-inter), system-ui, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
