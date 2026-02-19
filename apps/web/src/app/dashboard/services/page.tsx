import { prisma } from "@easyfyapp/database";
import { Briefcase } from "lucide-react";

// Force dynamic rendering (no static generation at build time)
export const dynamic = "force-dynamic";

import { getCurrentUserOrgId } from "@/lib/auth/dashboard";
import { ServiceCard } from "./service-card";
import { NewServiceButton } from "./new-service-button";

// ============================================================
// PAGE
// ============================================================

export default async function ServicesPage() {
  const orgId = await getCurrentUserOrgId();

  const services = await prisma.service.findMany({
    where: { organizationId: orgId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { bookings: true } },
    },
  });

  const activeCount = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela sua organização
          </p>
        </div>
        <NewServiceButton />
      </div>

      {/* Summary stats */}
      {services.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{services.length}</strong>{" "}
            {services.length === 1 ? "serviço" : "serviços"} no total
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{activeCount}</strong>{" "}
            {activeCount === 1 ? "ativo" : "ativos"}
          </span>
        </div>
      )}

      {/* Services grid */}
      {services.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={{
                id: service.id,
                name: service.name,
                description: service.description,
                price: Number(service.price),
                durationMinutes: service.durationMinutes,
                active: service.active,
                bookingsCount: service._count.bookings,
              }}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Briefcase className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum serviço cadastrado</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Crie o primeiro serviço para que seus clientes possam agendar.
          </p>
          <div className="mt-6">
            <NewServiceButton />
          </div>
        </div>
      )}
    </div>
  );
}
