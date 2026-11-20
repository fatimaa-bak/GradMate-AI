import type { Metadata } from "next";
import { Cairo, Tajawal, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GradMate AI — From Idea to Graduation",
  description:
    "منصة ذكية تساعد طلاب الجامعات على تحليل أفكار مشاريع التخرج، وتنظيم فرق العمل، وتوزيع المهام، ومتابعة الإنجاز، والاستعداد للمناقشة النهائية باستخدام الذكاء الاصطناعي.",
  keywords: [
    "GradMate AI",
    "مشروع تخرج",
    "ذكاء اصطناعي",
    "graduation project",
    "AI",
    "project management",
  ],
  authors: [{ name: "GradMate AI" }],
  icons: {
    icon: "/gradmate-logo.png",
  },
  openGraph: {
    title: "GradMate AI — From Idea to Graduation",
    description:
      "منصة ذكية لإدارة مشاريع التخرج بمساعدة الذكاء الاصطناعي",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
