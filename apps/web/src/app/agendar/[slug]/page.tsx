import { prisma } from "@easyfyapp/database";
import { addMonths } from "date-fns";
import { Calendar } from "lucide-react";
import { notFound } from "next/navigation";

import { BookingPageClient } from "./booking-client";

export const dynamic = 'force-dynamic';

// Mapeamento enum DayOfWeek → getDay() (0=Dom, 6=Sáb)
const DAY_ENUM_TO_JS: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

interface BookingPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: BookingPageProps) {
  const org = await prisma.organization.findFirst({
    where: { 
      slug: params.slug,
      status: "ACTIVE",
    },
  });

  if (!org) return { title: "Não encontrado" };

  return {
    title: `Agendar - ${org.name} | Easyfy`,
    description: `Agende seu horário em ${org.name}`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const today = new Date();
  const sixMonthsFromNow = addMonths(today, 6);

  const org = await prisma.organization.findFirst({
    where: { 
      slug: params.slug,
      status: "ACTIVE",
    },
    include: {
      services: {
        where: { active: true },
        orderBy: { name: "asc" },
      },
      workingHours: {
        select: { dayOfWeek: true, isWorking: true },
      },
      unavailableDays: {
        where: { date: { gte: today, lte: sixMonthsFromNow } },
        select: { date: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!org) {
    notFound();
  }

  // Números JS (0=Dom...6=Sáb) dos dias em que a org NÃO trabalha
  const nonWorkingDayNumbers = org.workingHours
    .filter((wh) => !wh.isWorking)
    .map((wh) => DAY_ENUM_TO_JS[wh.dayOfWeek])
    .filter((n): n is number => n !== undefined);

  // Datas específicas bloqueadas (YYYY-MM-DD) dentro dos próximos 6 meses
  // Garantir que as datas sejam no formato local (não UTC)
  // O Prisma retorna @db.Date como Date UTC, então usar getUTC* para extrair a data correta
  const unavailableDates = org.unavailableDays.map((d) => {
    const dateObj = d.date instanceof Date ? d.date : new Date(d.date);
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-3 px-4 py-6">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um serviço e agende seu horário
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <BookingPageClient
          organization={{
            id: org.id,
            name: org.name,
            slug: org.slug,
            timezone: org.timezone,
          }}
          services={org.services.map((s: typeof org.services[number]) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: Number(s.price),
            durationMinutes: s.durationMinutes,
          }))}
          nonWorkingDayNumbers={nonWorkingDayNumbers}
          unavailableDates={unavailableDates}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <a href="/" className="font-medium text-primary hover:underline">
          Easyfy
        </a>
      </footer>
    </div>
  );
}
