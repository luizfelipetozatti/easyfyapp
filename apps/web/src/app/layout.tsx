import type { Metadata } from "next";
import { Inter, Quicksand } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://easyfy.app"
  ),
  title: {
    default: "Easyfy – Agendamento online com WhatsApp automático",
    template: "%s | Easyfy",
  },
  description:
    "Simplifique o agendamento da sua clínica ou coworking. Seus clientes agendam online 24/7 e recebem confirmação automática pelo WhatsApp.",
  keywords: [
    "agendamento online",
    "sistema de agendamento",
    "whatsapp automático",
    "agendamento clínica",
    "agendamento coworking",
    "software agendamento",
    "saas agendamento",
    "confirmação automática",
    "lembretes whatsapp",
  ],
  applicationName: "Easyfy",
  authors: [{ name: "Easyfy", url: "https://easyfy.app" }],
  creator: "Easyfy",
  publisher: "Easyfy",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Easyfy",
    title: "Easyfy – Agendamento online com WhatsApp automático",
    description:
      "Simplifique o agendamento da sua clínica ou coworking. Seus clientes agendam online 24/7 e recebem confirmação automática pelo WhatsApp.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Easyfy – Agendamento online com WhatsApp automático",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Easyfy – Agendamento online com WhatsApp automático",
    description:
      "Simplifique o agendamento da sua clínica ou coworking. Seus clientes agendam online 24/7 e recebem confirmação automática pelo WhatsApp.",
    images: ["/images/og-image.png"],
    creator: "@easyfy_app",
  },
  icons: {
    icon: [
      { url: "/images/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/images/favicon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
