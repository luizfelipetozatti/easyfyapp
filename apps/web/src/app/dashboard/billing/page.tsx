import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@easyfyapp/database";
import { getSubscription } from "@/lib/asaas/subscription-service";
import { PLANS } from "@/lib/asaas/plans";
import { BillingCard } from "./billing-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assinatura | Easyfy",
};

export default async function BillingPage() {
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

  const org = dbUser.memberships[0].organization;
  const subscription = await getSubscription(org.id);
  const plan = PLANS[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie seu plano e informações de pagamento.
        </p>
      </div>

      <BillingCard
        subscription={subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          trialEnd: subscription.trialEnd?.toISOString() ?? null,
          canceledAt: subscription.canceledAt?.toISOString() ?? null,
        } : null}
        plan={plan}
        ownerEmail={user.email ?? dbUser.email}
      />
    </div>
  );
}
