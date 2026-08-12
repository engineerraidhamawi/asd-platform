import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "\u0645\u0646\u0635\u0629 \u0627\u0644\u062a\u0646\u0645\u064a\u0637 \u0627\u0644\u0631\u0642\u0645\u064a | Digital Phenotyping Platform",
  description: "ASD Digital Phenotyping \u2014 Autism Spectrum Disorder Assessment through Digital Behavioral Analysis",
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-white text-gray-900 medical-bg" style={{ fontFamily: "'Segoe UI', Tahoma, 'Noto Sans Arabic', system-ui, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
