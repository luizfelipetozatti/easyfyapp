"use client";

import { useState, useTransition } from "react";
import { Badge, Button } from "@easyfyapp/ui";
import { Clock, DollarSign, Edit2, Trash2, MoreVertical, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { toggleServiceStatus } from "@/app/actions/services";
import { ServiceFormDialog } from "./service-form-dialog";
import { DeleteServiceDialog } from "./delete-service-dialog";

// ============================================================
// TYPES
// ============================================================

export interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    durationMinutes: number;
    active: boolean;
    bookingsCount: number;
  };
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ============================================================
// COMPONENT
// ============================================================

export function ServiceCard({ service }: ServiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isTogglingStatus, startToggle] = useTransition();

  const handleToggleStatus = () => {
    setMenuOpen(false);
    startToggle(async () => {
      const result = await toggleServiceStatus(service.id, !service.active);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    });
  };

  return (
    <>
      <div
        className={`group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
          !service.active ? "opacity-60" : ""
        }`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate pr-2">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={service.active ? "success" : "secondary"}>
              {service.active ? "Ativo" : "Inativo"}
            </Badge>

            {/* Context menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Opções"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-border bg-background shadow-lg py-1 text-sm">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={handleToggleStatus}
                      disabled={isTogglingStatus}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      {service.active ? (
                        <PowerOff className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                      {service.active ? "Desativar" : "Ativar"}
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4 mt-auto pt-3 border-t border-border/50 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            {formatCurrency(service.price)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(service.durationMinutes)}
          </span>
          <span className="ml-auto text-xs">
            {service.bookingsCount}{" "}
            {service.bookingsCount === 1 ? "agendamento" : "agendamentos"}
          </span>
        </div>
      </div>

      {/* Dialogs */}
      <ServiceFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        service={service}
      />
      <DeleteServiceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        service={service}
      />
    </>
  );
}
