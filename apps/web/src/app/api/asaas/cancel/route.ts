// ============================================================
// POST /api/asaas/cancel
// Cancela a assinatura ativa da organização do usuário autenticado
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@easyfyapp/database";
import { assertAsaasConfigured } from "@/lib/asaas/client";
import { cancelSubscription } from "@/lib/asaas/subscription-service";

export async function POST() {
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

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        memberships: {
          where: { organization: { status: "ACTIVE" } },
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

    const orgId = dbUser.memberships[0].organizationId;

    await cancelSubscription({ organizationId: orgId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Asaas Cancel API]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
