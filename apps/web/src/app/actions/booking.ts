"use server";

// ============================================================
// AgendaZap - Server Actions para Bookings
// ============================================================

import { prisma } from "@agendazap/database";
import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

import { createBookingSchema, type CreateBookingInput } from "@/lib/validations";
import { sendBookingConfirmation, sendBookingCancellation } from "@/lib/whatsapp";

// ============================================================
// Criar Booking + Disparo WhatsApp
// ============================================================

export async function createBookingAction(input: CreateBookingInput) {
  // 1. Validar input
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    // 2. Buscar serviço para calcular end_time
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      include: { organization: true },
    });

    if (!service) {
      return { success: false as const, error: "Serviço não encontrado" };
    }

    if (service.organizationId !== data.organizationId) {
      return { success: false as const, error: "Serviço não pertence a esta organização" };
    }

    // 3. Verificar conflitos de horário
    const startTime = new Date(data.startTime);
    const endTime = addMinutes(startTime, service.durationMinutes);

    const conflict = await prisma.booking.findFirst({
      where: {
        organizationId: data.organizationId,
        status: { in: ["PENDENTE", "CONFIRMADO"] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    if (conflict) {
      return {
        success: false as const,
        error: "Este horário já está ocupado. Por favor, escolha outro.",
      };
    }

    // 4. Criar booking
    const booking = await prisma.booking.create({
      data: {
        organizationId: data.organizationId,
        serviceId: data.serviceId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail || null,
        startTime,
        endTime,
        status: "PENDENTE",
        notes: data.notes || null,
      },
      include: {
        service: true,
        organization: true,
      },
    });

    // 5. Disparar WhatsApp (fire-and-forget, não bloqueia)
    sendBookingConfirmation({
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      serviceName: booking.service.name,
      startTime: booking.startTime,
      price: Number(booking.service.price),
      organizationName: booking.organization.name,
    })
      .then(async (result) => {
        // Atualizar flag no banco
        if (result.success) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { whatsappSent: true },
          });
        }
      })
      .catch((err) => {
        console.error("[Booking] WhatsApp send error:", err);
      });

    revalidatePath(`/dashboard/bookings`);

    return {
      success: true as const,
      booking: {
        id: booking.id,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
      },
    };
  } catch (error) {
    console.error("[createBookingAction] Error:", error);
    return {
      success: false as const,
      error: "Erro interno ao criar agendamento",
    };
  }
}

// ============================================================
// Atualizar Status do Booking
// ============================================================

export async function updateBookingStatusAction(
  bookingId: string,
  status: "CONFIRMADO" | "CANCELADO" | "CONCLUIDO"
) {
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        service: true,
        organization: true,
      },
    });

    // Enviar notificação de cancelamento via WhatsApp
    if (status === "CANCELADO") {
      sendBookingCancellation({
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        serviceName: booking.service.name,
        startTime: booking.startTime,
      }).catch((err) => {
        console.error("[Booking] Cancel WhatsApp error:", err);
      });
    }

    revalidatePath(`/dashboard/bookings`);

    return { success: true as const };
  } catch (error) {
    console.error("[updateBookingStatusAction] Error:", error);
    return { success: false as const, error: "Erro ao atualizar status" };
  }
}

// ============================================================
// Buscar horários disponíveis
// ============================================================

export async function getAvailableSlotsAction(
  organizationId: string,
  serviceId: string,
  date: string // YYYY-MM-DD
) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { success: false as const, error: "Serviço não encontrado" };
    }

    // Horário de funcionamento (configurável futuramente)
    const startHour = 8;
    const endHour = 18;
    const durationMinutes = service.durationMinutes;

    // Gerar todos os slots possíveis
    const slots: string[] = [];
    const baseDate = new Date(`${date}T00:00:00`);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += durationMinutes) {
        const slotStart = new Date(baseDate);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = addMinutes(slotStart, durationMinutes);

        // Não ultrapassar horário de funcionamento
        const limitEnd = new Date(baseDate);
        limitEnd.setHours(endHour, 0, 0, 0);
        if (slotEnd > limitEnd) continue;

        slots.push(slotStart.toISOString());
      }
    }

    // Buscar bookings existentes do dia
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const existingBookings = await prisma.booking.findMany({
      where: {
        organizationId,
        status: { in: ["PENDENTE", "CONFIRMADO"] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Filtrar slots ocupados
    const availableSlots = slots.filter((slotIso) => {
      const slotStart = new Date(slotIso);
      const slotEnd = addMinutes(slotStart, durationMinutes);

      return !existingBookings.some((booking: { startTime: Date; endTime: Date }) => {
        return slotStart < booking.endTime && slotEnd > booking.startTime;
      });
    });

    return {
      success: true as const,
      slots: availableSlots,
      duration: durationMinutes,
    };
  } catch (error) {
    console.error("[getAvailableSlotsAction] Error:", error);
    return { success: false as const, error: "Erro ao buscar horários" };
  }
}
