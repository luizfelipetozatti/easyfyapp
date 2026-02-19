"use client";

import React, { useTransition, useState } from "react";
import { X, CalendarOff, Plus } from "lucide-react";
import { Button } from "@easyfyapp/ui";
import {
  addUnavailableDay,
  removeUnavailableDay,
} from "@/app/actions/availability";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

interface UnavailableDay {
  id: string;
  organizationId: string;
  date: Date | string;
  reason: string | null;
  createdAt: Date;
}

interface UnavailableDaysSectionProps {
  unavailableDays: UnavailableDay[];
}

export default function UnavailableDaysSection({
  unavailableDays: initialDays,
}: UnavailableDaysSectionProps) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [unavailableDays, setUnavailableDays] = useState(initialDays);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [addPending, startAddTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const handleAddDay = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg(null);
    startAddTransition(() => {
      addUnavailableDay({ success: false, error: "" }, formData).then((result) => {
        if (result.success === true) {
          setDate("");
          setReason("");
          setTimeout(() => window.location.reload(), 800);
        } else {
          setErrorMsg(result.error);
          setTimeout(() => setErrorMsg(null), 4000);
        }
      });
    });
  };

  const handleDeleteDay = (dayId: string) => {
    setUnavailableDays((prev) => prev.filter((d) => d.id !== dayId));
    startDeleteTransition(() => {
      removeUnavailableDay({ success: false, error: "" }, dayId).then((result) => {
        if (result.success !== true) {
          setUnavailableDays(initialDays);
        }
      });
    });
  };

  const sortedDays = [...unavailableDays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-3">
      {/* Formulário */}
      <form onSubmit={handleAddDay}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={addPending}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
          />
          <input
            type="text"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            disabled={addPending}
            className="min-w-[180px] flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
          />
          <Button
            type="submit"
            size="sm"
            disabled={addPending || !date}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {addPending ? "Adicionando…" : "Adicionar"}
          </Button>
        </div>
        {errorMsg && (
          <p className="mt-1.5 text-xs text-destructive">{errorMsg}</p>
        )}
      </form>

      {/* Lista */}
      {sortedDays.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {sortedDays.map((day, index) => {
            const isLast = index === sortedDays.length - 1;
            return (
              <div
                key={day.id}
                className={`group flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/40 ${
                  !isLast ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    // Parse date string or Date object while avoiding timezone issues
                    // O Prisma retorna @db.Date como Date UTC, então usar getUTC* para extrair a data correta
                    const dateObj = typeof day.date === 'string' 
                      ? new Date(day.date)
                      : (day.date instanceof Date ? day.date : new Date(String(day.date)));
                    
                    const dateStr = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(dateObj.getUTCDate()).padStart(2, '0')}`;
                    const [y, m, d] = dateStr.split("-").map(Number);
                    const localDate = new Date(y, m - 1, d, 0, 0, 0, 0);
                    const dateDisplay = format(localDate, "dd 'de' MMMM", { locale: ptBR });
                    const yearDisplay = format(localDate, "yyyy");
                    
                    return (
                      <>
                        <span className="tabular-nums text-sm font-medium text-foreground">
                          {dateDisplay}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {yearDisplay}
                        </span>
                      </>
                    );
                  })()}
                  {day.reason && (
                    <span className="text-xs text-muted-foreground">
                      {day.reason}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDay(day.id)}
                  disabled={deletePending}
                  className="rounded p-1 text-muted-foreground/40 transition-all hover:text-destructive group-hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Remover"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <CalendarOff className="h-3.5 w-3.5" />
          Nenhuma data bloqueada
        </div>
      )}
    </div>
  );
}

