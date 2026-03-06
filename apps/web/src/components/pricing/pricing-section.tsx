import { Shield, CreditCard, RefreshCcw } from "lucide-react";
import { PLANS } from "@/lib/asaas/plans";
import { PricingCard } from "./pricing-card";

interface PricingSectionProps {
  isAuthenticated?: boolean;
}

export function PricingSection({ isAuthenticated = false }: PricingSectionProps) {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-violet-50/30 to-slate-50" />
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-100/40 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-violet-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-700">
            Planos & Preços
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
            Simples, transparente e{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              acessível
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Um único plano completo para transformar a gestão de agendamentos do
            seu negócio.
          </p>
        </div>

        {/* Plans grid */}
        <div className="mx-auto max-w-md">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-violet-500" />
            <span>Pagamento 100% seguro</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <CreditCard className="h-5 w-5 text-violet-500" />
            <span>PIX, cartão ou boleto</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <RefreshCcw className="h-5 w-5 text-violet-500" />
            <span>7 dias grátis para testar</span>
          </div>
        </div>
      </div>
    </section>
  );
}
