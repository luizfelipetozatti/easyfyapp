// ============================================================
// AgendaZap - WhatsApp Service (Evolution API)
// ============================================================

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  instance: string;
}

interface SendMessagePayload {
  number: string;
  text: string;
}

interface BookingMessageData {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startTime: Date;
  price: number;
  organizationName: string;
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
// Templates de mensagens
// ============================================================

export function buildBookingConfirmationMessage(
  data: BookingMessageData
): string {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const priceFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(data.price);

  return [
    `Olá ${data.clientName}! 👋`,
    ``,
    `Seu agendamento para *${data.serviceName}* na data *${formattedDate}* foi recebido!`,
    ``,
    `📍 *${data.organizationName}*`,
    data.price > 0
      ? `💰 Valor: ${priceFormatted}`
      : `✅ Serviço gratuito`,
    ``,
    data.price > 0
      ? `Pague o PIX para confirmar sua reserva. Você receberá os dados de pagamento em seguida.`
      : `Seu agendamento está confirmado!`,
    ``,
    `Caso precise cancelar ou reagendar, entre em contato conosco.`,
    ``,
    `_Mensagem automática - AgendaZap_`,
  ].join("\n");
}

export function buildBookingCancellationMessage(
  data: Pick<BookingMessageData, "clientName" | "serviceName" | "startTime">
): string {
  const formattedDate = format(data.startTime, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return [
    `Olá ${data.clientName},`,
    ``,
    `Informamos que seu agendamento para *${data.serviceName}* em *${formattedDate}* foi *cancelado*.`,
    ``,
    `Se desejar reagendar, acesse nosso link de agendamento.`,
    ``,
    `_Mensagem automática - AgendaZap_`,
  ].join("\n");
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

  return [
    `Lembrete: Olá ${data.clientName}! 🔔`,
    ``,
    `Sua consulta/reserva para *${data.serviceName}* é amanhã, *${formattedDate}*.`,
    ``,
    `📍 *${data.organizationName}*`,
    ``,
    `Confirme sua presença respondendo esta mensagem.`,
    ``,
    `_Mensagem automática - AgendaZap_`,
  ].join("\n");
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
    const message =
      error instanceof Error ? error.message : "Unknown error";
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
  const text = buildBookingConfirmationMessage(data);

  return sendTextMessage({
    number: data.clientPhone,
    text,
  });
}

export async function sendBookingCancellation(
  data: Pick<BookingMessageData, "clientName" | "clientPhone" | "serviceName" | "startTime">
): Promise<{ success: boolean; error?: string }> {
  const text = buildBookingCancellationMessage(data);

  return sendTextMessage({
    number: data.clientPhone,
    text,
  });
}

export async function sendBookingReminder(
  data: Pick<
    BookingMessageData,
    "clientName" | "clientPhone" | "serviceName" | "startTime" | "organizationName"
  >
): Promise<{ success: boolean; error?: string }> {
  const text = buildBookingReminderMessage(data);

  return sendTextMessage({
    number: data.clientPhone,
    text,
  });
}
