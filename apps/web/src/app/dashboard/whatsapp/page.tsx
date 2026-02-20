import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@easyfyapp/ui";
import { MessageCircle, Webhook, AlertCircle } from "lucide-react";
import { getWhatsAppTemplates } from "@/app/actions/whatsapp-templates";
import { TemplateManager } from "./components/template-manager";
import { CopyUrlButton } from "./components/copy-url-button";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  const [templates] = await Promise.all([getWhatsAppTemplates()]);

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp`;
  const isEvolutionConfigured = !!(
    process.env.EVOLUTION_API_URL &&
    process.env.EVOLUTION_API_KEY &&
    process.env.EVOLUTION_INSTANCE
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Configuração da integração com Evolution API e templates de mensagem
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-whatsapp" />
              Status da Conexão
            </CardTitle>
            <CardDescription>
              Verifique se a instância do WhatsApp está configurada
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEvolutionConfigured ? (
              <div className="flex items-start gap-3 rounded-lg border border-whatsapp/20 bg-whatsapp/5 p-4">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-whatsapp ring-4 ring-whatsapp/20" />
                <div>
                  <p className="text-sm font-medium text-whatsapp">
                    Integração configurada
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Variáveis de ambiente detectadas. Verifique o status da
                    instância na Evolution API.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Integração não configurada
                  </p>
                  <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/70">
                    Configure as variáveis de ambiente:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      "EVOLUTION_API_URL",
                      "EVOLUTION_API_KEY",
                      "EVOLUTION_INSTANCE",
                    ].map((env) => (
                      <code
                        key={env}
                        className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-mono text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      >
                        {env}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook URL
            </CardTitle>
            <CardDescription>
              Configure este URL na sua instância Evolution API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CopyUrlButton url={webhookUrl} />
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Eventos recomendados:
                </span>{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">
                  messages.upsert
                </code>
                ,{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">
                  messages.update
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Manager */}
      <TemplateManager initialTemplates={templates} />
    </div>
  );
}
