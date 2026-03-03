import { getWhatsAppTemplates } from "@/app/actions/whatsapp-templates";
import { getWhatsAppConnectionState } from "@/app/actions/whatsapp-connection";
import { TemplateManager } from "./components/template-manager";
import { WhatsAppConnectCard } from "./components/whatsapp-connect-card";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  const [templates, connectionState] = await Promise.all([
    getWhatsAppTemplates(),
    getWhatsAppConnectionState(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecte seu número e personalize as mensagens enviadas aos clientes
        </p>
      </div>

      <WhatsAppConnectCard initialState={connectionState} />

      <TemplateManager initialTemplates={templates} />
    </div>
  );
}
