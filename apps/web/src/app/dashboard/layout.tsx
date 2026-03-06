import { Button, Logo } from "@easyfyapp/ui";
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Briefcase,
  LogOut,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@easyfyapp/database";
import { signOut } from "@/app/actions/auth";
import { SubscriptionGuard } from "./subscription-guard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar status da assinatura
  const member = await prisma.organizationMember.findFirst({
    where: { user: { supabaseId: user.id } },
    select: {
      organization: {
        select: {
          subscription: {
            select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
          },
        },
      },
    },
  });
  const sub = member?.organization?.subscription;
  const subscriptionStatus = sub?.status;
  // Bloqueia apenas quando CANCELED/PAUSED E o período pago já expirou
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const periodExpired = !periodEnd || periodEnd < new Date();
  const isCanceled =
    (subscriptionStatus === "CANCELED" || subscriptionStatus === "PAUSED") && periodExpired;

  return (
    <div className="flex min-h-screen">
      {/* Script para limpar flag de registro após carregar */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && sessionStorage.getItem('just_registered') === 'true') {
              const registeredAt = parseInt(sessionStorage.getItem('registered_at') || '0');
              const now = Date.now();
              // Manter flag por até 10 segundos
              if (now - registeredAt > 10000) {
                sessionStorage.removeItem('just_registered');
                sessionStorage.removeItem('registered_at');
              }
            }
          `,
        }}
      />
      
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Link href="/dashboard" className="flex items-center">
              <Logo className="h-10" />
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-4">
            <NavLink href="/dashboard" icon={LayoutDashboard}>
              Visão Geral
            </NavLink>
            <NavLink href="/dashboard/bookings" icon={Calendar}>
              Agendamentos
            </NavLink>
            <NavLink href="/dashboard/services" icon={Briefcase}>
              Serviços
            </NavLink>
            <NavLink href="/dashboard/whatsapp" icon={MessageCircle}>
              WhatsApp
            </NavLink>
            <NavLink href="/dashboard/settings" icon={Settings}>
              Configurações
            </NavLink>
            <NavLink href="/dashboard/billing" icon={CreditCard}>
              Assinatura
            </NavLink>
          </nav>

          {/* User */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">
                  {user.email}
                </p>
              </div>
              <form action={signOut}>
                <Button variant="ghost" size="icon" type="submit">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <SubscriptionGuard isCanceled={isCanceled}>
            {children}
          </SubscriptionGuard>
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
