import { prisma } from "@easyfyapp/database";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@easyfyapp/ui";
import { getCurrentUserOrgId } from "@/lib/auth/dashboard";
import { OrganizationForm } from "./organization-form";
import { DeleteOrganizationButton } from "./delete-organization-button";
import { AvailabilityConfigServer } from "@/components/availability/availability-config-server";

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const orgId = await getCurrentUserOrgId();
  
  const org = await prisma.organization.findUnique({
    where: { id: orgId }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Configure sua organização
        </p>
      </div>

      {org && (
        <OrganizationForm
          organization={{
            name: org.name,
            slug: org.slug,
            whatsappNumber: org.whatsappNumber,
          }}
        />
      )}

      {/* Disponibilidade */}
      <div>
        <div className="mb-1">
          <h2 className="text-xl font-semibold">Disponibilidade</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os horários e dias disponíveis para agendamentos
          </p>
        </div>
        <div className="mt-4">
          <AvailabilityConfigServer />
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis para sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteOrganizationButton organizationName={org.name} />
        </CardContent>
      </Card>
    </div>
  );
}
