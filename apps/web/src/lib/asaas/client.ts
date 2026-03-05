// ============================================================
// Easyfy - Asaas HTTP Client
// Wrapper tipado para a API REST do Asaas
// Docs: https://docs.asaas.com/reference
// ============================================================

import type {
  AsaasCustomer,
  AsaasCustomerCreate,
  AsaasListResponse,
  AsaasPayment,
  AsaasSubscription,
  AsaasSubscriptionCreate,
} from "./types";

const ASAAS_BASE_URL_PRODUCTION = "https://api.asaas.com/v3";
const ASAAS_BASE_URL_SANDBOX = "https://sandbox.asaas.com/api/v3";

// ============================================================
// INTERNAL HELPERS
// ============================================================

function getBaseUrl(): string {
  return process.env.ASAAS_SANDBOX === "true"
    ? ASAAS_BASE_URL_SANDBOX
    : ASAAS_BASE_URL_PRODUCTION;
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error(
      "Missing ASAAS_API_KEY environment variable. " +
        "Configure it in .env.local or in your Vercel project settings."
    );
  }
  return key;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const apiKey = getApiKey();

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Disable Next.js caching for payment-related requests
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    const errorDetails =
      "errors" in data
        ? data.errors.map((e: { description: string }) => e.description).join("; ")
        : `HTTP ${response.status}`;

    throw new Error(`[Asaas API] ${method} ${path} failed: ${errorDetails}`);
  }

  return data as T;
}

// ============================================================
// CUSTOMERS
// ============================================================

export const customers = {
  /**
   * Cria um novo cliente no Asaas.
   */
  create: (data: AsaasCustomerCreate): Promise<AsaasCustomer> =>
    request<AsaasCustomer>("POST", "/customers", data),

  /**
   * Busca um cliente pelo ID.
   */
  retrieve: (id: string): Promise<AsaasCustomer> =>
    request<AsaasCustomer>("GET", `/customers/${id}`),

  /**
   * Lista clientes por referência externa (nosso organizationId).
   */
  listByExternalReference: (
    externalReference: string
  ): Promise<AsaasListResponse<AsaasCustomer>> =>
    request<AsaasListResponse<AsaasCustomer>>(
      "GET",
      `/customers?externalReference=${encodeURIComponent(externalReference)}`
    ),

  /**
   * Atualiza um cliente existente.
   */
  update: (
    id: string,
    data: Partial<AsaasCustomerCreate>
  ): Promise<AsaasCustomer> =>
    request<AsaasCustomer>("PUT", `/customers/${id}`, data),
};

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export const subscriptions = {
  /**
   * Cria uma nova assinatura recorrente.
   */
  create: (data: AsaasSubscriptionCreate): Promise<AsaasSubscription> =>
    request<AsaasSubscription>("POST", "/subscriptions", data),

  /**
   * Busca uma assinatura pelo ID.
   */
  retrieve: (id: string): Promise<AsaasSubscription> =>
    request<AsaasSubscription>("GET", `/subscriptions/${id}`),

  /**
   * Cancela uma assinatura.
   */
  cancel: (id: string): Promise<AsaasSubscription> =>
    request<AsaasSubscription>("DELETE", `/subscriptions/${id}`),

  /**
   * Lista assinaturas por referência externa.
   */
  listByExternalReference: (
    externalReference: string
  ): Promise<AsaasListResponse<AsaasSubscription>> =>
    request<AsaasListResponse<AsaasSubscription>>(
      "GET",
      `/subscriptions?externalReference=${encodeURIComponent(externalReference)}`
    ),
};

// ============================================================
// PAYMENTS
// ============================================================

export const payments = {
  /**
   * Lista todos os pagamentos de uma assinatura.
   */
  listBySubscription: (
    subscriptionId: string
  ): Promise<AsaasListResponse<AsaasPayment>> =>
    request<AsaasListResponse<AsaasPayment>>(
      "GET",
      `/subscriptions/${subscriptionId}/payments?status=PENDING&offset=0&limit=1`
    ),
};

// ============================================================
// ASSERTION HELPER
// ============================================================

/**
 * Garante que a ASAAS_API_KEY está configurada em runtime.
 * Chame no início de cada handler de API route / server action.
 */
export function assertAsaasConfigured(): void {
  if (!process.env.ASAAS_API_KEY) {
    throw new Error(
      "Missing ASAAS_API_KEY environment variable. " +
        "Configure it in .env.local or in your Vercel project settings."
    );
  }
}

/**
 * Verifica o token do webhook Asaas enviado no header `asaas-access-token`.
 */
export function verifyWebhookToken(token: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) {
    // Se não configurado, não valida — apenas loga aviso
    console.warn("[Asaas Webhook] ASAAS_WEBHOOK_TOKEN not configured. Skipping token verification.");
    return true;
  }
  return token === expected;
}
