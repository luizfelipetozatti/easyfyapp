"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyUrlButtonProps {
  url: string;
}

export function CopyUrlButton({ url }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select input
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-lg border bg-muted/50 pl-3.5 pr-2 py-2.5">
      <code className="flex-1 truncate text-sm">{url}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        title="Copiar URL"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-whatsapp" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
