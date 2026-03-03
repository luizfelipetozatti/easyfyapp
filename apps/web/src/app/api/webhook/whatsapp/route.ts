// ============================================================
// Easyfy - Webhook para Evolution API (WhatsApp)
// Recebe eventos de mensagens e status updates
// ============================================================

import { prisma } from "@easyfyapp/database";
import { NextRequest, NextResponse } from "next/server";
import { evolutionClient } from "@/lib/evolution-client";

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
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType?: string;
    status?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validar API key no header
    const apiKey = request.headers.get("apikey");
    if (apiKey !== process.env.EVOLUTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: EvolutionWebhookPayload = await request.json();
    console.log(`[Webhook] Event: ${payload.event}`, JSON.stringify(payload.data?.key));

    switch (payload.event) {
      case "messages.upsert": {
        // Mensagem recebida do cliente
        if (!payload.data.key.fromMe && payload.data.message) {
          const phone = payload.data.key.remoteJid.replace("@s.whatsapp.net", "");
          const text =
            payload.data.message.conversation ||
            payload.data.message.extendedTextMessage?.text ||
            "";

          await handleIncomingMessage(phone, text.trim().toLowerCase(), payload.instance);
        }
        break;
      }

      case "messages.update": {
        // Status update (delivered, read, etc.)
        console.log(`[Webhook] Message status updated`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${payload.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handler para mensagens recebidas
async function handleIncomingMessage(phone: string, text: string, instanceName: string) {
  // Buscar booking pendente mais recente deste telefone
  const booking = await prisma.booking.findFirst({
    where: {
      clientPhone: phone,
      status: "PENDENTE",
    },
    orderBy: { createdAt: "desc" },
    include: {
      service: true,
      organization: true,
    },
  });

  if (!booking) {
    console.log(`[Webhook] No pending booking for phone: ${phone}`);
    return;
  }

  // Auto-confirmar se cliente responder "sim", "confirmo", "ok"
  const confirmKeywords = ["sim", "confirmo", "ok", "confirmar", "confirmado"];
  const cancelKeywords = ["cancelar", "cancela", "não", "nao"];

  if (confirmKeywords.some((kw) => text.includes(kw))) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMADO" },
    });
    console.log(`[Webhook] Booking ${booking.id} confirmed via WhatsApp`);

    // Enviar resposta de confirmação ao cliente
    await evolutionClient.sendText(
      {
        number: phone,
        text: `✅ *Agendamento confirmado!*\n\nObrigado, ${booking.clientName}! Seu agendamento para *${booking.service.name}* foi confirmado.\n\n_${booking.organization.name}_`,
      },
      instanceName
    );
  } else if (cancelKeywords.some((kw) => text.includes(kw))) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELADO" },
    });
    console.log(`[Webhook] Booking ${booking.id} cancelled via WhatsApp`);

    // Enviar resposta de cancelamento ao cliente
    await evolutionClient.sendText(
      {
        number: phone,
        text: `❌ *Agendamento cancelado.*\n\nEntendido, ${booking.clientName}. Seu agendamento para *${booking.service.name}* foi cancelado.\n\nSe desejar reagendar, acesse nosso link de agendamento.\n\n_${booking.organization.name}_`,
      },
      instanceName
    );
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
