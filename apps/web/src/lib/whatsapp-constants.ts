// ============================================================
// Easyfy - WhatsApp Template Constants
// Arquivo sem dependências de servidor — pode ser importado em qualquer contexto
// ============================================================

// ============================================================
// TYPES
// ============================================================

export type TemplateType = "CONFIRMATION" | "CANCELLATION" | "REMINDER";

export type WhatsAppTemplateData = {
  type: TemplateType;
  content: string;
  isCustom: boolean;
};

// ============================================================
// DEFAULT TEMPLATES
// Variáveis disponíveis: {{nome}}, {{serviço}}, {{data}}, {{organização}}
// ============================================================

export const DEFAULT_TEMPLATES: Record<TemplateType, string> = {
  CONFIRMATION: [
    "Olá {{nome}}! 👋",
    "",
    "Seu agendamento foi *confirmado*! ✅",
    "",
    "📅 *{{serviço}}*",
    "🕐 *{{data}}*",
    "📍 *{{organização}}*",
    "",
    "Caso precise cancelar ou reagendar, entre em contato conosco.",
    "",
    "_Mensagem automática - Easyfy_",
  ].join("\n"),

  CANCELLATION: [
    "Olá {{nome}},",
    "",
    "Informamos que seu agendamento para *{{serviço}}* em *{{data}}* foi *cancelado*.",
    "",
    "Se desejar reagendar, acesse nosso link de agendamento.",
    "",
    "_Mensagem automática - Easyfy_",
  ].join("\n"),

  REMINDER: [
    "Lembrete: Olá {{nome}}! 🔔",
    "",
    "Sua consulta/reserva para *{{serviço}}* é amanhã, *{{data}}*.",
    "",
    "📍 *{{organização}}*",
    "",
    "Confirme sua presença respondendo esta mensagem.",
    "",
    "_Mensagem automática - Easyfy_",
  ].join("\n"),
};

// ============================================================
// TEMPLATE METADATA
// ============================================================

export const TEMPLATE_META: Record<
  TemplateType,
  { label: string; description: string; variables: string[] }
> = {
  CONFIRMATION: {
    label: "Confirmação de Agendamento",
    description: "Enviada ao cliente assim que o agendamento é criado",
    variables: ["{{nome}}", "{{serviço}}", "{{data}}", "{{organização}}"],
  },
  CANCELLATION: {
    label: "Cancelamento",
    description: "Enviada quando um agendamento é cancelado",
    variables: ["{{nome}}", "{{serviço}}", "{{data}}"],
  },
  REMINDER: {
    label: "Lembrete (24h antes)",
    description: "Enviada 24 horas antes do agendamento",
    variables: ["{{nome}}", "{{serviço}}", "{{data}}", "{{organização}}"],
  },
};

// ============================================================
// TEMPLATE ENGINE (pure function — sem side effects)
// ============================================================

/**
 * Substitui {{variáveis}} no template pelo valor correspondente.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value),
    template
  );
}
