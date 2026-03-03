// ============================================================
// Easyfy - Setup: Configura o webhook da Evolution API
// Endpoint de uso único (admin). Aponta a Evolution API para o Easyfy.
// Protegido pela mesma CRON_SECRET.
//
// POST /api/setup/whatsapp-webhook
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { evolutionClient } from "@/lib/evolution-client";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL não configurada." },
      { status: 500 }
    );
  }

  const webhookUrl = `${appUrl}/api/webhook/whatsapp`;

  const result = await evolutionClient.configureWebhook(webhookUrl);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, webhookUrl },
      { status: 502 }
    );
  }

  console.log(`[Setup] Webhook configurado: ${webhookUrl}`);

  return NextResponse.json({
    success: true,
    webhookUrl,
    message: "Webhook da Evolution API configurado com sucesso.",
  });
}
