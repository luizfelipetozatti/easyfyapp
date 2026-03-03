// ============================================================
// Easyfy - Evolution API Client
// Cliente tipado para interagir com a Evolution API.
// Responsabilidade única: HTTP calls para a Evolution API.
// ============================================================

import https from "node:https";
import http from "node:http";

// ============================================================
// TYPES
// ============================================================

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instance: string;
}

export interface EvolutionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SendTextPayload {
  number: string;
  text: string;
  delayMs?: number;
}

interface InstanceState {
  instance: {
    instanceName: string;
    state: "open" | "close" | "connecting";
  };
}

interface WebhookConfig {
  url: string;
  events: string[];
}

// ============================================================
// CONFIG LOADER
// ============================================================

/**
 * Carrega config global das variáveis de ambiente.
 * Usado como base para instâncias por organização.
 */
function loadGlobalConfig(): Omit<EvolutionConfig, "instance"> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "[EvolutionClient] Variáveis ausentes: EVOLUTION_API_URL, EVOLUTION_API_KEY"
    );
  }

  return { apiUrl, apiKey };
}

/**
 * Constrói o nome da instância de uma organização.
 * Usa os primeiros 8 chars do orgId para ser único e legível.
 */
export function buildInstanceName(orgId: string): string {
  return `org-${orgId.slice(0, 8)}`;
}

function loadConfig(instanceName?: string): EvolutionConfig {
  const base = loadGlobalConfig();
  const instance = instanceName ?? process.env.EVOLUTION_INSTANCE;

  if (!instance) {
    throw new Error("[EvolutionClient] Variável ausente: EVOLUTION_INSTANCE");
  }

  return { ...base, instance };
}

// ============================================================
// HTTP BASE
// ============================================================

const REQUEST_TIMEOUT_MS = 10_000; // 10s máximo por request

async function request<T>(
  config: EvolutionConfig,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<EvolutionResponse<T>> {
  return new Promise((resolve) => {
    const url = new URL(`${config.apiUrl}${path}`);
    const bodyStr = body ? JSON.stringify(body) : undefined;

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const transport = url.protocol === "https:" ? https : http;

    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let parsed: T | undefined;
        try { parsed = JSON.parse(data) as T; } catch { parsed = data as unknown as T; }

        if (!res.statusCode || res.statusCode >= 400) {
          console.error(`[EvolutionClient] ${method} ${path} → ${res.statusCode}`, data);
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        } else {
          resolve({ success: true, data: parsed });
        }
      });
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      console.error(`[EvolutionClient] Timeout (${method} ${path})`);
      req.destroy();
      resolve({ success: false, error: `Timeout após ${REQUEST_TIMEOUT_MS / 1000}s` });
    });

    req.on("error", (err) => {
      console.error(`[EvolutionClient] Request failed (${method} ${path}):`, err.message);
      resolve({ success: false, error: err.message });
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ============================================================
// EVOLUTION API CLIENT
// ============================================================

export const evolutionClient = {
  /**
   * Verifica se a instância está conectada ao WhatsApp.
   */
  async getInstanceState(instanceName?: string): Promise<EvolutionResponse<InstanceState>> {
    const config = loadConfig(instanceName);
    return request<InstanceState>(
      config,
      "GET",
      `/instance/connectionState/${config.instance}`
    );
  },

  /**
   * Envia uma mensagem de texto.
   * Se instanceName for fornecido, usa essa instância (per-tenant).
   */
  async sendText(payload: SendTextPayload, instanceName?: string): Promise<EvolutionResponse<{ key: { id: string } }>> {
    const config = loadConfig(instanceName);
    return request(config, "POST", `/message/sendText/${config.instance}`, {
      number: payload.number,
      text: payload.text,
      options: {
        delay: payload.delayMs ?? 1200,
        presence: "composing",
      },
    });
  },

  /**
   * Cria uma nova instância para uma organização.
   * Retorna o QR Code em base64.
   */
  async createInstance(instanceName: string): Promise<EvolutionResponse<{
    instance: { instanceName: string; status: string };
    qrcode?: { base64: string; code: string };
  }>> {
    const config = loadConfig(instanceName);
    return request(config, "POST", `/instance/create`, {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    });
  },

  /**
   * Busca o QR Code atualizado de uma instância.
   */
  async getQrCode(instanceName: string): Promise<EvolutionResponse<{
    pairingCode: string | null;
    code: string;
    base64: string;
    count: number;
  }>> {
    const config = loadConfig(instanceName);
    return request(config, "GET", `/instance/connect/${instanceName}`);
  },

  /**
   * Desconecta e deleta a instância de uma organização.
   */
  async deleteInstance(instanceName: string): Promise<EvolutionResponse> {
    const config = loadConfig(instanceName);
    return request(config, "DELETE", `/instance/delete/${instanceName}`);
  },

  /**
   * Configura o webhook da instância para apontar para o Easyfy.
   * Execute uma vez após criar a instância no Railway.
   */
  async configureWebhook(webhookUrl: string, instanceName?: string): Promise<EvolutionResponse> {
    const config = loadConfig(instanceName);
    const webhookConfig: WebhookConfig = {
      url: webhookUrl,
      events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"],
    };
    return request(config, "POST", `/webhook/set/${config.instance}`, {
      webhook: {
        enabled: true,
        ...webhookConfig,
        webhook_by_events: false,
        webhook_base64: false,
      },
    });
  },
};
