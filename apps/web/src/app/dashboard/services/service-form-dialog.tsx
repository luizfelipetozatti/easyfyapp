"use client";

import { useState, useTransition, useEffect } from "react";
import { Button, Input, Label } from "@easyfyapp/ui";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createService, updateService } from "@/app/actions/services";

// ============================================================
// TYPES
// ============================================================

interface ServiceFormValues {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    durationMinutes: number;
  } | null;
}

const EMPTY_FORM: ServiceFormValues = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "60",
};

// ============================================================
// DURATION PRESETS
// ============================================================

const DURATION_PRESETS = [
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "45 min", value: "45" },
  { label: "1h", value: "60" },
  { label: "1h30", value: "90" },
  { label: "2h", value: "120" },
];

// ============================================================
// COMPONENT
// ============================================================

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
}: ServiceFormDialogProps) {
  const isEditing = !!service;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ServiceFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<ServiceFormValues>>({});

  // Populate form when editing
  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description ?? "",
        price: String(service.price),
        durationMinutes: String(service.durationMinutes),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [service, open]);

  const validate = (): boolean => {
    const newErrors: Partial<ServiceFormValues> = {};

    if (!form.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (form.name.length > 100) {
      newErrors.name = "Nome deve ter no máximo 100 caracteres";
    }

    if (form.description.length > 500) {
      newErrors.description = "Descrição deve ter no máximo 500 caracteres";
    }

    const price = parseFloat(form.price.replace(",", "."));
    if (form.price === "" || isNaN(price)) {
      newErrors.price = "Preço é obrigatório";
    } else if (price < 0) {
      newErrors.price = "Preço não pode ser negativo";
    } else if (price > 99999.99) {
      newErrors.price = "Preço muito alto";
    }

    const duration = parseInt(form.durationMinutes);
    if (!form.durationMinutes || isNaN(duration)) {
      newErrors.durationMinutes = "Duração é obrigatória";
    } else if (duration < 5) {
      newErrors.durationMinutes = "Mínimo 5 minutos";
    } else if (duration > 480) {
      newErrors.durationMinutes = "Máximo 480 minutos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const input = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price.replace(",", ".")),
      durationMinutes: parseInt(form.durationMinutes),
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateService(service.id, input)
        : await createService(input);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
    });
  };

  const handleField = (field: keyof ServiceFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onOpenChange(false);
      }}
    >
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">
              {isEditing ? "Editar Serviço" : "Novo Serviço"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing
                ? "Altere as informações do serviço"
                : "Preencha os dados para criar um novo serviço"}
            </p>
          </div>
          <button
            onClick={() => !isPending && onOpenChange(false)}
            disabled={isPending}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="service-name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-name"
                placeholder="Ex: Corte de cabelo"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                disabled={isPending}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="service-description">Descrição</Label>
              <textarea
                id="service-description"
                placeholder="Descreva brevemente o serviço (opcional)"
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
                disabled={isPending}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <p className="text-xs text-destructive">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground">
                  {form.description.length}/500
                </span>
              </div>
            </div>

            {/* Price & Duration row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-1.5">
                <Label htmlFor="service-price">
                  Preço (R$) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="service-price"
                    type="number"
                    step="0.01"
                    min="0"
                    max="99999.99"
                    placeholder="0,00"
                    value={form.price}
                    onChange={(e) => handleField("price", e.target.value)}
                    disabled={isPending}
                    className="pl-9"
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price}</p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label htmlFor="service-duration">
                  Duração <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="service-duration"
                    type="number"
                    min="5"
                    max="480"
                    placeholder="60"
                    value={form.durationMinutes}
                    onChange={(e) => handleField("durationMinutes", e.target.value)}
                    disabled={isPending}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    min
                  </span>
                </div>
                {errors.durationMinutes && (
                  <p className="text-xs text-destructive">{errors.durationMinutes}</p>
                )}
              </div>
            </div>

            {/* Duration presets */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Duração rápida:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleField("durationMinutes", preset.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      form.durationMinutes === preset.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Criar serviço"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
