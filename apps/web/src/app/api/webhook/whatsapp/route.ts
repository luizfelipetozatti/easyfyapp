// ============================================================
// Easyfy - Webhook para Evolution API (WhatsApp)
// Recebe eventos de mensagens e status updates
// ============================================================

import { prisma } from "@easyfyapp/database";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    // Nota: a Evolution API não envia o apikey nos eventos de webhook de saída,
    // portanto não validamos o header aqui. A segurança é garantida pela
    // obscuridade da URL (não é pública) e pelo HTTPS.
    const payload: EvolutionWebhookPayload = await request.json();
    console.log(`[Webhook] Event: ${payload.event} | Instance: ${payload.instance}`, JSON.stringify(payload.data?.key));

    switch (payload.event) {
      case "messages.upsert": {
        // Mensagem recebida do cliente
        const { fromMe, remoteJid } = payload.data.key;
        console.log(`[Webhook] messages.upsert | fromMe: ${fromMe} | jid: ${remoteJid}`);

        if (!fromMe && payload.data.message) {
          const phone = remoteJid
            .replace("@s.whatsapp.net", "")
            .replace("@c.us", "")
            .replace(/\D/g, ""); // garante só dígitos

          const text =
            payload.data.message.conversation ||
            payload.data.message.extendedTextMessage?.text ||
            "";

          console.log(`[Webhook] Mensagem recebida | phone: ${phone} | text: "${text}"`);
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
  // Normaliza o telefone: remove não-dígitos e garante prefixo 55
  const normalizedPhone = phone.replace(/\D/g, "");

  // Em números brasileiros, o WhatsApp pode entregar com ou sem o 9 extra.
  // Ex.: 5511999999999 (13 dígitos) vs 551199999999 (12 dígitos — sem o 9)
  // Tentamos variações: exato, com 9 adicionado e sem 9.
  const phonesToTry = new Set<string>([normalizedPhone]);

  if (normalizedPhone.startsWith("55") && normalizedPhone.length === 12) {
    // 55 + DDD(2) + 8 dígitos → adiciona o 9 na posição correta
    phonesToTry.add(`${normalizedPhone.slice(0, 4)}9${normalizedPhone.slice(4)}`);
  }
  if (normalizedPhone.startsWith("55") && normalizedPhone.length === 13) {
    // 55 + DDD(2) + 9 + 8 dígitos → remove o 9
    const withoutNine = `${normalizedPhone.slice(0, 4)}${normalizedPhone.slice(5)}`;
    phonesToTry.add(withoutNine);
  }

  console.log(`[Webhook] Buscando booking para phones: ${[...phonesToTry].join(", ")}`);

  // Buscar booking ativo (PENDENTE ou CONFIRMADO) mais recente deste telefone.
  // Confirmação só se aplica a PENDENTE; cancelamento se aplica a ambos.
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
    console.log(`[Webhook] Nenhum booking PENDENTE encontrado para: ${[...phonesToTry].join(", ")}`);
    return;
  }

  console.log(`[Webhook] Booking encontrado: ${booking.id} | texto recebido: "${text}"`);

  // Auto-confirmar se cliente responder "sim", "confirmo", "ok"
  const confirmKeywords = ["sim", "confirmo", "ok", "confirmar", "confirmado"];
  const cancelKeywords = ["cancelar", "cancela", "não", "nao"];

  if (confirmKeywords.some((kw) => text.includes(kw))) {
    if (booking.status !== "PENDENTE") {
      console.log(`[Webhook] Booking ${booking.id} já está ${booking.status} — ignorando confirmação`);
      return;
    }
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMADO" },
    });
    revalidatePath("/dashboard/bookings");
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
    revalidatePath("/dashboard/bookings");
    console.log(`[Webhook] Booking ${booking.id} cancelled via WhatsApp`);

    // Enviar resposta de cancelamento ao cliente
    await evolutionClient.sendText(
      {
        number: phone,
        text: `❌ *Agendamento cancelado.*\n\nEntendido, ${booking.clientName}. Seu agendamento para *${booking.service.name}* foi cancelado.\n\nSe desejar reagendar, acesse nosso link de agendamento.\n\n_${booking.organization.name}_`,
      },
      instanceName
    );
  } else {
    console.log(`[Webhook] Texto não reconhecido ("${text}") para booking ${booking.id} — nenhuma ação tomada`);
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
