// ============================================================
// /reactivate — Página de reativação de assinatura
// Exibida quando a assinatura está CANCELED ou PAUSED
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Zap, ArrowRight, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getActivePlan, formatPrice } from "@/lib/asaas/plans";
import { signOut } from "@/app/actions/auth";

export default async function ReactivatePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = getActivePlan();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      {/* Card principal */}
      <div className="w-full max-w-md">
        {/* Logo / header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
            <Zap className="h-8 w-8 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sua assinatura foi encerrada
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para continuar usando o Easyfy, reative seu plano abaixo.
          </p>
        </div>

        {/* Plano */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Header do plano */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Plano
              </p>
              <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
            </div>
            {plan.badge && (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                {plan.badge}
              </span>
            )}
          </div>

          {/* Preço */}
          <div className="mb-5 rounded-xl bg-gray-50 p-4">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(plan.priceMonthly)}
              </span>
              <span className="mb-1 text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="mt-1 text-sm font-medium text-violet-600">
              {plan.trialDays} dias grátis · sem cobrança agora
            </p>
          </div>

          {/* Features */}
          <ul className="mb-6 space-y-2">
            {plan.features
              .filter((f) => f.included)
              .map((feature) => (
                <li
                  key={feature.text}
                  className="flex items-center gap-2.5 text-sm text-gray-700"
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-violet-500" />
                  {feature.text}
                </li>
              ))}
          </ul>

          {/* CTA */}
          <Link
            href={`/dashboard/checkout?planId=${plan.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Reassinar agora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Dúvidas? Entre em contato com nosso suporte.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair da conta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
