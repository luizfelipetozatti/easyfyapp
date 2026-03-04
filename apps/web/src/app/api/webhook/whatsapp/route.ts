// ============================================================
// Easyfy - Webhook para Evolution API (WhatsApp)
// Recebe eventos de mensagens e status updates.
//
// Fluxo de resposta do cliente (State Machine):
//
//  [PENDENTE]  -- SIM ------> [CONFIRMADO] (janela de confirmacao fechada)
//              -- CANCELAR -> [CANCELADO]  (janela de confirmacao fechada)
//
//  [CONFIRMADO + reminderSent + !reminderReplied]
//              -- SIM ------> [CONFIRMADO]  (reminderReplied=true)
//              -- CANCELAR -> [CANCELADO]   (reminderReplied=true)
//
//  Qualquer outra situacao -> mensagem ignorada silenciosamente.
// ============================================================

import { prisma } from "@easyfyapp/database";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { evolutionClient } from "@/lib/evolution-client";

// ============================================================
// TYPES
// ============================================================

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
  };
}

type BookingWithRelations = Awaited<ReturnType<typeof findActiveBooking>>;

type Intent = "confirm" | "cancel" | "unknown";

type ReplyWindow = "confirmation" | "reminder";

// ============================================================
// ENTRY POINT
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Nota: a Evolution API n�o envia o apikey nos webhooks de sa�da.
    // A seguran�a � garantida pela obscuridade da URL e pelo HTTPS.
    const payload: EvolutionWebhookPayload = await request.json();
    console.log(
      `[Webhook] Event: ${payload.event} | Instance: ${payload.instance}`,
      JSON.stringify(payload.data?.key)
    );

    if (payload.event === "messages.upsert") {
      await handleUpsertEvent(payload);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET para health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "easyfy-whatsapp-webhook",
    timestamp: new Date().toISOString(),
  });
}

// ============================================================
// EVENT HANDLERS
// ============================================================

async function handleUpsertEvent(payload: EvolutionWebhookPayload) {
  const { fromMe, remoteJid } = payload.data.key;
  console.log(`[Webhook] messages.upsert | fromMe: ${fromMe} | jid: ${remoteJid}`);

  // Ignora mensagens enviadas pelo pr�prio n�mero conectado
  if (fromMe || !payload.data.message) return;

  const phone = normalizePhone(remoteJid);
  const rawText =
    payload.data.message.conversation ||
    payload.data.message.extendedTextMessage?.text ||
    "";
  const text = rawText.trim().toLowerCase();

  console.log(`[Webhook] Mensagem recebida | phone: ${phone} | text: "${text}"`);

  const booking = await findActiveBooking(phone);
  if (!booking) return;

  const window = getReplyWindow(booking);
  if (!window) {
    console.log(
      `[Webhook] Booking ${booking.id} (${booking.status}) n�o tem janela de resposta aberta � mensagem ignorada`
    );
    return;
  }

  const intent = parseIntent(text);
  if (intent === "unknown") {
    console.log(
      `[Webhook] Texto n�o reconhecido ("${text}") para booking ${booking.id} � nenhuma a��o tomada`
    );
    return;
  }

  await processReply({ booking, window, intent, phone, instanceName: payload.instance });
}

// ============================================================
// STATE MACHINE
// ============================================================

/**
 * Determina qual janela de resposta est� aberta para o booking.
 *
 * - "confirmation": booking PENDENTE aguarda a primeira resposta do cliente.
 * - "reminder":     booking CONFIRMADO com lembrete enviado aguarda confirma��o final.
 * - null:           nenhuma janela aberta � mensagem deve ser ignorada.
 */
function getReplyWindow(booking: NonNullable<BookingWithRelations>): ReplyWindow | null {
  if (booking.status === "PENDENTE") {
    return "confirmation";
  }

  if (
    booking.status === "CONFIRMADO" &&
    booking.reminderSent &&
    !booking.reminderReplied
  ) {
    return "reminder";
  }

  return null;
}

/**
 * Interpreta o texto do cliente em um intent can�nico.
 */
function parseIntent(text: string): Intent {
  const confirmKeywords = ["sim", "confirmo", "ok", "confirmar", "confirmado"];
  const cancelKeywords  = ["cancelar", "cancela", "n�o", "nao"];

  if (confirmKeywords.some((kw) => text.includes(kw))) return "confirm";
  if (cancelKeywords.some((kw) => text.includes(kw)))  return "cancel";
  return "unknown";
}

// ============================================================
// REPLY PROCESSORS
// ============================================================

interface ProcessReplyParams {
  booking: NonNullable<BookingWithRelations>;
  window: ReplyWindow;
  intent: Exclude<Intent, "unknown">;
  phone: string;
  instanceName: string;
}

async function processReply({ booking, window, intent, phone, instanceName }: ProcessReplyParams) {
  console.log(`[Webhook] Processando | booking: ${booking.id} | janela: ${window} | intent: ${intent}`);

  if (intent === "confirm") {
    await handleConfirm({ booking, window, phone, instanceName });
  } else {
    await handleCancel({ booking, window, phone, instanceName });
  }

  revalidatePath("/dashboard/bookings");
}

async function handleConfirm({
  booking,
  window,
  phone,
  instanceName,
}: Omit<ProcessReplyParams, "intent">) {
  if (window === "confirmation") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMADO" },
    });
    console.log(`[Webhook] Booking ${booking.id} confirmed via WhatsApp (confirmation window)`);
  } else {
    // reminder window: j� est� CONFIRMADO, apenas fecha a janela
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderReplied: true },
    });
    console.log(`[Webhook] Booking ${booking.id} presence confirmed via WhatsApp (reminder window)`);
  }

  await evolutionClient.sendText(
    {
      number: phone,
      text: [
        `? *Agendamento confirmado!*`,
        ``,
        `Obrigado, ${booking.clientName}! Seu agendamento para *${booking.service.name}* est� confirmado.`,
        ``,
        `_${booking.organization.name}_`,
      ].join("\n"),
    },
    instanceName
  );
}

async function handleCancel({
  booking,
  window,
  phone,
  instanceName,
}: Omit<ProcessReplyParams, "intent">) {
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELADO",
      // Fecha a janela de lembrete tamb�m, se estava aberta
      ...(window === "reminder" ? { reminderReplied: true } : {}),
    },
  });
  console.log(`[Webhook] Booking ${booking.id} cancelled via WhatsApp (${window} window)`);

  await evolutionClient.sendText(
    {
      number: phone,
      text: [
        `? *Agendamento cancelado.*`,
        ``,
        `Entendido, ${booking.clientName}. Seu agendamento para *${booking.service.name}* foi cancelado.`,
        ``,
        `Se desejar reagendar, acesse nosso link de agendamento.`,
        ``,
        `_${booking.organization.name}_`,
      ].join("\n"),
    },
    instanceName
  );
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Normaliza o JID do WhatsApp para apenas d�gitos.
 * Ex.: "5511999999999@s.whatsapp.net" ? "5511999999999"
 */
function normalizePhone(jid: string): string {
  return jid
    .replace("@s.whatsapp.net", "")
    .replace("@c.us", "")
    .replace(/\D/g, "");
}

/**
 * Busca o booking ativo mais recente para um dado n�mero de telefone.
 * Tenta varia��es com/sem o d�gito 9 para cobrir a transi��o BR de 8?9 d�gitos.
 */
async function findActiveBooking(phone: string) {
  const phonesToTry = buildPhoneVariants(phone);

  console.log(`[Webhook] Buscando booking para phones: ${[...phonesToTry].join(", ")}`);

  const booking = await prisma.booking.findFirst({
    where: {
      clientPhone: { in: [...phonesToTry] },
      status: { in: ["PENDENTE", "CONFIRMADO"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      service: true,
      organization: true,
    },
  });

  if (!booking) {
    console.log(`[Webhook] Nenhum booking ativo encontrado para: ${[...phonesToTry].join(", ")}`);
  } else {
    console.log(
      `[Webhook] Booking encontrado: ${booking.id} | status: ${booking.status} | reminderSent: ${booking.reminderSent} | reminderReplied: ${booking.reminderReplied}`
    );
  }

  return booking;
}

/**
 * Gera varia��es do n�mero BR para contornar a diferen�a de 8 vs 9 d�gitos.
 * Ex.: "5511999999999" (13d) ? tamb�m tenta "551199999999" (12d) e vice-versa.
 */
function buildPhoneVariants(phone: string): Set<string> {
  const variants = new Set<string>([phone]);

  if (phone.startsWith("55") && phone.length === 12) {
    variants.add(`${phone.slice(0, 4)}9${phone.slice(4)}`);
  }

  if (phone.startsWith("55") && phone.length === 13) {
    variants.add(`${phone.slice(0, 4)}${phone.slice(5)}`);
  }

  return variants;
}
