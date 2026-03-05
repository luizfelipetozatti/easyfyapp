// ============================================================
// GET /api/asaas/payment-status
// Retorna o status atual da assinatura da organização do usuário
// Usado pelo polling do checkout para detectar confirmação de pagamento
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@easyfyapp/database";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        user: { supabaseId: user.id },
      },
      include: {
        organization: {
          select: {
            subscription: {
              select: { status: true },
            },
          },
        },
      },
    });

    const status = member?.organization?.subscription?.status ?? null;

    return NextResponse.json({ status });
  } catch (err) {
    console.error("[payment-status] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
