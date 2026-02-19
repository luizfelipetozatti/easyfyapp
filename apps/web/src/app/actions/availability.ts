"use server";

import { prisma } from "@easyfyapp/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserOrgId } from "@/lib/auth/dashboard";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

type SuccessResponse<T = any> = {
  success: true;
  message: string;
  data?: T;
};

type ErrorResponse = {
  success: false;
  error: string;
};

export type AvailabilityResponse<T = any> =
  | SuccessResponse<T>
  | ErrorResponse;

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const updateWorkingHoursSchema = z.object({
  monday: z.object({
    isWorking: z.boolean(),
    startTime: z.string().time("HH:mm"),
    endTime: z.string().time("HH:mm"),
  }),
  tuesday: z.object({
    isWorking: z.boolean(),
    startTime: z.string().time("HH:mm"),
    endTime: z.string().time("HH:mm"),
  }),
  wednesday: z.object({
    isWorking: z.boolean(),
    startTime: z.string().time("HH:mm"),
    endTime: z.string().time("HH:mm"),
  }),
  thursday: z.object({
    isWorking: z.boolean(),
    startTime: z.string().time("HH:mm"),
    endTime: z.string().time("HH:mm"),
  }),
  friday: z.object({
    isWorking: z.boolean(),
    startTime: z.string().time("HH:mm"),
    endTime: z.string().time("HH:mm"),
  }),
  saturday: z.object({
    isWorking: z.boolean(),
    startTime: z.string().time("HH:mm"),
    endTime: z.string().time("HH:mm"),
  }),
  sunday: z.object({
    isWorking: z.boolean(),
    startTime: z.string().time("HH:mm"),
    endTime: z.string().time("HH:mm"),
  }),
}).refine(
  (data) => {
    // Validar que a hora de término é depois da hora de início
    for (const day of Object.values(data)) {
      if (day.isWorking && day.startTime >= day.endTime) {
        return false;
      }
    }
    return true;
  },
  { message: "A hora de término deve ser posterior à hora de início" }
);

const updateBreakTimeSchema = z.object({
  startTime: z.string().time("HH:mm"),
  endTime: z.string().time("HH:mm"),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: "A hora de término do intervalo deve ser posterior à hora de início" }
);

const addUnavailableDaySchema = z.object({
  date: z.string().date(),
  reason: z.string().optional(),
});

// ============================================================
// HELPER FUNCTION
// ============================================================

async function getOrgIdAsync(): Promise<string> {
  const orgId = await getCurrentUserOrgId();
  if (!orgId) throw new Error("Organização não encontrada");
  return orgId;
}

// ============================================================
// GET OPERATIONS
// ============================================================

export async function getAvailabilityConfig() {
  try {
    const orgId = await getOrgIdAsync();

    const [workingHours, breakTime, unavailableDays] = await Promise.all([
      prisma.workingHours.findMany({
        where: { organizationId: orgId },
        orderBy: { dayOfWeek: "asc" },
      }),
      prisma.breakTime.findFirst({
        where: { organizationId: orgId },
      }),
      prisma.unavailableDay.findMany({
        where: { organizationId: orgId },
        orderBy: { date: "desc" },
      }),
    ]);

    return {
      success: true,
      data: {
        workingHours,
        breakTime,
        unavailableDays,
      },
    } as const;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao buscar configuração de disponibilidade:", errorMessage);
    return {
      success: false,
      error: "Erro ao buscar configuração de disponibilidade",
    };
  }
}

// ============================================================
// UPDATE WORKING HOURS
// ============================================================

export async function updateWorkingHours(
  _prevState: AvailabilityResponse,
  formData: FormData
): Promise<AvailabilityResponse> {
  try {
    const orgId = await getOrgIdAsync();

    const data = {
      monday: {
        isWorking: formData.get("monday-isWorking") === "true",
        startTime: String(formData.get("monday-startTime")),
        endTime: String(formData.get("monday-endTime")),
      },
      tuesday: {
        isWorking: formData.get("tuesday-isWorking") === "true",
        startTime: String(formData.get("tuesday-startTime")),
        endTime: String(formData.get("tuesday-endTime")),
      },
      wednesday: {
        isWorking: formData.get("wednesday-isWorking") === "true",
        startTime: String(formData.get("wednesday-startTime")),
        endTime: String(formData.get("wednesday-endTime")),
      },
      thursday: {
        isWorking: formData.get("thursday-isWorking") === "true",
        startTime: String(formData.get("thursday-startTime")),
        endTime: String(formData.get("thursday-endTime")),
      },
      friday: {
        isWorking: formData.get("friday-isWorking") === "true",
        startTime: String(formData.get("friday-startTime")),
        endTime: String(formData.get("friday-endTime")),
      },
      saturday: {
        isWorking: formData.get("saturday-isWorking") === "true",
        startTime: String(formData.get("saturday-startTime")),
        endTime: String(formData.get("saturday-endTime")),
      },
      sunday: {
        isWorking: formData.get("sunday-isWorking") === "true",
        startTime: String(formData.get("sunday-startTime")),
        endTime: String(formData.get("sunday-endTime")),
      },
    };

    // Validar dados
    const validatedData = updateWorkingHoursSchema.parse(data);

    // Mapear dias para enum
    const daysMap = {
      monday: "MONDAY",
      tuesday: "TUESDAY",
      wednesday: "WEDNESDAY",
      thursday: "THURSDAY",
      friday: "FRIDAY",
      saturday: "SATURDAY",
      sunday: "SUNDAY",
    } as const;

    // Atualizar cada dia da semana
    for (const [dayName, dayData] of Object.entries(validatedData)) {
      const dayEnum = daysMap[dayName as keyof typeof daysMap];

      await prisma.workingHours.upsert({
        where: {
          organizationId_dayOfWeek: {
            organizationId: orgId,
            dayOfWeek: dayEnum as any,
          },
        },
        update: {
          isWorking: dayData.isWorking,
          startTime: dayData.startTime,
          endTime: dayData.endTime,
        },
        create: {
          organizationId: orgId,
          dayOfWeek: dayEnum as any,
          isWorking: dayData.isWorking,
          startTime: dayData.startTime,
          endTime: dayData.endTime,
        },
      });
    }

    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message: "Horários de trabalho atualizados com sucesso!",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao atualizar horários de trabalho:", errorMessage);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dados fornecidos são inválidos",
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erro ao atualizar horários de trabalho",
    };
  }
}

// ============================================================
// UPDATE BREAK TIME
// ============================================================

export async function updateBreakTime(
  _prevState: AvailabilityResponse,
  formData: FormData
): Promise<AvailabilityResponse> {
  try {
    const orgId = await getOrgIdAsync();

    const startTime = String(formData.get("breakStartTime"));
    const endTime = String(formData.get("breakEndTime"));

    const validatedData = updateBreakTimeSchema.parse({
      startTime,
      endTime,
    });

    await prisma.breakTime.upsert({
      where: { organizationId: orgId },
      update: {
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
      },
      create: {
        organizationId: orgId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
      },
    });

    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message: "Intervalo de almoço atualizado com sucesso!",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao atualizar intervalo de almoço:", errorMessage);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dados fornecidos são inválidos",
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erro ao atualizar intervalo de almoço",
    };
  }
}

// ============================================================
// ADD UNAVAILABLE DAY
// ============================================================

export async function addUnavailableDay(
  _prevState: AvailabilityResponse,
  formData: FormData
): Promise<AvailabilityResponse> {
  try {
    const orgId = await getOrgIdAsync();

    const date = String(formData.get("date"));
    const reason = formData.get("reason");

    const validatedData = addUnavailableDaySchema.parse({
      date,
      reason: reason ? String(reason) : undefined,
    });

    // Criar data em meia-noite da timezone LOCAL (não UTC)
    // ISO date string "YYYY-MM-DD" → split → create Date at 00:00:00 local
    const [year, month, day] = validatedData.date.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return {
        success: false,
        error: "Não é possível adicionar uma data no passado",
      };
    }

    await prisma.unavailableDay.create({
      data: {
        organizationId: orgId,
        date: selectedDate,
        reason: validatedData.reason || null,
      },
    });

    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message: "Dia indisponível adicionado com sucesso!",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao adicionar dia indisponível:", errorMessage);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dados fornecidos são inválidos",
      };
    }

    if (error instanceof Error) {
      // Verificar se é um erro de constraint única
      if (error.message.includes("Unique constraint failed")) {
        return {
          success: false,
          error: "Esta data já foi adicionada como indisponível",
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erro ao adicionar dia indisponível",
    };
  }
}

// ============================================================
// REMOVE UNAVAILABLE DAY
// ============================================================

export async function removeUnavailableDay(
  _prevState: AvailabilityResponse,
  dayId: string
): Promise<AvailabilityResponse> {
  try {
    const orgId = await getOrgIdAsync();

    // Validar que o dia pertence à organização
    const unavailableDay = await prisma.unavailableDay.findUnique({
      where: { id: dayId },
    });

    if (!unavailableDay || unavailableDay.organizationId !== orgId) {
      return {
        success: false,
        error: "Dia indisponível não encontrado",
      };
    }

    await prisma.unavailableDay.delete({
      where: { id: dayId },
    });

    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message: "Dia indisponível removido com sucesso!",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao remover dia indisponível:", errorMessage);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erro ao remover dia indisponível",
    };
  }
}
