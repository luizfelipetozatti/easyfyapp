"use client";

import { useState } from "react";
import { Copy, Check, Link } from "lucide-react";
import { Button } from "@easyfyapp/ui";
import { toast } from "sonner";
import { ShareMenu } from "./share-menu";

interface PublicUrlSectionProps {
  url: string;
  label?: string;
  description?: string;
}

export function PublicUrlSection({
  url,
  label = "URL de Agendamento",
  description = "Compartilhe esta URL com seus clientes para que eles possam agendar diretamente",
}: PublicUrlSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("URL copiada para a área de transferência!");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar URL");
      console.error("Erro ao copiar:", error);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
      <div className="flex items-center gap-2">
        <Link className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-50">
          {label}
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900">
          <p className="truncate text-sm text-gray-700 dark:text-gray-300 font-mono">
            {url}
          </p>
        </div>
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopyToClipboard}
          className="gap-2 transition-all duration-200"
          aria-label="Copiar URL"
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

        <ShareMenu 
          url={url}
          title="Agende comigo"
          text="Clique para agendar um horário"
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Dica: Envie esta URL para seus clientes via WhatsApp, email ou redes sociais
      </p>
    </div>
  );
}
