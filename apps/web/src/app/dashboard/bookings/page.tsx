import { prisma } from "@easyfyapp/database";

// Force dynamic rendering (no static generation at build time)
export const dynamic = "force-dynamic";

import { getCurrentUserOrgId } from "@/lib/auth/dashboard";

import { BookingsTable } from "./bookings-table";

export default async function BookingsPage() {
  const orgId = await getCurrentUserOrgId();

  const [bookings, services] = await Promise.all([
    prisma.booking.findMany({
      where: { organizationId: orgId },
      include: { service: { select: { id: true, name: true } } },
      orderBy: { startTime: "desc" },
    }),
    prisma.service.findMany({
      where: { organizationId: orgId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os agendamentos da sua organização
        </p>
      </div>

      <BookingsTable bookings={bookings} services={services} />
    </div>
  );
}
