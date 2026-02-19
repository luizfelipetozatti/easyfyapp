import { prisma } from "@easyfyapp/database";
import { addMinutes } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

// ============================================================
// HELPERS
// ============================================================

/** Converts "HH:mm" to total minutes since midnight. */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Maps JS getDay() (0=Sunday) to Prisma DayOfWeek enum. */
const JS_DAY_TO_ENUM = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

/** Returns true when [aStart, aEnd) overlaps [bStart, bEnd) (all in minutes). */
function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// ============================================================
// GET /api/slots
// ============================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!orgId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Missing orgId, serviceId, or date" },
      { status: 400 }
    );
  }

  try {
    // ----------------------------------------------------------
    // 1. Fetch service and validate ownership
    // ----------------------------------------------------------
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.organizationId !== orgId) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const durationMinutes = service.durationMinutes;

    // ----------------------------------------------------------
    // 2. Parse the requested date (avoid timezone shifts)
    // ----------------------------------------------------------
    const [year, month, day] = date.split("-").map(Number);
    const baseDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayOfWeekEnum = JS_DAY_TO_ENUM[baseDate.getDay()];

    // ----------------------------------------------------------
    // 3. Fetch working hours for this day + break times in parallel
    // ----------------------------------------------------------
    const [workingHoursForDay, breakTimes, existingBookings] =
      await Promise.all([
        prisma.workingHours.findFirst({
          where: { organizationId: orgId, dayOfWeek: dayOfWeekEnum },
        }),
        prisma.breakTime.findMany({
          where: { organizationId: orgId },
          orderBy: { startTime: "asc" },
        }),
        prisma.booking.findMany({
          where: {
            organizationId: orgId,
            status: { in: ["PENDENTE", "CONFIRMADO"] },
            startTime: {
              gte: new Date(`${date}T00:00:00`),
              lte: new Date(`${date}T23:59:59`),
            },
          },
          select: { startTime: true, endTime: true },
        }),
      ]);

    // ----------------------------------------------------------
    // 4. Guard: day is not a working day
    // ----------------------------------------------------------
    if (!workingHoursForDay || !workingHoursForDay.isWorking) {
      return NextResponse.json({ slots: [], duration: durationMinutes, total: 0 });
    }

    const workStart = timeToMinutes(workingHoursForDay.startTime);
    const workEnd = timeToMinutes(workingHoursForDay.endTime);

    // ----------------------------------------------------------
    // 5. Pre-compute break intervals in minutes
    // ----------------------------------------------------------
    const breakIntervals = breakTimes.map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }));

    // ----------------------------------------------------------
    // 6. Generate candidate slots within working hours
    // ----------------------------------------------------------
    const slots: string[] = [];

    for (
      let minuteOffset = workStart;
      minuteOffset + durationMinutes <= workEnd;
      minuteOffset += durationMinutes
    ) {
      const slotStart = new Date(baseDate);
      slotStart.setHours(
        Math.floor(minuteOffset / 60),
        minuteOffset % 60,
        0,
        0
      );
      const slotEnd = addMinutes(slotStart, durationMinutes);

      const slotStartMin = minuteOffset;
      const slotEndMin = minuteOffset + durationMinutes;

      // 7a. Filter: overlaps with any break time
      const blockedByBreak = breakIntervals.some((b) =>
        intervalsOverlap(slotStartMin, slotEndMin, b.start, b.end)
      );
      if (blockedByBreak) continue;

      // 7b. Filter: overlaps with an existing booking
      const blockedByBooking = existingBookings.some(
        (b: { startTime: Date; endTime: Date }) =>
          slotStart < b.endTime && slotEnd > b.startTime
      );
      if (blockedByBooking) continue;

      slots.push(slotStart.toISOString());
    }

    return NextResponse.json({
      slots,
      duration: durationMinutes,
      total: slots.length,
    });
  } catch (error) {
    console.error("[API Slots] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

