"use server";

import { prisma } from "@easyfyapp/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserOrgId } from "@/lib/auth/dashboard";

// ============================================================
// TYPES
// ============================================================

type SuccessResponse<T = unknown> = {
  success: true;
  message: string;
  data?: T;
};

type ErrorResponse = {
  success: false;
  error: string;
};

export type ServiceResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export type ServiceData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
};

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const serviceSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  price: z
    .number({ invalid_type_error: "Preço inválido" })
    .min(0, "Preço não pode ser negativo")
    .max(99999.99, "Preço muito alto"),
  durationMinutes: z
    .number({ invalid_type_error: "Duração inválida" })
    .int("Duração deve ser um número inteiro")
    .min(5, "Duração mínima é 5 minutos")
    .max(480, "Duração máxima é 480 minutos (8 horas)"),
});

// ============================================================
// CREATE
// ============================================================

export async function createService(
  input: z.infer<typeof serviceSchema>
): Promise<ServiceResponse<ServiceData>> {
  try {
    const orgId = await getCurrentUserOrgId();
    const validated = serviceSchema.safeParse(input);

    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return { success: false, error: firstError?.message ?? "Dados inválidos" };
    }

    const { name, description, price, durationMinutes } = validated.data;

    const service = await prisma.service.create({
      data: {
        organizationId: orgId,
        name,
        description: description || null,
        price,
        durationMinutes,
        active: true,
      },
    });

    revalidatePath("/dashboard/services");

    return {
      success: true,
      message: "Serviço criado com sucesso!",
      data: {
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
        active: service.active,
      },
    };
  } catch (error) {
    console.error("[createService]", error);
    return { success: false, error: "Erro ao criar serviço. Tente novamente." };
  }
}

// ============================================================
// UPDATE
// ============================================================

export async function updateService(
  serviceId: string,
  input: z.infer<typeof serviceSchema>
): Promise<ServiceResponse<ServiceData>> {
  try {
    const orgId = await getCurrentUserOrgId();
    const validated = serviceSchema.safeParse(input);

    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return { success: false, error: firstError?.message ?? "Dados inválidos" };
    }

    // Verificar se o serviço pertence à organização
    const existing = await prisma.service.findFirst({
      where: { id: serviceId, organizationId: orgId },
    });

    if (!existing) {
      return { success: false, error: "Serviço não encontrado." };
    }

    const { name, description, price, durationMinutes } = validated.data;

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        description: description || null,
        price,
        durationMinutes,
      },
    });

    revalidatePath("/dashboard/services");

    return {
      success: true,
      message: "Serviço atualizado com sucesso!",
      data: {
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
        active: service.active,
      },
    };
  } catch (error) {
    console.error("[updateService]", error);
    return { success: false, error: "Erro ao atualizar serviço. Tente novamente." };
  }
}

// ============================================================
// DELETE
// ============================================================

export async function deleteService(
  serviceId: string
): Promise<ServiceResponse> {
  try {
    const orgId = await getCurrentUserOrgId();

    const existing = await prisma.service.findFirst({
      where: { id: serviceId, organizationId: orgId },
      include: { _count: { select: { bookings: true } } },
    });

    if (!existing) {
      return { success: false, error: "Serviço não encontrado." };
    }

    if (existing._count.bookings > 0) {
      return {
        success: false,
        error: `Este serviço possui ${existing._count.bookings} agendamento${existing._count.bookings !== 1 ? "s" : ""} vinculado${existing._count.bookings !== 1 ? "s" : ""}. Desative-o em vez de excluí-lo.`,
      };
    }

    await prisma.service.delete({ where: { id: serviceId } });

    revalidatePath("/dashboard/services");

    return { success: true, message: "Serviço excluído com sucesso!" };
  } catch (error) {
    console.error("[deleteService]", error);
    return { success: false, error: "Erro ao excluir serviço. Tente novamente." };
  }
}

// ============================================================
// TOGGLE ACTIVE STATUS
// ============================================================

export async function toggleServiceStatus(
  serviceId: string,
  active: boolean
): Promise<ServiceResponse> {
  try {
    const orgId = await getCurrentUserOrgId();

    const existing = await prisma.service.findFirst({
      where: { id: serviceId, organizationId: orgId },
    });

    if (!existing) {
      return { success: false, error: "Serviço não encontrado." };
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: { active },
    });

    revalidatePath("/dashboard/services");

    return {
      success: true,
      message: active ? "Serviço ativado!" : "Serviço desativado!",
    };
  } catch (error) {
    console.error("[toggleServiceStatus]", error);
    return { success: false, error: "Erro ao alterar status. Tente novamente." };
  }
}
