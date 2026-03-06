import { Button, Logo } from "@easyfyapp/ui";
import { Calendar, MessageCircle, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";
import { createClient } from "@/lib/supabase/server";
import { PricingSection } from "@/components/pricing/pricing-section";

export const metadata: Metadata = {
  title: "Easyfy – Agendamento online com WhatsApp automático",
  description:
    "Simplifique o agendamento da sua clínica ou coworking. Seus clientes agendam online 24/7 e recebem confirmação automática pelo WhatsApp.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Easyfy – Agendamento online com WhatsApp automático",
    description:
      "Simplifique o agendamento da sua clínica ou coworking. Seus clientes agendam online 24/7 e recebem confirmação automática pelo WhatsApp.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Easyfy",
  url: "https://easyfy.app",
  description:
    "Plataforma SaaS de agendamento online para negócios locais com confirmação automática por WhatsApp.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    description: "Grátis por 7 dias, sem cartão de crédito",
  },
  inLanguage: "pt-BR",
  publisher: {
    "@type": "Organization",
    name: "Easyfy",
    url: "https://easyfy.app",
  },
};

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  return (
    <div className="flex min-h-screen flex-col">
      <Script
        id="jsonld-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Logo className="h-10" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="ghost">Preços</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Ir para o Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button>Começar Grátis</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-navy-dark">
            Agendamento inteligente com{" "}
            <span className="text-whatsapp">WhatsApp</span> automático
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Simplifique o agendamento da sua clínica ou coworking. Seus clientes
            agendam online e recebem confirmação automática pelo WhatsApp.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Criar Conta Grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-slate-50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">
              Tudo que você precisa
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border border-surface-border bg-surface-card p-6 shadow-sm">
                <Calendar className="h-10 w-10 text-brand" />
                <h3 className="mt-4 text-xl font-semibold">
                  Agendamento Online
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Página personalizada para seus clientes agendarem 24/7, sem
                  necessidade de ligação.
                </p>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-card p-6 shadow-sm">
                <MessageCircle className="h-10 w-10 text-brand" />
                <h3 className="mt-4 text-xl font-semibold">
                  WhatsApp Automático
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Confirmação e lembretes automáticos via WhatsApp. Reduza
                  faltas em até 70%.
                </p>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-card p-6 shadow-sm">
                <Building2 className="h-10 w-10 text-brand" />
                <h3 className="mt-4 text-xl font-semibold">Multi-Negócios</h3>
                <p className="mt-2 text-muted-foreground">
                  Gerencie múltiplas unidades ou negócios em uma única
                  plataforma com isolamento total.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing */}
        <PricingSection isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Easyfy. Todos os direitos
          reservados.
        </div>
      </footer>
    </div>
  );
}
