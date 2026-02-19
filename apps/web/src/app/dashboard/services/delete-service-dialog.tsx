"use client";

import { useState } from "react";
import { Button } from "@easyfyapp/ui";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteService } from "@/app/actions/services";

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: { id: string; name: string } | null;
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
}: DeleteServiceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!service) return;
    setIsDeleting(true);

    try {
      const result = await deleteService(service.id);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open || !service) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onOpenChange(false);
      }}
    >
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md border border-border">
        {/* Header */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Excluir serviço</h2>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Tem certeza que deseja excluir o serviço{" "}
            <strong className="text-foreground">"{service.name}"</strong>?{" "}
            Se houver agendamentos vinculados, você precisa desativar o serviço
            em vez de excluí-lo.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir serviço"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
