"use client";

import React, { useTransition, useState } from "react";
import { Button } from "@easyfyapp/ui";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  updateWorkingHours,
  updateBreakTime,
  getAvailabilityConfig,
} from "@/app/actions/availability";
import WorkingHoursForm from "./working-hours-form";
import BreakTimeForm from "./break-time-form";
import UnavailableDaysSection from "./unavailable-days-section";

interface AvailabilityConfigProps {
  initialData: Awaited<ReturnType<typeof getAvailabilityConfig>>;
}

function InlineMessage({
  message,
}: {
  message: { type: "success" | "error"; text: string } | null;
}) {
  if (!message) return null;
  const isSuccess = message.type === "success";
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium ${
        isSuccess ? "text-emerald-600" : "text-destructive"
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" />
      )}
      {message.text}
    </div>
  );
}

export function AvailabilityConfig({ initialData }: AvailabilityConfigProps) {
  const [workingHourMessage, setWorkingHourMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [breakTimeMessage, setBreakTimeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [workingHoursPending, startWorkingHoursTransition] = useTransition();
  const [breakTimePending, startBreakTimeTransition] = useTransition();

  const handleSubmitWorkingHours = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startWorkingHoursTransition(() => {
      updateWorkingHours({ success: false, error: "" }, formData).then((result) => {
        if (result.success === true) {
          setWorkingHourMessage({ type: "success", text: "Horários salvos" });
          setTimeout(() => setWorkingHourMessage(null), 3000);
        } else {
          setWorkingHourMessage({ type: "error", text: result.error });
        }
      });
    });
  };

  const handleSubmitBreakTime = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startBreakTimeTransition(() => {
      updateBreakTime({ success: false, error: "" }, formData).then((result) => {
        if (result.success === true) {
          setBreakTimeMessage({ type: "success", text: "Intervalo salvo" });
          setTimeout(() => setBreakTimeMessage(null), 3000);
        } else {
          setBreakTimeMessage({ type: "error", text: result.error });
        }
      });
    });
  };

  if (!initialData.success) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {initialData.error}
      </div>
    );
  }

  const { workingHours, breakTime, unavailableDays } = initialData.data;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Horários de Trabalho */}
      <form onSubmit={handleSubmitWorkingHours}>
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Horários de trabalho</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Selecione os dias e defina o horário de atendimento
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <InlineMessage message={workingHourMessage} />
              <Button type="submit" size="sm" disabled={workingHoursPending}>
                {workingHoursPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
          <WorkingHoursForm workingHours={workingHours || []} />
        </div>
      </form>

      {/* Intervalo */}
      <form onSubmit={handleSubmitBreakTime}>
        <div className="border-t border-border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Intervalo</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pausa bloqueada em todos os dias de atendimento
              </p>
            </div>
            <div className="flex items-center gap-4">
              <BreakTimeForm breakTime={breakTime} />
              <div className="flex items-center gap-3">
                <InlineMessage message={breakTimeMessage} />
                <Button type="submit" size="sm" disabled={breakTimePending}>
                  {breakTimePending ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Dias indisponíveis */}
      <div className="border-t border-border p-6">
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">Dias bloqueados</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Férias, feriados ou qualquer data específica sem atendimento
          </p>
        </div>
        <UnavailableDaysSection unavailableDays={unavailableDays || []} />
      </div>
    </div>
  );
}

