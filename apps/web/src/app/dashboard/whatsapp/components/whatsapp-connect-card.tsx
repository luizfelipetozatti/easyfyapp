"use client";

// ============================================================
// Easyfy - WhatsApp Connection Component
// Gerencia o fluxo de conexão por QR Code com polling automático.
// ============================================================

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@easyfyapp/ui";
import { CheckCircle2, Loader2, RefreshCw, Smartphone, Unlink, WifiOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  reconfigureWebhook,
  refreshQrCode,
  type ConnectionStatus,
  type WhatsAppConnectionState,
} from "@/app/actions/whatsapp-connection";

// ============================================================
// TYPES
// ============================================================

interface Props {
  initialState: WhatsAppConnectionState;
}

// ============================================================
// CONSTANTS
// ============================================================

const POLL_INTERVAL_MS = 8000;
const QR_EXPIRY_MS = 60000; // QR Code expira em ~60s

// ============================================================
// COMPONENT
// ============================================================

export function WhatsAppConnectCard({ initialState }: Props) {
  const router = useRouter();
  const [state, setState] = useState<WhatsAppConnectionState>(initialState);
  const [qrCode, setQrCode] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldPollRef = useRef(false);

  const stopPolling = useCallback(() => {
    shouldPollRef.current = false; // bloqueia callbacks em flight
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const handleConnected = useCallback((instanceName?: string | null) => {
    stopPolling();
    setQrCode(undefined);
    setState((prev) => ({ status: "open", instanceName: instanceName ?? prev.instanceName }));
    router.refresh();
  }, [stopPolling, router]);

  const startPolling = useCallback(() => {
    shouldPollRef.current = true;
    setIsPolling(true);
    pollRef.current = setInterval(async () => {
      if (!shouldPollRef.current) return; // callback antigo ainda em flight — ignora

      const result = await refreshQrCode();

      if (!shouldPollRef.current) return; // stopPolling foi chamado enquanto aguardava

      if (result.status === "open") {
        handleConnected();
        return;
      }

      // Instância deletada ou erro não-recuperável — para polling e atualiza
      if (result.status === "error") {
        stopPolling();
        setQrCode(undefined);
        setState({ status: "not_created", instanceName: null });
        router.refresh();
        return;
      }

      if (result.qrCode) {
        setQrCode(result.qrCode);
      }
    }, POLL_INTERVAL_MS);

    setTimeout(stopPolling, QR_EXPIRY_MS);
  }, [handleConnected, stopPolling, router]);

  // Sincroniza estado local quando o servidor re-renderiza (após router.refresh())
  // Não sobrescreve se já estamos em "open" — evita race condition onde o servidor
  // ainda retorna "connecting" enquanto a conexão acaba de ser estabelecida.
  useEffect(() => {
    setState((prev) => {
      if (prev.status === "open" && initialState.status !== "open") return prev;
      return initialState;
    });
  }, [initialState]);

  // Auto-inicia polling se a página carregou no meio de uma conexão
  useEffect(() => {
    if (initialState.status === "connecting") {
      startPolling();
    }
  }, [initialState.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  function handleConnect() {
    startTransition(async () => {
      const result = await connectWhatsApp();
      if (!result.success) return;

      // Instância já estava conectada (ex: evolutionInstance estava null no banco)
      if (result.alreadyConnected) {
        handleConnected(result.instanceName);
        return;
      }

      if (result.qrCode) {
        setQrCode(result.qrCode);
        setState((prev) => ({ ...prev, status: "connecting", instanceName: result.instanceName ?? null }));
        startPolling();
      }
    });
  }

  function handleReconfigureWebhook() {
    startTransition(async () => {
      const result = await reconfigureWebhook();
      if (result.success) {
        toast.success("Webhook sincronizado!", {
          description: "A Evolution API agora vai encaminhar as respostas dos clientes.",
        });
      } else {
        toast.error("Erro ao sincronizar webhook", {
          description: result.error ?? "Tente novamente.",
        });
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      stopPolling();
      setQrCode(undefined);
      const result = await disconnectWhatsApp();
      // Só atualiza o layout após confirmar que a desconexão ocorreu
      if (result.success) {
        setState({ status: "not_created", instanceName: null });
      }
      router.refresh();
    });
  }

  function handleRefreshQr() {
    startTransition(async () => {
      const result = await refreshQrCode();
      if (result.status === "open") {
        handleConnected();
        return;
      }
      if (result.status === "error") {
        stopPolling();
        setQrCode(undefined);
        setState({ status: "not_created", instanceName: null });
        router.refresh();
        return;
      }
      if (result.qrCode) setQrCode(result.qrCode);
    });
  }

  // ============================================================
  // RENDER STATES
  // ============================================================

  if (state.status === "open") {
    return <ConnectedState instanceName={state.instanceName} onDisconnect={handleDisconnect} onReconfigureWebhook={handleReconfigureWebhook} isPending={isPending} />;
  }

  if (state.status === "connecting" || qrCode) {
    return (
      <QrCodeState
        qrCode={qrCode}
        isPolling={isPolling}
        isPending={isPending}
        onRefresh={handleRefreshQr}
        onCancel={handleDisconnect}
      />
    );
  }

  return <DisconnectedState onConnect={handleConnect} isPending={isPending} />;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function DisconnectedState({
  onConnect,
  isPending,
}: {
  onConnect: () => void;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-12 text-center sm:flex-row sm:text-left sm:py-8">
        <div className="shrink-0 rounded-2xl bg-muted p-5">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold">Nenhum número conectado</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Conecte o WhatsApp do seu negócio para enviar confirmações de agendamento e lembretes automáticos aos clientes.
          </p>
        </div>
        <Button onClick={onConnect} disabled={isPending} size="lg" className="shrink-0">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Smartphone className="mr-2 h-4 w-4" />
          )}
          Conectar WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}

function QrCodeState({
  qrCode,
  isPolling,
  isPending,
  onRefresh,
  onCancel,
}: {
  qrCode?: string;
  isPolling: boolean;
  isPending: boolean;
  onRefresh: () => void;
  onCancel: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:items-start">
        {/* QR Code */}
        <div className="shrink-0">
          {qrCode ? (
            <div className="relative rounded-xl border p-3 shadow-sm">
              <Image
                src={qrCode}
                alt="QR Code WhatsApp"
                width={200}
                height={200}
                unoptimized
              />
              {isPolling && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  verificando...
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-xl border bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-4 text-center sm:text-left">
          <div>
            <p className="text-lg font-semibold">Escaneie o QR Code</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Abra o WhatsApp no celular e escaneie com a câmera.
            </p>
          </div>
          <ol className="space-y-1.5 text-sm text-muted-foreground text-left">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">1</span>
              Abra o WhatsApp no celular
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">2</span>
              Toque em <strong className="text-foreground">Dispositivos conectados</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">3</span>
              Toque em <strong className="text-foreground">Conectar dispositivo</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">4</span>
              Aponte a câmera para o QR Code ao lado
            </li>
          </ol>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isPending}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Atualizar QR
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectedState({
  instanceName,
  onDisconnect,
  onReconfigureWebhook,
  isPending,
}: {
  instanceName: string | null;
  onDisconnect: () => void;
  onReconfigureWebhook: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="border-green-200 dark:border-green-800/40">
      <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row">
        <div className="shrink-0 rounded-2xl bg-green-50 p-5 dark:bg-green-900/20">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
            WhatsApp conectado
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirmações e lembretes serão enviados automaticamente pelo seu número.
          </p>
          {instanceName && (
            <p className="mt-1.5 text-xs text-muted-foreground/60 font-mono">
              {instanceName}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onReconfigureWebhook}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Sincronizar Webhook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={isPending}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800/40 dark:text-red-400"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Unlink className="mr-1.5 h-3.5 w-3.5" />
            )}
            Desconectar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
