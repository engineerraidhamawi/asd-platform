import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "\u0645\u0646\u0635\u0629 \u0627\u0644\u062a\u0646\u0645\u064a\u0637 \u0627\u0644\u0631\u0642\u0645\u064a | Digital Phenotyping Platform",
  description: "ASD Digital Phenotyping \u2014 Autism Spectrum Disorder Assessment through Digital Behavioral Analysis",
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={geistSans.variable + " " + geistMono.variable + " antialiased bg-white text-gray-900 medical-bg"} style={{ fontFamily: "'Noto Sans Arabic', 'Inter', system-ui, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}