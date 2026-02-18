"use client";

import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Share2,
  Check,
  MessageCircle,
  Mail,
  Twitter,
  Linkedin,
  X,
} from "lucide-react";
import { Button } from "@easyfyapp/ui";
import { toast } from "sonner";
import { cn } from "@easyfyapp/ui";

interface ShareMenuProps {
  url: string;
  title?: string;
  text?: string;
}

export function ShareMenu({ url, title = "Agende comigo", text = "Clique para agendar" }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleCopyViaLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const shareOptions = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      action: () => {
        const message = encodeURIComponent(`${text}\n\n${url}`);
        window.open(`https://wa.me/?text=${message}`, "_blank");
        setIsOpen(false);
      },
    },
    {
      label: "Email",
      icon: Mail,
      action: () => {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`${text}\n\n${url}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
        setIsOpen(false);
      },
    },
    {
      label: "Twitter/X",
      icon: Twitter,
      action: () => {
        const text_encoded = encodeURIComponent(`${text} ${url}`);
        window.open(`https://twitter.com/intent/tweet?text=${text_encoded}`, "_blank");
        setIsOpen(false);
      },
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      action: () => {
        const url_encoded = encodeURIComponent(url);
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${url_encoded}`,
          "_blank"
        );
        setIsOpen(false);
      },
    },
    {
      label: "Copiar Link",
      icon: Copy,
      action: handleCopyViaLink,
      border: true,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        aria-label="Mais opções de compartilhamento"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Mais</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col">
            {shareOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.label}
                  onClick={option.action}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    index === 0 && "rounded-t-lg",
                    index === shareOptions.length - 1 && "rounded-b-lg",
                    option.border && "border-t border-gray-200 dark:border-gray-700"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  {option.label === "Copiar Link" && copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <span>{option.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
