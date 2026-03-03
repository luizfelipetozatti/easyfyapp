import type { Metadata } from "next";
import { Inter, Quicksand } from "next/font/google";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: "Easyfy - Agendamento com WhatsApp",
  description:
    "Plataforma de agendamento para negócios locais com automação de WhatsApp",
  keywords: ["agendamento", "whatsapp", "clínica", "coworking", "saas"],
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${quicksand.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}
