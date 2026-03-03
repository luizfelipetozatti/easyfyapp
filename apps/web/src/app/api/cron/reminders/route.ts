// ============================================================
// Easyfy - Cron: Envio de Lembretes WhatsApp (24h antes)
// Executado a cada hora pela Vercel Cron.
// Busca agendamentos que ocorrem em ~24h e ainda não receberam lembrete.
// ============================================================

import { prisma } from "@easyfyapp/database";
import { NextRequest, NextResponse } from "next/server";
import { addHours, startOfHour, endOfHour } from "date-fns";
import { sendBookingReminder } from "@/lib/whatsapp";

// ============================================================
// TYPES
// ============================================================

interface ReminderResult {
  bookingId: string;
  success: boolean;
  error?: string;
}

interface CronResponse {
  processed: number;
  sent: number;
  failed: number;
  results: ReminderResult[];
}

// ============================================================
// AUTH
// ============================================================

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET não configurado.");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================================
// HANDLER
// ============================================================

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const targetTime = addHours(now, 24);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDENTE", "CONFIRMADO"] },
      startTime: {
        gte: startOfHour(targetTime),
        lte: endOfHour(targetTime),
      },
      reminderSent: false,
    },
    include: {
      service: true,
      organization: true,
    },
  });

  if (bookings.length === 0) {
    console.log("[Cron] Nenhum lembrete para enviar.");
    return NextResponse.json<CronResponse>({
      processed: 0,
      sent: 0,
      failed: 0,
      results: [],
    });
  }

  console.log(`[Cron] Processando ${bookings.length} lembrete(s)...`);

  const results = await Promise.allSettled(
    bookings.map(async (booking): Promise<ReminderResult> => {
      const result = await sendBookingReminder({
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        serviceName: booking.service.name,
        startTime: booking.startTime,
        organizationName: booking.organization.name,
        organizationId: booking.organizationId,
      });

      if (result.success) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });
      }

      return { bookingId: booking.id, ...result };
    })
  );

  const resolved = results.map((r) =>
    r.status === "fulfilled" ? r.value : { bookingId: "unknown", success: false, error: String(r.reason) }
  );

  const sent = resolved.filter((r) => r.success).length;
  const failed = resolved.filter((r) => !r.success).length;

  console.log(`[Cron] Lembretes: ${sent} enviados, ${failed} com falha.`);

  return NextResponse.json<CronResponse>({
    processed: bookings.length,
    sent,
    failed,
    results: resolved,
  });
}
