import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assinatura Confirmada | Easyfy",
};

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-200">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>

        {/* Text */}
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Assinatura confirmada!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Bem-vindo ao Easyfy. Sua assinatura está ativa e você já tem acesso
          completo à plataforma.
        </p>

        {/* Trial info */}
        <div className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-violet-700">
            <Zap className="h-4 w-4" />
            7 dias de trial gratuito ativado
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Você não será cobrado durante o período de trial. Cancele quando
            quiser, sem cobranças.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
        >
          Ir para o Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="mt-4 text-xs text-muted-foreground">
          Você receberá um e-mail de confirmação em breve.
        </p>
      </div>
    </div>
  );
}
