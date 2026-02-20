"use server";

import { prisma } from "@easyfyapp/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserOrgId } from "@/lib/auth/dashboard";
import {
  DEFAULT_TEMPLATES,
  type TemplateType,
  type WhatsAppTemplateData,
} from "@/lib/whatsapp-constants";

// ============================================================
// TYPES
// ============================================================

type TemplateResponse = {
  success: boolean;
  error?: string;
};

// ============================================================
// VALIDATION
// ============================================================

const updateTemplateSchema = z.object({
  type: z.enum(["CONFIRMATION", "CANCELLATION", "REMINDER"]),
  content: z
    .string()
    .min(10, "Mensagem muito curta (mínimo 10 caracteres)")
    .max(1000, "Mensagem muito longa (máximo 1000 caracteres)"),
});

// ============================================================
// QUERIES
// ============================================================

/**
 * Retorna todos os templates da organização, mesclando
 * customizações com os defaults para os tipos não customizados.
 */
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplateData[]> {
  const orgId = await getCurrentUserOrgId();

  const customTemplates = await prisma.whatsAppTemplate.findMany({
    where: { organizationId: orgId },
  });

  const customByType = new Map(customTemplates.map((t) => [t.type, t.content]));

  const allTypes: TemplateType[] = ["CONFIRMATION", "CANCELLATION", "REMINDER"];

  return allTypes.map((type) => {
    const custom = customByType.get(type);
    return {
      type,
      content: custom ?? DEFAULT_TEMPLATES[type],
      isCustom: !!custom,
    };
  });
}

/**
 * Retorna o conteúdo de um template específico para uso no envio de mensagem.
 * Prioridade: customizado > padrão.
 */
export async function getTemplateContent(
  orgId: string,
  type: TemplateType
): Promise<string> {
  const custom = await prisma.whatsAppTemplate.findUnique({
    where: { organizationId_type: { organizationId: orgId, type } },
  });

  return custom?.content ?? DEFAULT_TEMPLATES[type];
}

// ============================================================
// MUTATIONS
// ============================================================

export async function upsertWhatsAppTemplate(
  rawData: unknown
): Promise<TemplateResponse> {
  try {
    const orgId = await getCurrentUserOrgId();
    const validated = updateTemplateSchema.parse(rawData);

    await prisma.whatsAppTemplate.upsert({
      where: {
        organizationId_type: {
          organizationId: orgId,
          type: validated.type,
        },
      },
      update: { content: validated.content },
      create: {
        organizationId: orgId,
        type: validated.type,
        content: validated.content,
      },
    });

    revalidatePath("/dashboard/whatsapp");
    return { success: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message };
    }
    console.error("[WhatsApp Templates] upsert error:", err);
    return { success: false, error: "Erro ao salvar template" };
  }
}

/**
 * Remove a customização do template, restaurando o padrão do sistema.
 */
export async function resetWhatsAppTemplate(
  type: TemplateType
): Promise<TemplateResponse> {
  try {
    const orgId = await getCurrentUserOrgId();

    await prisma.whatsAppTemplate.deleteMany({
      where: { organizationId: orgId, type },
    });

    revalidatePath("/dashboard/whatsapp");
    return { success: true };
  } catch (err) {
    console.error("[WhatsApp Templates] reset error:", err);
    return { success: false, error: "Erro ao restaurar template padrão" };
  }
}
