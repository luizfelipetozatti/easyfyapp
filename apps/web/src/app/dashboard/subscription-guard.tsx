"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Rotas acessíveis mesmo com assinatura cancelada
const EXEMPT_PATHS = ["/dashboard/billing", "/dashboard/checkout"];

interface SubscriptionGuardProps {
  isCanceled: boolean;
  children: React.ReactNode;
}

export function SubscriptionGuard({ isCanceled, children }: SubscriptionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isCanceled) return;
    const isExempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));
    if (!isExempt) {
      router.replace("/reactivate");
    }
  }, [isCanceled, pathname, router]);

  return <>{children}</>;
}
