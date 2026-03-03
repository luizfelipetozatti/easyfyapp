"use server";

// ============================================================
// Easyfy - Server Actions: Conexão WhatsApp por Organização
// ============================================================

import { prisma } from "@easyfyapp/database";
import { revalidatePath } from "next/cache";
import { getCurrentUserOrgId } from "@/lib/auth/dashboard";
import { evolutionClient, buildInstanceName } from "@/lib/evolution-client";

// ============================================================
// TYPES
// ============================================================

export type ConnectionStatus = "open" | "connecting" | "close" | "not_created";

export interface WhatsAppConnectionState {
  status: ConnectionStatus;
  instanceName: string | null;
  qrCode?: string;
}

// ============================================================
// QUERIES
// ============================================================

/**
 * Retorna o estado atual da conexão WhatsApp da organização.
 */
export async function getWhatsAppConnectionState(): Promise<WhatsAppConnectionState> {
  const orgId = await getCurrentUserOrgId();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { evolutionInstance: true },
  });

  if (!org?.evolutionInstance) {
    return { status: "not_created", instanceName: null };
  }

  const result = await evolutionClient.getInstanceState(org.evolutionInstance);

  if (!result.success) {
    // Instância existe no BD mas não na Evolution API (ex: redeploy)
    return { status: "not_created", instanceName: org.evolutionInstance };
  }

  return {
    status: result.data?.instance.state ?? "close",
    instanceName: org.evolutionInstance,
  };
}

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Cria uma instância Evolution API para a organização e retorna o QR Code.
 */
export async function connectWhatsApp(): Promise<{
  success: boolean;
  qrCode?: string;
  instanceName?: string;
  alreadyConnected?: boolean;
  error?: string;
}> {
  const orgId = await getCurrentUserOrgId();
  const instanceName = buildInstanceName(orgId);

  let qrCode: string | undefined;

  const createResult = await evolutionClient.createInstance(instanceName);

  if (!createResult.success) {
    const alreadyExists = createResult.error?.includes("already in use");

    if (!alreadyExists) {
      return { success: false, error: createResult.error };
    }

    // Instância já existe — verifica se já está conectada
    const stateResult = await evolutionClient.getInstanceState(instanceName);
    if (stateResult.success && stateResult.data?.instance.state === "open") {
      // Já conectada — salva no banco e (re)configura o webhook
      await prisma.organization.update({
        where: { id: orgId },
        data: { evolutionInstance: instanceName },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl) {
        await evolutionClient.configureWebhook(
          `${appUrl}/api/webhook/whatsapp`,
          instanceName
        );
      }

      revalidatePath("/dashboard/whatsapp");
      return { success: true, alreadyConnected: true, instanceName };
    }

    // Não está conectada — busca QR Code para o usuário escanear
    const qrResult = await evolutionClient.getQrCode(instanceName);
    if (!qrResult.success) {
      return { success: false, error: qrResult.error };
    }
    qrCode = qrResult.data?.base64;
  } else {
    qrCode = createResult.data?.qrcode?.base64;
  }

  // Garante que o nome da instância está salvo na organização
  await prisma.organization.update({
    where: { id: orgId },
    data: { evolutionInstance: instanceName },
  });

  // Configura o webhook automaticamente
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    await evolutionClient.configureWebhook(
      `${appUrl}/api/webhook/whatsapp`,
      instanceName
    );
  }

  revalidatePath("/dashboard/whatsapp");

  return { success: true, qrCode, instanceName };
}

/**
 * Busca o QR Code atualizado (para polling enquanto aguarda conexão).
 */
export async function refreshQrCode(): Promise<{
  success: boolean;
  qrCode?: string;
  status?: ConnectionStatus | "error";
  error?: string;
}> {
  const orgId = await getCurrentUserOrgId();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { evolutionInstance: true },
  });

  if (!org?.evolutionInstance) {
    return { success: false, status: "error", error: "Instância não encontrada." };
  }

  const stateResult = await evolutionClient.getInstanceState(org.evolutionInstance);

  // Instância não existe mais na Evolution API (ex: deletada manualmente)
  if (!stateResult.success) {
    await prisma.organization.update({
      where: { id: orgId },
      data: { evolutionInstance: null },
    });
    revalidatePath("/dashboard/whatsapp");
    return { success: false, status: "error", error: "Instância não encontrada na Evolution API." };
  }

  const status = stateResult.data?.instance.state ?? "connecting";

  if (status === "open") {
    revalidatePath("/dashboard/whatsapp");
    return { success: true, status: "open" };
  }

  const qrResult = await evolutionClient.getQrCode(org.evolutionInstance);

  return {
    success: qrResult.success,
    qrCode: qrResult.data?.base64,
    status: status as ConnectionStatus,
    error: qrResult.error,
  };
}

/**
 * Força a re-configuração do webhook na Evolution API para a instância atual.
 * Útil quando a URL do app mudou ou o webhook foi perdido.
 */
export async function reconfigureWebhook(): Promise<{
  success: boolean;
  error?: string;
}> {
  const orgId = await getCurrentUserOrgId();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { evolutionInstance: true },
  });

  if (!org?.evolutionInstance) {
    return { success: false, error: "Instância WhatsApp não encontrada." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return { success: false, error: "NEXT_PUBLIC_APP_URL não configurado." };
  }

  const result = await evolutionClient.configureWebhook(
    `${appUrl}/api/webhook/whatsapp`,
    org.evolutionInstance
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  console.log(`[WhatsApp] Webhook reconfigurado para ${appUrl}/api/webhook/whatsapp (${org.evolutionInstance})`);
  return { success: true };
}

/**
 * Desconecta e remove a instância WhatsApp da organização.
 */
export async function disconnectWhatsApp(): Promise<{
  success: boolean;
  error?: string;
}> {
  const orgId = await getCurrentUserOrgId();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { evolutionInstance: true },
  });

  if (!org?.evolutionInstance) {
    return { success: false, error: "Nenhuma instância conectada." };
  }

  await evolutionClient.deleteInstance(org.evolutionInstance);

  // Remove a instância do banco independente do resultado da API
  await prisma.organization.update({
    where: { id: orgId },
    data: { evolutionInstance: null },
  });

  revalidatePath("/dashboard/whatsapp");

  return { success: true };
}
