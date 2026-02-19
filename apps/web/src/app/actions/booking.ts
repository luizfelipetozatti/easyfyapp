"use server";

// ============================================================
// Easyfy - Server Actions para Bookings
// ============================================================

import { prisma } from "@easyfyapp/database";
import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

// Mapeamento entre índice JS (Date.getDay()) e enum DayOfWeek do Prisma
const JS_DAY_TO_ENUM: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

// ============================================================
// HELPER: Extrair informações do dia (WorkingHours, BreakTime, format)
// ============================================================

async function getDayAvailabilityInfo(organizationId: string, date: string) {
  const [year, month, day] = date.split("-").map(Number);
  // Usar UTC noon para garantir o dia correto independente de timezone do servidor
  const dayIndex = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)).getUTCDay();
  const dayEnum = JS_DAY_TO_ENUM[dayIndex];

  const [workingHours, breakTime, unavailableDay] = await Promise.all([
    prisma.workingHours.findUnique({
      where: {
        organizationId_dayOfWeek: {
          organizationId,
          dayOfWeek: dayEnum as any,
        },
      },
    }),
    prisma.breakTime.findFirst({ where: { organizationId } }),
    // UnavailableDay é @db.Date (UTC midnight) — buscar com UTC midnight
    prisma.unavailableDay.findFirst({
      where: {
        organizationId,
        date: new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)),
      },
    }),
  ]);

  return { workingHours, breakTime, unavailableDay, dayEnum };
}

// ============================================================
// HELPER: Gerar slots disponíveis para um dia
// ============================================================

interface GenerateSlotsParams {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  workingHours: { startTime: string; endTime: string } | null;
  breakTime: { startTime: string; endTime: string } | null;
}

function generateDaySlots(params: GenerateSlotsParams): string[] {
  const { date, durationMinutes, workingHours, breakTime } = params;

  if (!workingHours || !workingHours.startTime) return [];

  const [startHour, startMin] = workingHours.startTime.split(":").map(Number);
  const [endHour, endMin] = workingHours.endTime.split(":").map(Number);

  // Usar Date.UTC para que os horários de trabalho sejam interpretados como
  // horários nominais independentes de timezone do servidor.
  // Isso garante que "14:00" sempre gera o mesmo timestamp UTC em qualquer ambiente.
  const [year, month, day] = date.split("-").map(Number);
  const workEnd = new Date(Date.UTC(year, month - 1, day, endHour, endMin, 0, 0));

  // Intervalo/pausa configurado
  let breakStart: Date | null = null;
  let breakEnd: Date | null = null;
  if (breakTime) {
    const [bsh, bsm] = breakTime.startTime.split(":").map(Number);
    const [beh, bem] = breakTime.endTime.split(":").map(Number);
    breakStart = new Date(Date.UTC(year, month - 1, day, bsh, bsm, 0, 0));
    breakEnd = new Date(Date.UTC(year, month - 1, day, beh, bem, 0, 0));
  }

  // Gerar todos os slots possíveis
  const slots: string[] = [];
  const cursor = new Date(Date.UTC(year, month - 1, day, startHour, startMin, 0, 0));

  while (cursor < workEnd) {
    const slotStart = new Date(cursor);
    const slotEnd = addMinutes(slotStart, durationMinutes);

    if (slotEnd > workEnd) break;

    // Não sobrepõe intervalo de pausa
    const overlapBreak =
      breakStart &&
      breakEnd &&
      slotStart < breakEnd &&
      slotEnd > breakStart;

    if (!overlapBreak) {
      slots.push(slotStart.toISOString());
    }

    cursor.setTime(addMinutes(cursor, durationMinutes).getTime());
  }

  return slots;
}

import { createBookingSchema, type CreateBookingInput } from "@/lib/validations";
import { sendBookingConfirmation, sendBookingCancellation } from "@/lib/whatsapp";

// ============================================================
// HELPER: Recalcular e atualizar cache de dia lotado (FullyBookedDay)
// Chamado após cada criação/cancelamento de booking.
// ============================================================

async function refreshFullyBookedStatus(
  organizationId: string,
  serviceId: string,
  date: string // YYYY-MM-DD
) {
  try {
    // Buscar duração do serviço
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { durationMinutes: true },
    });
    if (!service) return;

    // Buscar info do dia
    const { workingHours, breakTime, unavailableDay } =
      await getDayAvailabilityInfo(organizationId, date);

    // Se dia não é de trabalho ou está bloqueado → remover cache se existir
    if (!workingHours?.isWorking || unavailableDay) {
      await prisma.fullyBookedDay.deleteMany({
        where: { organizationId, serviceId, date: parseDateLocal(date) },
      });
      return;
    }

    // Gerar todos os slots possíveis
    const allSlots = generateDaySlots({
      date,
      durationMinutes: service.durationMinutes,
      workingHours,
      breakTime,
    });

    if (allSlots.length === 0) return;

    // Buscar bookings ativos do dia - usar janela UTC
    const [year, month, day] = date.split("-").map(Number);
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const dayBookings = await prisma.booking.findMany({
      where: {
        organizationId,
        status: { in: ["PENDENTE", "CONFIRMADO"] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    // Contar slots livres
    const freeSlots = allSlots.filter((slotIso) => {
      const slotStart = new Date(slotIso);
      const slotEnd = addMinutes(slotStart, service.durationMinutes);
      return !dayBookings.some(
        (b) => slotStart < b.endTime && slotEnd > b.startTime
      );
    });

    const dateValue = parseDateLocal(date);

    if (freeSlots.length === 0) {
      // Dia lotado → upsert no cache
      await prisma.fullyBookedDay.upsert({
        where: {
          organizationId_serviceId_date: {
            organizationId,
            serviceId,
            date: dateValue,
          },
        },
        create: { organizationId, serviceId, date: dateValue },
        update: {}, // já existe, nada a atualizar
      });
    } else {
      // Dia tem vagas → remover cache se existir
      await prisma.fullyBookedDay.deleteMany({
        where: { organizationId, serviceId, date: dateValue },
      });
    }
  } catch (error) {
    // Erro de cache não deve bloquear o fluxo principal
    console.error("[refreshFullyBookedStatus] Error:", error);
  }
}

/** Converte "YYYY-MM-DD" em Date UTC midnight (compatível com @db.Date do Prisma) */
function parseDateLocal(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

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

    // 6. Atualizar cache de dia lotado (fire-and-forget)
    // Usar getUTC* pois startTime é sempre UTC
    const bookingDateStr = `${startTime.getUTCFullYear()}-${String(startTime.getUTCMonth() + 1).padStart(2, "0")}-${String(startTime.getUTCDate()).padStart(2, "0")}`;
    refreshFullyBookedStatus(data.organizationId, data.serviceId, bookingDateStr);

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

    // Recalcular cache de dia lotado para cancelamentos/conclusões
    // (libera vagas quando um booking é cancelado ou concluído)
    if (status === "CANCELADO" || status === "CONCLUIDO") {
      const st = booking.startTime;
      // getUTC* pois startTime é UTC
      const dateStr = `${st.getUTCFullYear()}-${String(st.getUTCMonth() + 1).padStart(2, "0")}-${String(st.getUTCDate()).padStart(2, "0")}`;
      refreshFullyBookedStatus(
        booking.organizationId,
        booking.serviceId,
        dateStr
      );
    }

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

    const durationMinutes = service.durationMinutes;

    // Buscar info do dia (workingHours, breakTime, unavailableDay)
    const { workingHours, breakTime, unavailableDay } =
      await getDayAvailabilityInfo(organizationId, date);

    // Dia não é dia de trabalho ou está bloqueado especificamente
    if (!workingHours?.isWorking || unavailableDay) {
      return {
        success: true as const,
        slots: [],
        duration: durationMinutes,
      };
    }

    // Gerar todos os slots do dia (ignorando agendamentos)
    const slots = generateDaySlots({
      date,
      durationMinutes,
      workingHours,
      breakTime,
    });

    // Filtrar slots ocupados — usar janela UTC do dia completo
    const [year, month, day] = date.split("-").map(Number);
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const existingBookings = await prisma.booking.findMany({
      where: {
        organizationId,
        status: { in: ["PENDENTE", "CONFIRMADO"] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    const availableSlots = slots.filter((slotIso) => {
      const slotStart = new Date(slotIso);
      const slotEnd = addMinutes(slotStart, durationMinutes);
      return !existingBookings.some(
        (b: { startTime: Date; endTime: Date }) =>
          slotStart < b.endTime && slotEnd > b.startTime
      );
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

// ============================================================
// Buscar quais dias de um mês têm slots disponíveis
// OTIMIZADO: usa cache FullyBookedDay + filtros estáticos
// (evita computar slots para todos os 30+ dias do mês)
// ============================================================

export async function getAvailableDaysForMonthAction(
  organizationId: string,
  serviceId: string,
  year: number,
  month: number // 1-12
) {
  try {
    // Último dia do mês
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    // Usar UTC midnight para compatibilidade com @db.Date do Prisma
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));

    // 1 batch de queries paralelas (3 queries leves)
    const [workingHoursAll, unavailableDaysAll, fullyBookedDaysAll] =
      await Promise.all([
        prisma.workingHours.findMany({ where: { organizationId } }),
        prisma.unavailableDay.findMany({
          where: {
            organizationId,
            date: { gte: monthStart, lte: monthEnd },
          },
          select: { date: true },
        }),
        prisma.fullyBookedDay.findMany({
          where: {
            organizationId,
            serviceId,
            date: { gte: monthStart, lte: monthEnd },
          },
          select: { date: true },
        }),
      ]);

    // Sets para lookup O(1)
    const unavailableDateSet = new Set(
      unavailableDaysAll.map(
        (d) =>
          `${d.date.getUTCFullYear()}-${String(d.date.getUTCMonth() + 1).padStart(2, "0")}-${String(d.date.getUTCDate()).padStart(2, "0")}`
      )
    );

    const fullyBookedDateSet = new Set(
      fullyBookedDaysAll.map(
        (d) =>
          `${d.date.getUTCFullYear()}-${String(d.date.getUTCMonth() + 1).padStart(2, "0")}-${String(d.date.getUTCDate()).padStart(2, "0")}`
      )
    );

    // Map WorkingHours por dia da semana
    const workingHoursMap = new Map(
      workingHoursAll.map((wh) => [wh.dayOfWeek, wh])
    );

    // "Hoje" em UTC para comparar com datas UTC
    const todayUtc = new Date();
    const todayDateStr = `${todayUtc.getUTCFullYear()}-${String(todayUtc.getUTCMonth() + 1).padStart(2, "0")}-${String(todayUtc.getUTCDate()).padStart(2, "0")}`;
    const availableDays: string[] = [];

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Filtro 1: Dia passado (compara strings YYYY-MM-DD, funciona corretamente)
      if (dateStr < todayDateStr) continue;

      // Filtro 2: Dia bloqueado manualmente
      if (unavailableDateSet.has(dateStr)) continue;

      // Filtro 3: Não é dia de trabalho (usar UTC day-of-week)
      const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      const dayEnum = JS_DAY_TO_ENUM[dateObj.getUTCDay()];
      const workingHours = workingHoursMap.get(dayEnum);
      if (!workingHours?.isWorking) continue;

      // Filtro 4: Dia lotado (cache FullyBookedDay)
      if (fullyBookedDateSet.has(dateStr)) continue;

      // Passou em todos os filtros → dia disponível
      availableDays.push(dateStr);
    }

    return { success: true as const, availableDays };
  } catch (error) {
    console.error("[getAvailableDaysForMonthAction] Error:", error);
    return { success: false as const, error: "Erro ao buscar dias disponíveis" };
  }
}
