// ============================================================
// POST /api/asaas/webhook
// Recebe e processa todos os eventos de webhook do Asaas
// Docs: https://docs.asaas.com/docs/sobre-os-webhooks
// ============================================================

import { NextResponse } from "next/server";
import { verifyWebhookToken } from "@/lib/asaas/client";
import { syncPaymentEvent, syncSubscriptionEvent } from "@/lib/asaas/subscription-service";
import type { AsaasWebhookEvent, AsaasWebhookEventType } from "@/lib/asaas/types";

export const runtime = "nodejs";

// Eventos que alteram o estado da assinatura
const HANDLED_PAYMENT_EVENTS = new Set<AsaasWebhookEventType>([
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
]);

const HANDLED_SUBSCRIPTION_EVENTS = new Set<AsaasWebhookEventType>([
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_INACTIVATED",
]);

export async function POST(request: Request) {
  // 1. Verificar token de autenticação do Asaas
  const token = request.headers.get("asaas-access-token");
  if (!verifyWebhookToken(token)) {
    console.error("[Asaas Webhook] Invalid or missing access token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse do corpo
  let event: AsaasWebhookEvent;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { event: eventType } = event;

  // 3. Ignorar eventos não tratados
  const isHandled =
    HANDLED_PAYMENT_EVENTS.has(eventType) ||
    HANDLED_SUBSCRIPTION_EVENTS.has(eventType);

  if (!isHandled) {
    return NextResponse.json({ received: true });
  }

  // 4. Processar evento
  try {
    await handleEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[Asaas Webhook] Error handling event ${eventType}:`, err);
    // Retornar 200 para evitar que o Asaas pause a fila
    return NextResponse.json({ received: true, warning: "Handler error" });
  }
}

async function handleEvent(event: AsaasWebhookEvent): Promise<void> {
  console.log(`[Asaas Webhook] Processing: ${event.event}`);

  if (HANDLED_PAYMENT_EVENTS.has(event.event) && event.payment) {
    await syncPaymentEvent(event.payment);
    return;
  }

  if (HANDLED_SUBSCRIPTION_EVENTS.has(event.event) && event.subscription) {
    await syncSubscriptionEvent(event.subscription);
    return;
  }

  console.warn(`[Asaas Webhook] Unhandled event: ${event.event}`);
}
