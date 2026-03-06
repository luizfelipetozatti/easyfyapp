import { Button, Logo } from "@easyfyapp/ui";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PricingSection } from "@/components/pricing/pricing-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planos & Preços | Easyfy",
  description:
    "Escolha o plano ideal para o seu negócio. Comece grátis por 7 dias.",
};

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Logo className="h-10" />
          </Link>
          <nav className="flex items-center gap-4">
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

      <main className="flex-1">
        <PricingSection isAuthenticated={isAuthenticated} />

        {/* FAQ */}
        <section className="border-t bg-white py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
              Perguntas frequentes
            </h2>
            <div className="space-y-8">
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className="border-b pb-8 last:border-b-0">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    {item.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Easyfy. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    question: "Preciso de cartão de crédito para o período grátis?",
    answer:
      "Não! Você pode testar o Easyfy por 7 dias gratuitamente sem precisar cadastrar nenhum cartão. O cobrança só começa após o período de trial, caso opte por continuar.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim. Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas. Após o cancelamento, você continua com acesso até o final do período pago.",
  },
  {
    question: "Como funciona a cobrança?",
    answer:
      "A cobrança é mensal, no cartão de crédito. Após o período de 7 dias grátis, você será cobrado automaticamente todo mês no mesmo dia.",
  },
  {
    question: "Quantos agendamentos posso ter?",
    answer:
      "O plano Standard inclui agendamentos ilimitados. Não há limitação de quantas reservas sua organização pode receber por mês.",
  },
  {
    question: "O WhatsApp funciona automaticamente?",
    answer:
      "Sim! Após configurar o número do WhatsApp via Evolution API, todas as confirmações e lembretes são enviados automaticamente para seus clientes, sem nenhuma ação manual.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Totalmente. Utilizamos Supabase com PostgreSQL, infraestrutura com isolamento multi-tenant e pagamentos processados pelo Asaas, plataforma brasileira de pagamentos regulamentada pelo Banco Central.",
  },
];
