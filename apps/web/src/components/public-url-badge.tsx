"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "@easyfyapp/ui";
import { toast } from "sonner";
import { useState } from "react";

interface PublicUrlBadgeProps {
  url: string;
  compact?: boolean;
}

/**
 * Componente compacto para exibir URL pública com botão de copiar
 * Ideal para cards, headers ou contextos com espaço limitado
 */
export function PublicUrlBadge({ url, compact = false }: PublicUrlBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
        title={url}
      >
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        <span className="max-w-xs truncate">{url}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-mono text-blue-900 dark:text-blue-100">
          {url}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="gap-2 transition-all duration-200"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">Copiado</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copiar</span>
          </>
        )}
      </Button>
    </div>
  );
}
