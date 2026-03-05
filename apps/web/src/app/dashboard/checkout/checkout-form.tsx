"use client";

// ============================================================
// Easyfy - CheckoutForm
// Formulário de checkout para coleta de dados antes da assinatura
// ============================================================

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  User,
  Phone,
  Calendar,
  ArrowRight,
  Shield,
  Lock,
  CheckCircle2,
  Zap,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { Plan } from "@/lib/asaas/plans";
import { formatPrice } from "@/lib/asaas/plans";

// ============================================================
// HELPERS — máscaras
// ============================================================

function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function unmask(value: string): string {
  return value.replace(/\D/g, "");
}

function validateCpfCnpj(value: string): boolean {
  const digits = unmask(value);
  return digits.length === 11 || digits.length === 14;
}

// ============================================================
// TYPES
// ============================================================

interface CheckoutFormProps {
  plan: Plan;
  ownerName: string;
  ownerEmail: string;
}

const DUE_DAY_OPTIONS = [1, 5, 10, 15, 20, 25];

// ============================================================
// COMPONENT
// ============================================================

export function CheckoutForm({ plan, ownerName, ownerEmail }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");

  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [dueDay, setDueDay] = useState(10);

  const cpfCnpjDigits = unmask(cpfCnpj);
  const isValidDocument = validateCpfCnpj(cpfCnpj);
  const documentType = cpfCnpjDigits.length <= 11 ? "CPF" : "CNPJ";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValidDocument) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          cpfCnpj: cpfCnpjDigits,
          phone: unmask(phone) || undefined,
          dueDay,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao processar.");

      // Abre o checkout Asaas em nova aba e exibe tela de aguardo
      setPaymentUrl(data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
      setWaitingPayment(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao iniciar assinatura.");
    } finally {
      setLoading(false);
    }
  };

  // Polling: verifica a cada 4s se o pagamento foi confirmado
  useEffect(() => {
    if (!waitingPayment) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/asaas/payment-status");
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "ACTIVE" || status === "TRIALING") {
          clearInterval(interval);
          router.push("/dashboard");
        }
      } catch {
        // silencia erros de rede — tenta na próxima rodada
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [waitingPayment, router]);

  // ── Tela de aguardo de pagamento ──
  if (waitingPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Aguardando confirmação do pagamento
        </h2>
        <p className="mb-1 max-w-sm text-sm text-muted-foreground">
          Finalize o pagamento na janela que foi aberta. Esta página será atualizada
          automaticamente assim que o pagamento for identificado.
        </p>
        <p className="mb-8 text-xs text-muted-foreground">
          Pode levar alguns instantes após a confirmação.
        </p>

        <button
          type="button"
          onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
          className="flex items-center gap-2 rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir página de pagamento novamente
        </button>

        <button
          type="button"
          onClick={() => setWaitingPayment(false)}
          className="mt-3 text-xs text-muted-foreground hover:underline"
        >
          Voltar ao formulário
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* ── Left: Plan Summary ── */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Plano selecionado
              </p>
              <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6 rounded-xl bg-gray-50 p-4">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(plan.priceMonthly)}
              </span>
              <span className="mb-1 text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="mt-1 text-sm text-violet-600 font-medium">
              {plan.trialDays} dias grátis — sem cobrança agora
            </p>
          </div>

          {/* Features */}
          <ul className="mb-6 space-y-2.5">
            {plan.features.filter((f) => f.included).map((feature) => (
              <li key={feature.text} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-violet-500" />
                {feature.text}
              </li>
            ))}
          </ul>

          {/* Security badges */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              Pagamento seguro via Asaas
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-green-500" />
              Cancele a qualquer momento
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Account info (read-only) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <User className="h-4 w-4 text-violet-600" />
              Dados da conta
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nome
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                  {ownerName}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  E-mail
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 truncate">
                  {ownerEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Document */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CreditCard className="h-4 w-4 text-violet-600" />
              Identificação fiscal
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="cpfCnpj" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  CPF ou CNPJ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="cpfCnpj"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                    required
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/20 ${
                      cpfCnpj && !isValidDocument
                        ? "border-red-300 bg-red-50 focus:border-red-400"
                        : cpfCnpj && isValidDocument
                        ? "border-green-300 bg-green-50 focus:border-green-400"
                        : "border-gray-200 bg-white focus:border-violet-400"
                    }`}
                  />
                  {cpfCnpj && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                      isValidDocument ? "text-green-600" : "text-red-400"
                    }`}>
                      {isValidDocument ? documentType + " ✓" : "inválido"}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Necessário para emissão de cobranças pelo Asaas (regulamentação do Banco Central).
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Telefone celular <span className="text-gray-400">(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="phone"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Usado para notificações de cobrança via WhatsApp/SMS.
                </p>
              </div>
            </div>
          </div>

          {/* Due day */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Calendar className="h-4 w-4 text-violet-600" />
              Dia de vencimento
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Dia do mês em que as cobranças serão geradas (após o período de teste).
            </p>
            <div className="flex flex-wrap gap-2">
              {DUE_DAY_OPTIONS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDueDay(day)}
                  className={`h-10 w-12 rounded-lg text-sm font-medium transition-all ${
                    dueDay === day
                      ? "bg-violet-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:text-violet-600"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Primeiro vencimento: após {plan.trialDays} dias de teste, dia{" "}
              <strong className="text-gray-700">{dueDay}</strong> do mês seguinte.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isValidDocument}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processando...
              </>
            ) : (
              <>
                Continuar para o pagamento
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Uma nova aba será aberta com o Asaas para escolher entre PIX, boleto ou cartão.
            <br />
            Nenhuma cobrança é feita durante os {plan.trialDays} dias de teste.
          </p>
        </form>
      </div>
    </div>
  );
}

