"use client";

import { Check, X, Zap } from "lucide-react";
import type { Plan } from "@/lib/asaas/plans";
import { formatPrice } from "@/lib/asaas/plans";

interface PricingCardProps {
  plan: Plan;
  isAuthenticated: boolean;
}

export function PricingCard({ plan, isAuthenticated }: PricingCardProps) {
  const handleSubscribe = () => {
    if (!isAuthenticated) {
      window.location.href = `/register?plan=${plan.id}`;
      return;
    }
    window.location.href = `/dashboard/checkout?planId=${plan.id}`;
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        plan.highlighted
          ? "border-transparent bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white"
          : "border-surface-border bg-surface-card text-foreground"
      }`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
            <Zap className="h-3 w-3" />
            {plan.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3
          className={`text-xl font-bold ${plan.highlighted ? "text-white" : "text-foreground"}`}
        >
          {plan.name}
        </h3>
        <p
          className={`mt-2 text-sm leading-relaxed ${plan.highlighted ? "text-violet-200" : "text-muted-foreground"}`}
        >
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-5xl font-extrabold tracking-tight ${plan.highlighted ? "text-white" : "text-foreground"}`}
          >
            {formatPrice(plan.priceMonthly)}
          </span>
          <span
            className={`text-sm font-medium ${plan.highlighted ? "text-violet-200" : "text-muted-foreground"}`}
          >
            /mês
          </span>
        </div>
        <p
          className={`mt-1 text-xs ${plan.highlighted ? "text-violet-300" : "text-muted-foreground"}`}
        >
          Inclui {plan.trialDays} dias grátis — PIX, cartão ou boleto
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleSubscribe}
        className={`mb-8 w-full rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
          plan.highlighted
            ? "bg-white text-violet-700 shadow-lg hover:bg-violet-50 hover:shadow-xl"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg"
        }`}
      >
        {plan.ctaLabel}
      </button>

      {/* Features */}
      <ul className="flex flex-col gap-3">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-3 text-sm">
            {feature.included ? (
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                  plan.highlighted
                    ? "bg-white/20 text-white"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : (
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <X className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
            <span
              className={`${!feature.included ? "opacity-50 line-through" : ""} ${
                plan.highlighted ? "text-violet-100" : "text-muted-foreground"
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
