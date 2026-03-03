// ============================================================
// Easyfy - WhatsApp Service (Evolution API)
// ============================================================

import { prisma } from "@easyfyapp/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_META,
  renderTemplate,
  type TemplateType,
} from "@/lib/whatsapp-constants";
import { evolutionClient } from "@/lib/evolution-client";

// Re-export for convenience
export { DEFAULT_TEMPLATES, TEMPLATE_META, renderTemplate, type TemplateType };

// ============================================================
// TYPES
// ============================================================

interface SendMessagePayload {
  number: string;
  text: string;
  /** Instância da Evolution API a ser usada (per-tenant) */
  instanceName?: string;
}

export interface BookingMessageData {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startTime: Date;
  price: number;
  organizationName: string;
  /** Opcional: se fornecido, busca o template customizado da organização */
  organizationId?: string;
}

// ============================================================
// TEMPLATE ENGINE — server-side resolver
// ============================================================

/**
 * Busca o template customizado da organização no banco ou retorna o padrão.
 */
async function resolveTemplate(
  orgId: string | undefined,
  type: TemplateType
): Promise<string> {
  if (!orgId) return DEFAULT_TEMPLATES[type];

  try {
    const custom = await prisma.whatsAppTemplate.findUnique({
      where: { organizationId_type: { organizationId: orgId, type } },
    });
    return custom?.content ?? DEFAULT_TEMPLATES[type];
  } catch {
    return DEFAULT_TEMPLATES[type];
  }
}

// ============================================================
// MESSAGE BUILDERS (mantidos para compatibilidade)
// ============================================================

export function buildBookingConfirmationMessage(
  data: Omit<BookingMessageData, "clientPhone" | "price" | "organizationId">
): string {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return renderTemplate(DEFAULT_TEMPLATES.CONFIRMATION, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: data.organizationName,
  });
}

export function buildBookingCancellationMessage(
  data: Pick<BookingMessageData, "clientName" | "serviceName" | "startTime">
): string {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return renderTemplate(DEFAULT_TEMPLATES.CANCELLATION, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: "",
  });
}

export function buildBookingReminderMessage(
  data: Pick<
    BookingMessageData,
    "clientName" | "serviceName" | "startTime" | "organizationName"
  >
): string {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return renderTemplate(DEFAULT_TEMPLATES.REMINDER, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: data.organizationName,
  });
}

// ============================================================
// INSTANCE RESOLVER — busca a instância da org no banco
// ============================================================

/**
 * Retorna o nome da instância Evolution API da organização.
 * Fallback para a instância global (env var) se a org não tiver configurado.
 */
async function resolveInstance(orgId: string | undefined): Promise<string | undefined> {
  if (!orgId) {
    console.warn("[WhatsApp] resolveInstance: orgId não fornecido");
    return undefined;
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { evolutionInstance: true },
    });
    console.log(`[WhatsApp] resolveInstance: orgId=${orgId} → evolutionInstance=${org?.evolutionInstance ?? "null"}`);
    return org?.evolutionInstance ?? undefined;
  } catch (err) {
    console.error("[WhatsApp] resolveInstance: erro ao buscar org:", err);
    return undefined;
  }
}

// ============================================================
// SEND — delega ao evolutionClient
// ============================================================

async function sendTextMessage(payload: SendMessagePayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  // Org sem WhatsApp conectado — não tenta enviar
  if (!payload.instanceName) {
    console.warn(`[WhatsApp] Organização sem instância configurada. Mensagem para ${payload.number} ignorada.`);
    return { success: false, error: "Nenhuma instância WhatsApp configurada para esta organização." };
  }

  const result = await evolutionClient.sendText(
    { number: payload.number, text: payload.text },
    payload.instanceName
  );

  if (result.success) {
    console.log(`[WhatsApp] Mensagem enviada para ${payload.number} via instância: ${payload.instanceName}`);
  }

  return {
    success: result.success,
    messageId: result.data?.key?.id,
    error: result.error,
  };
}

// ============================================================
// Public API
// ============================================================

export async function sendBookingConfirmation(
  data: BookingMessageData
): Promise<{ success: boolean; error?: string }> {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const [template, instanceName] = await Promise.all([
    resolveTemplate(data.organizationId, "CONFIRMATION"),
    resolveInstance(data.organizationId),
  ]);

  const text = renderTemplate(template, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: data.organizationName,
  });

  return sendTextMessage({ number: data.clientPhone, text, instanceName });
}

export async function sendBookingCancellation(
  data: Pick<
    BookingMessageData,
    "clientName" | "clientPhone" | "serviceName" | "startTime" | "organizationId"
  >
): Promise<{ success: boolean; error?: string }> {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const [template, instanceName] = await Promise.all([
    resolveTemplate(data.organizationId, "CANCELLATION"),
    resolveInstance(data.organizationId),
  ]);

  const text = renderTemplate(template, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: "",
  });

  return sendTextMessage({ number: data.clientPhone, text, instanceName });
}

export async function sendBookingReminder(
  data: Pick<
    BookingMessageData,
    | "clientName"
    | "clientPhone"
    | "serviceName"
    | "startTime"
    | "organizationName"
    | "organizationId"
  >
): Promise<{ success: boolean; error?: string }> {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const [template, instanceName] = await Promise.all([
    resolveTemplate(data.organizationId, "REMINDER"),
    resolveInstance(data.organizationId),
  ]);

  const text = renderTemplate(template, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: data.organizationName,
  });

  return sendTextMessage({ number: data.clientPhone, text, instanceName });
}
