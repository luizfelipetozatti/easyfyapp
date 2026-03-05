"use client";

// ============================================================
// Easyfy - BillingCard (Asaas)
// Exibe o status da assinatura e permite assinar ou cancelar
// ============================================================

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  CreditCard,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { Plan } from "@/lib/asaas/plans";
import { formatPrice } from "@/lib/asaas/plans";

// ============================================================
// TYPES
// ============================================================

type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "CANCELED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "PAST_DUE"
  | "UNPAID"
  | "PAUSED";

interface SubscriptionData {
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  canceledAt: string | null;
}

interface BillingCardProps {
  subscription: SubscriptionData | null;
  plan: Plan;
  ownerEmail: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCard({
  subscription,
  plan,
  ownerEmail,
}: BillingCardProps) {
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // -- Subscribe: redireciona para página de checkout --
  const handleSubscribe = () => {
    window.location.href = `/dashboard/checkout?planId=${plan.id}`;
  };

  // -- Cancel --
  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/asaas/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Assinatura cancelada com sucesso.");
      setShowCancelConfirm(false);
      window.location.reload();
    } catch {
      toast.error("Nao foi possivel cancelar a assinatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isActive =
    subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  const periodEnd = subscription
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const trialEnd = subscription?.trialEnd
    ? new Date(subscription.trialEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const canceledAtFormatted = subscription?.canceledAt
    ? new Date(subscription.canceledAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status Card */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Status da Assinatura</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vinculado ao e-mail:{" "}
                <span className="font-medium text-foreground">{ownerEmail}</span>
              </p>
            </div>
            <StatusBadge status={subscription?.status ?? null} />
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {subscription ? (
              <>
                {/* Plan Info */}
                <div className="rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Plano {plan.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(plan.priceMonthly)}/mes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trial info */}
                {subscription.status === "TRIALING" && trialEnd && (
                  <InfoRow
                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                    label="Trial gratuito ativo ate"
                    value={trialEnd}
                    highlight
                  />
                )}

                {/* Period / next billing — não exibir para assinaturas canceladas */}
                {periodEnd && subscription.status !== "CANCELED" && (
                  <InfoRow
                    icon={<CreditCard className="h-4 w-4 text-violet-500" />}
                    label={
                      subscription.cancelAtPeriodEnd
                        ? "Acesso até"
                        : "Próxima cobrança"
                    }
                    value={periodEnd}
                  />
                )}

                {/* Canceled info */}
                {subscription.status === "CANCELED" && canceledAtFormatted && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Assinatura cancelada em <strong>{canceledAtFormatted}</strong>.</span>
                  </div>
                )}

                {/* Reactivate button for CANCELED */}
                {subscription.status === "CANCELED" && (
                  <button
                    onClick={handleSubscribe}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 self-start"
                  >
                    <Zap className="h-4 w-4" />
                    Reasinar plano
                  </button>
                )}

                {/* Cancel warning */}
                {subscription.cancelAtPeriodEnd && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Sua assinatura sera cancelada ao final do periodo atual.
                    </span>
                  </div>
                )}

                {/* Cancel button */}
                {isActive && !subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 self-start"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar assinatura
                  </button>
                )}
              </>
            ) : (
              /* No subscription CTA */
              <div className="flex flex-col items-start gap-4">
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
                  <p className="font-medium">
                    Voce ainda nao tem uma assinatura ativa.
                  </p>
                  <p className="mt-1 text-orange-600">
                    Assine o plano Standard para ter acesso completo a
                    plataforma. Comece com {plan.trialDays} dias gratis.
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Assinar plano {plan.name} - {formatPrice(plan.priceMonthly)}/mes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features Card */}
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">
            Incluido no seu plano
          </h3>
          <ul className="space-y-3">
            {plan.features
              .filter((f) => f.included)
              .map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                  <span className="text-muted-foreground">{feature.text}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Cancel Confirm Modal — renderizado via Portal diretamente no body */}
      {mounted && showCancelConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCancelConfirm(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-surface-border bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cancelar assinatura?
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Ao cancelar, você perderá o acesso à plataforma imediatamente. Esta
              ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-gray-50 disabled:opacity-70"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Cancelando...
                  </span>
                ) : (
                  "Confirmar cancelamento"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: SubscriptionStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        <XCircle className="h-3.5 w-3.5" />
        Sem assinatura
      </span>
    );
  }

  const config: Record<
    SubscriptionStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    ACTIVE: {
      label: "Ativa",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    TRIALING: {
      label: "Trial ativo",
      className: "bg-violet-100 text-violet-700",
      icon: <Zap className="h-3.5 w-3.5" />,
    },
    CANCELED: {
      label: "Cancelada",
      className: "bg-red-100 text-red-700",
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
    PAST_DUE: {
      label: "Pagamento pendente",
      className: "bg-amber-100 text-amber-700",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    INCOMPLETE: {
      label: "Incompleta",
      className: "bg-amber-100 text-amber-700",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    INCOMPLETE_EXPIRED: {
      label: "Expirada",
      className: "bg-red-100 text-red-700",
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
    UNPAID: {
      label: "Nao paga",
      className: "bg-red-100 text-red-700",
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
    PAUSED: {
      label: "Pausada",
      className: "bg-gray-100 text-gray-600",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  };

  const { label, className, icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl p-3 ${
        highlight ? "bg-amber-50 border border-amber-100" : "bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
