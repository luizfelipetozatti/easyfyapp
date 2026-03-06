// ============================================================
// POST /api/asaas/checkout
// Cria uma assinatura no Asaas e redireciona o usuário para o checkout
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { prisma } from "@easyfyapp/database";
import { assertAsaasConfigured } from "@/lib/asaas/client";
import { createCheckoutSession } from "@/lib/asaas/subscription-service";
import { getPlanById } from "@/lib/asaas/plans";

const schema = z.object({
  planId: z.string().min(1),
  cpfCnpj: z.string().min(11).max(14),
  phone: z.string().optional(),
  dueDay: z.number().int().min(1).max(28).optional(),
});

export async function POST(request: Request) {
  try {
    assertAsaasConfigured();

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, cpfCnpj, phone, dueDay } = schema.parse(body);

    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

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
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const org = dbUser.memberships[0].organization;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutUrl = await createCheckoutSession({
      organizationId: org.id,
      ownerEmail: user.email ?? dbUser.email,
      ownerName: dbUser.name ?? org.name,
      cpfCnpj,
      phone,
      dueDay,
      planId: plan.id,
      billingValue: plan.billingValue,
      billingCycle: plan.billingCycle,
      trialDays: plan.trialDays,
      successUrl: `${appUrl}/dashboard/billing/success`,
      cancelUrl: `${appUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("[Asaas Checkout API]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
