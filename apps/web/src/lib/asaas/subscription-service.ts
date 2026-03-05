// ============================================================
// Easyfy - Asaas Subscription Service
// Toda a lógica de negócio relacionada a assinaturas
// ============================================================

import { prisma } from "@easyfyapp/database";
import { addDays, format } from "date-fns";
import * as asaasClient from "./client";
import type { AsaasPayment, AsaasSubscription } from "./types";

// ============================================================
// INTERFACES
// ============================================================

export interface CreateCheckoutSessionParams {
  organizationId: string;
  ownerEmail: string;
  ownerName: string;
  cpfCnpj: string;
  phone?: string;
  dueDay?: number;
  planId: string;
  billingValue: number;
  billingCycle: string;
  trialDays: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CancelSubscriptionParams {
  organizationId: string;
}

// ============================================================
// CUSTOMER
// ============================================================

/**
 * Obtém ou cria um cliente no Asaas vinculado à organização.
 */
export async function getOrCreateAsaasCustomer(
  organizationId: string,
  ownerEmail: string,
  ownerName: string,
  cpfCnpj?: string,
  phone?: string
): Promise<string> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { asaasCustomerId: true, name: true },
  });

  if (!organization) throw new Error("Organization not found");

  if (organization.asaasCustomerId) {
    // Atualiza CPF/CNPJ e telefone caso o cliente já exista (pode ter sido criado sem esses dados)
    if (cpfCnpj) {
      await asaasClient.customers.update(organization.asaasCustomerId, {
        cpfCnpj,
        ...(phone ? { mobilePhone: phone } : {}),
      });
    }
    return organization.asaasCustomerId;
  }

  // Criar cliente no Asaas
  const customer = await asaasClient.customers.create({
    name: ownerName,
    email: ownerEmail,
    cpfCnpj,
    phone,
    externalReference: organizationId,
    notificationDisabled: false,
  });

  // Persistir customerId na organização
  await prisma.organization.update({
    where: { id: organizationId },
    data: { asaasCustomerId: customer.id },
  });

  return customer.id;
}

// ============================================================
// CHECKOUT (SUBSCRIBE)
// ============================================================

/**
 * Cria uma assinatura no Asaas e retorna a URL de pagamento do primeiro boleto/PIX/cartão.
 * O usuário é redirecionado para o Asaas Checkout para concluir o pagamento.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<string> {
  const {
    organizationId,
    ownerEmail,
    ownerName,
    cpfCnpj,
    phone,
    dueDay,
    billingValue,
    billingCycle,
    trialDays,
  } = params;

  const customerId = await getOrCreateAsaasCustomer(
    organizationId,
    ownerEmail,
    ownerName,
    cpfCnpj,
    phone
  );

  // Calcular data do primeiro vencimento (após trialDays, no dia preferido)
  const trialEnd = addDays(new Date(), trialDays);

  let firstDueDate = trialEnd;
  if (dueDay && dueDay >= 1 && dueDay <= 28) {
    // Avança para o próximo mês no dia preferido se já passou do dia neste mês
    const candidate = new Date(trialEnd.getFullYear(), trialEnd.getMonth(), dueDay);
    firstDueDate = candidate > trialEnd ? candidate : new Date(trialEnd.getFullYear(), trialEnd.getMonth() + 1, dueDay);
  }

  const nextDueDate = format(firstDueDate, "yyyy-MM-dd");

  // Criar assinatura recorrente no Asaas
  const subscription = await asaasClient.subscriptions.create({
    customer: customerId,
    billingType: "UNDEFINED", // Usuário escolhe o método de pagamento
    cycle: billingCycle as import("./types").AsaasCycle,
    value: billingValue,
    nextDueDate,
    description: "Plano Standard – Easyfy",
    externalReference: organizationId,
  });

  // Salvar assinatura como TRIALING imediatamente no banco
  const now = new Date();
  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      asaasSubscriptionId: subscription.id,
      asaasCustomerId: customerId,
      billingValue,
      billingCycle,
      status: "TRIALING",
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
      trialStart: now,
      trialEnd,
    },
    update: {
      asaasSubscriptionId: subscription.id,
      asaasCustomerId: customerId,
      billingValue,
      billingCycle,
      status: "TRIALING",
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
      trialStart: now,
      trialEnd,
      canceledAt: null,
    },
  });

  // Buscar o primeiro pagamento pendente para obter a URL de checkout
  const payments = await asaasClient.payments.listBySubscription(subscription.id);
  const firstPayment = payments.data[0];

  if (firstPayment?.invoiceUrl) {
    return firstPayment.invoiceUrl;
  }

  // Fallback: redirecionar para página de sucesso se não houver URL
  // (pode acontecer quando o externalReference/URL não está disponível imediatamente)
  return params.successUrl;
}

// ============================================================
// CANCEL SUBSCRIPTION
// ============================================================

/**
 * Cancela a assinatura de uma organização no Asaas e atualiza o banco de dados.
 */
export async function cancelSubscription(
  params: CancelSubscriptionParams
): Promise<void> {
  const { organizationId } = params;

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { asaasSubscriptionId: true },
  });

  if (!subscription?.asaasSubscriptionId) {
    throw new Error("No active subscription found for this organization");
  }

  // Cancelar no Asaas
  await asaasClient.subscriptions.cancel(subscription.asaasSubscriptionId);

  // Atualizar status no banco
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
    },
  });
}

// ============================================================
// SYNC FROM WEBHOOK
// ============================================================

/**
 * Sincroniza o status da assinatura a partir dos dados de pagamento recebidos via webhook.
 */
export async function syncPaymentEvent(payment: AsaasPayment): Promise<void> {
  // Descobrir organizationId via externalReference ou customerId
  const organizationId = await resolveOrganizationId(
    payment.externalReference,
    payment.customer
  );

  if (!organizationId) {
    console.warn("[Asaas Webhook] Cannot resolve organizationId for payment", payment.id);
    return;
  }

  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
    CONFIRMED: "ACTIVE",
    RECEIVED: "ACTIVE",
    OVERDUE: "PAST_DUE",
    DELETED: "CANCELED",
    REFUNDED: "CANCELED",
  };

  const newStatus = statusMap[payment.status];
  if (!newStatus) return; // Eventos intermediários que não alteram o status

  const dueDate = new Date(payment.dueDate);
  // O próximo período termina 1 ciclo após o vencimento (aproximado com 30 dias para MONTHLY)
  const nextPeriodEnd = addDays(dueDate, 30);

  await prisma.subscription.updateMany({
    where: { organizationId },
    data: {
      status: newStatus,
      currentPeriodStart: dueDate,
      currentPeriodEnd: nextPeriodEnd,
      ...(newStatus === "CANCELED" && { canceledAt: new Date() }),
    },
  });
}

/**
 * Sincroniza o status da assinatura a partir dos dados de assinatura recebidos via webhook.
 */
export async function syncSubscriptionEvent(
  subscription: AsaasSubscription
): Promise<void> {
  const organizationId = await resolveOrganizationId(
    subscription.externalReference,
    subscription.customer
  );

  if (!organizationId) {
    console.warn("[Asaas Webhook] Cannot resolve organizationId for subscription", subscription.id);
    return;
  }

  const statusMap: Record<AsaasSubscription["status"], "ACTIVE" | "PAUSED" | "CANCELED"> = {
    ACTIVE: "ACTIVE",
    INACTIVE: "CANCELED", // Asaas usa INACTIVE para assinaturas canceladas
    EXPIRED: "CANCELED",
  };

  const newStatus = statusMap[subscription.status] ?? "CANCELED";

  await prisma.subscription.updateMany({
    where: { organizationId },
    data: {
      asaasSubscriptionId: subscription.id,
      status: newStatus,
      ...(newStatus === "CANCELED" && { canceledAt: new Date() }),
    },
  });
}

// ============================================================
// QUERY HELPERS
// ============================================================

/**
 * Verifica se uma organização tem assinatura ativa ou em trial.
 */
export async function hasActiveSubscription(
  organizationId: string
): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { status: true },
  });

  return (
    subscription?.status === "ACTIVE" || subscription?.status === "TRIALING"
  );
}

/**
 * Retorna os dados completos da assinatura de uma organização.
 */
export async function getSubscription(organizationId: string) {
  return prisma.subscription.findUnique({ where: { organizationId } });
}

// ============================================================
// PRIVATE HELPERS
// ============================================================

async function resolveOrganizationId(
  externalReference: string | undefined,
  asaasCustomerId: string
): Promise<string | null> {
  // 1. Via externalReference (mais confiável — definido na criação)
  if (externalReference) {
    const org = await prisma.organization.findUnique({
      where: { id: externalReference },
      select: { id: true },
    });
    if (org) return org.id;
  }

  // 2. Fallback: via asaasCustomerId
  const org = await prisma.organization.findUnique({
    where: { asaasCustomerId },
    select: { id: true },
  });

  return org?.id ?? null;
}
