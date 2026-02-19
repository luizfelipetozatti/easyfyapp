import { AvailabilityConfig } from "@/components/availability";
import { getAvailabilityConfig } from "@/app/actions/availability";

export async function AvailabilityConfigServer() {
  const data = await getAvailabilityConfig();

  if (!data.success) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Erro ao carregar configurações de disponibilidade</p>
        <p className="mt-1 text-sm">{data.error}</p>
      </div>
    );
  }

  return <AvailabilityConfig initialData={data} />;
}
