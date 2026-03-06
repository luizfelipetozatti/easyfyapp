// ============================================================
// Easyfy - Planos de Assinatura (Asaas)
// Configuração centralizada dos planos disponíveis
// ============================================================

import type { AsaasBillingType, AsaasCycle } from "./types";

export type PlanInterval = "month" | "year";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  badge?: string;
  /** Valor em centavos (BRL) — usado apenas para exibição */
  priceMonthly: number;
  /** Valor em reais para a API do Asaas */
  billingValue: number;
  /** Ciclo de cobrança no Asaas */
  billingCycle: AsaasCycle;
  /** Método de pagamento preferido (UNDEFINED = usuário escolhe) */
  billingType: AsaasBillingType;
  /** Quantos dias antes da 1ª cobrança (trial gratuito) */
  trialDays: number;
  interval: PlanInterval;
  features: PlanFeature[];
  highlighted: boolean;
  ctaLabel: string;
}

export const PLANS: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    description:
      "Tudo que você precisa para gerenciar agendamentos com profissionalismo.",
    badge: "Mais popular",
    priceMonthly: 9700, // R$ 97,00 em centavos — exibição
    billingValue: 97.0, // R$ 97,00 — enviado à API Asaas
    billingCycle: "MONTHLY",
    billingType: "UNDEFINED", // Usuário escolhe: cartão, PIX ou boleto
    trialDays: 7,
    interval: "month",
    highlighted: true,
    ctaLabel: "Assinar agora",
    features: [
      { text: "Agendamentos ilimitados", included: true },
      { text: "Página pública de agendamento", included: true },
      { text: "Confirmação automática via WhatsApp", included: true },
      { text: "Lembretes de agendamento via WhatsApp", included: true },
      { text: "Dashboard completo de gestão", included: true },
      { text: "Cadastro de serviços e preços", included: true },
      { text: "Configuração de horários disponíveis", included: true },
      { text: "Bloqueio de dias e intervalos", included: true },
      { text: "Templates personalizáveis de mensagem", included: true },
      { text: "Suporte por e-mail", included: true },
    ],
  },
];

export const getActivePlan = (): Plan => PLANS[0];

export const getPlanById = (id: string): Plan | undefined =>
  PLANS.find((p) => p.id === id);

export const formatPrice = (cents: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
