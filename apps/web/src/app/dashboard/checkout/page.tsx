// ============================================================
// Easyfy - Checkout Page
// Página de checkout: coleta dados antes de ir ao Asaas
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@easyfyapp/database";
import { PLANS } from "@/lib/asaas/plans";
import { CheckoutForm } from "./checkout-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Easyfy",
};

interface CheckoutPageProps {
  searchParams: { planId?: string };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      memberships: {
        where: { organization: { status: "ACTIVE" } },
        include: { organization: true },
        take: 1,
      },
    },
  });

  if (!dbUser || dbUser.memberships.length === 0) {
    redirect("/setup");
  }

  const planId = searchParams.planId ?? PLANS[0].id;
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finalizar assinatura</h1>
        <p className="mt-1 text-muted-foreground">
          Preencha seus dados para ativar o plano com {plan.trialDays} dias grátis.
        </p>
      </div>

      <CheckoutForm
        plan={plan}
        ownerName={dbUser.name ?? user.email ?? ""}
        ownerEmail={user.email ?? dbUser.email}
      />
    </div>
  );
}
