import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@agendazap/ui";
import { MessageCircle, Webhook, ExternalLink } from "lucide-react";

export default function WhatsAppPage() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Configuração da integração com Evolution API
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-whatsapp" />
              Status da Conexão
            </CardTitle>
            <CardDescription>
              Verifique se a instância do WhatsApp está conectada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Configure as variáveis de ambiente{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">
                  EVOLUTION_API_URL
                </code>
                ,{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">
                  EVOLUTION_API_KEY
                </code>{" "}
                e{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">
                  EVOLUTION_INSTANCE
                </code>{" "}
                para ativar a integração.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook */}
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
          <CardContent>
            <div className="rounded-lg border bg-muted/50 p-3">
              <code className="break-all text-sm">{webhookUrl}</code>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Eventos recomendados: <strong>messages.upsert</strong>,{" "}
              <strong>messages.update</strong>
            </p>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Templates de Mensagem</CardTitle>
            <CardDescription>
              Mensagens automáticas enviadas aos clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TemplatePreview
              title="Confirmação de Agendamento"
              message={`Olá [nome]! 👋\n\nSeu agendamento para *[serviço]* na data *[data]* foi recebido!\n\n📍 *[organização]*\n💰 Valor: R$ [valor]\n\nPague o PIX para confirmar sua reserva.\n\n_Mensagem automática - AgendaZap_`}
            />
            <TemplatePreview
              title="Cancelamento"
              message={`Olá [nome],\n\nInformamos que seu agendamento para *[serviço]* em *[data]* foi *cancelado*.\n\nSe desejar reagendar, acesse nosso link.\n\n_Mensagem automática - AgendaZap_`}
            />
            <TemplatePreview
              title="Lembrete (24h antes)"
              message={`Lembrete: Olá [nome]! 🔔\n\nSua consulta/reserva para *[serviço]* é amanhã, *[data]*.\n\n📍 *[organização]*\n\nConfirme respondendo esta mensagem.\n\n_Mensagem automática - AgendaZap_`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TemplatePreview({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <pre className="whitespace-pre-wrap rounded-md bg-whatsapp-light/30 p-3 text-xs leading-relaxed dark:bg-whatsapp-dark/20">
        {message}
      </pre>
    </div>
  );
}
