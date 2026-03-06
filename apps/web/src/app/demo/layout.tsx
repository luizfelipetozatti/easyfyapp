import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo – Veja o Easyfy em ação",
  description:
    "Tour interativo pelo Easyfy: explore o agendamento online, o painel de controle e as notificações automáticas por WhatsApp.",
  alternates: { canonical: "/demo" },
  robots: { index: false, follow: false },
  openGraph: {
    url: "/demo",
    title: "Demo – Veja o Easyfy em ação",
    description:
      "Tour interativo pelo Easyfy: explore o agendamento online, o painel de controle e as notificações automáticas por WhatsApp.",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
