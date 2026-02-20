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

// Re-export for convenience
export { DEFAULT_TEMPLATES, TEMPLATE_META, renderTemplate, type TemplateType };

// ============================================================
// TYPES
// ============================================================

interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  instance: string;
}

interface SendMessagePayload {
  number: string;
  text: string;
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

function getConfig(): WhatsAppConfig {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    throw new Error(
      "Missing Evolution API config: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE"
    );
  }

  return { apiUrl, apiKey, instance };
}

// ============================================================
// API Calls - Evolution API
// ============================================================

async function sendTextMessage(payload: SendMessagePayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const config = getConfig();

  try {
    const response = await fetch(
      `${config.apiUrl}/message/sendText/${config.instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey,
        },
        body: JSON.stringify({
          number: payload.number,
          options: {
            delay: 1200,
            presence: "composing",
          },
          textMessage: {
            text: payload.text,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[WhatsApp] Error sending message: ${response.status}`,
        errorBody
      );
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorBody}`,
      };
    }

    const result = await response.json();
    console.log(`[WhatsApp] Message sent to ${payload.number}`);

    return {
      success: true,
      messageId: result?.key?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[WhatsApp] Send failed:`, message);
    return { success: false, error: message };
  }
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

  const template = await resolveTemplate(data.organizationId, "CONFIRMATION");
  const text = renderTemplate(template, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: data.organizationName,
  });

  return sendTextMessage({ number: data.clientPhone, text });
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

  const template = await resolveTemplate(data.organizationId, "CANCELLATION");
  const text = renderTemplate(template, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: "",
  });

  return sendTextMessage({ number: data.clientPhone, text });
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

  const template = await resolveTemplate(data.organizationId, "REMINDER");
  const text = renderTemplate(template, {
    nome: data.clientName,
    serviço: data.serviceName,
    data: formattedDate,
    organização: data.organizationName,
  });

  return sendTextMessage({ number: data.clientPhone, text });
}
