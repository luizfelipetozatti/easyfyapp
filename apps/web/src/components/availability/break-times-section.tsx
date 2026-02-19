"use client";

import React, { useTransition, useState } from "react";
import { X, Clock, Plus } from "lucide-react";
import { Button } from "@easyfyapp/ui";
import { addBreakTime, removeBreakTime } from "@/app/actions/availability";

// ============================================================
// TYPES
// ============================================================

interface BreakTime {
  id: string;
  organizationId: string;
  label: string | null;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BreakTimesSectionProps {
  breakTimes: BreakTime[];
}

// ============================================================
// COMPONENT
// ============================================================

export default function BreakTimesSection({
  breakTimes: initialBreakTimes,
}: BreakTimesSectionProps) {
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [label, setLabel] = useState("");
  const [breakTimes, setBreakTimes] = useState(initialBreakTimes);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [addPending, startAddTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const handleAddBreakTime = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg(null);

    startAddTransition(() => {
      addBreakTime({ success: false, error: "" }, formData).then((result) => {
        if (result.success === true) {
          setStartTime("12:00");
          setEndTime("13:00");
          setLabel("");
          setTimeout(() => window.location.reload(), 300);
        } else {
          setErrorMsg(result.error);
          setTimeout(() => setErrorMsg(null), 4000);
        }
      });
    });
  };

  const handleRemoveBreakTime = (id: string) => {
    setBreakTimes((prev) => prev.filter((b) => b.id !== id));
    startDeleteTransition(() => {
      removeBreakTime({ success: false, error: "" }, id).then((result) => {
        if (result.success !== true) {
          setBreakTimes(initialBreakTimes);
        }
      });
    });
  };

  const sortedBreakTimes = [...breakTimes].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="space-y-3">
      {/* Formulário de adição */}
      <form onSubmit={handleAddBreakTime}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="time"
            name="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            disabled={addPending}
            className="w-[104px] rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            type="time"
            name="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            disabled={addPending}
            className="w-[104px] rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
          />
          <input
            type="text"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Descrição (opcional)"
            disabled={addPending}
            className="min-w-[180px] flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
          />
          <Button
            type="submit"
            size="sm"
            disabled={addPending}
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

      {/* Lista de intervalos */}
      {sortedBreakTimes.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {sortedBreakTimes.map((breakTime, index) => {
            const isLast = index === sortedBreakTimes.length - 1;
            return (
              <div
                key={breakTime.id}
                className={`group flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/40 ${
                  !isLast ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-sm font-medium text-foreground">
                    {breakTime.startTime}
                  </span>
                  <span className="text-xs text-muted-foreground">—</span>
                  <span className="tabular-nums text-sm font-medium text-foreground">
                    {breakTime.endTime}
                  </span>
                  {breakTime.label && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {breakTime.label}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBreakTime(breakTime.id)}
                  disabled={deletePending}
                  className="rounded p-1 text-muted-foreground/40 transition-all hover:text-destructive group-hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Remover intervalo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Nenhum intervalo cadastrado
        </div>
      )}
    </div>
  );
}
