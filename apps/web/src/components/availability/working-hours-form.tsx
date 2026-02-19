"use client";

import { useMemo, useState } from "react";

interface WorkingHours {
  id: string;
  organizationId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkingHoursFormProps {
  workingHours: WorkingHours[];
}

const DAYS_OF_WEEK = [
  { key: "monday",    label: "Segunda-feira", enum: "MONDAY" },
  { key: "tuesday",   label: "Terça-feira",   enum: "TUESDAY" },
  { key: "wednesday", label: "Quarta-feira",  enum: "WEDNESDAY" },
  { key: "thursday",  label: "Quinta-feira",  enum: "THURSDAY" },
  { key: "friday",    label: "Sexta-feira",   enum: "FRIDAY" },
  { key: "saturday",  label: "Sábado",        enum: "SATURDAY" },
  { key: "sunday",    label: "Domingo",       enum: "SUNDAY" },
];

const DEFAULT_HOURS: Record<string, { isWorking: boolean; startTime: string; endTime: string }> = {
  monday:    { isWorking: true,  startTime: "08:00", endTime: "17:00" },
  tuesday:   { isWorking: true,  startTime: "08:00", endTime: "17:00" },
  wednesday: { isWorking: true,  startTime: "08:00", endTime: "17:00" },
  thursday:  { isWorking: true,  startTime: "08:00", endTime: "17:00" },
  friday:    { isWorking: true,  startTime: "08:00", endTime: "17:00" },
  saturday:  { isWorking: false, startTime: "08:00", endTime: "17:00" },
  sunday:    { isWorking: false, startTime: "08:00", endTime: "17:00" },
};

function Toggle({
  checked,
  onChange,
  id,
  name,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  name: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
    </button>
  );
}

export default function WorkingHoursForm({ workingHours }: WorkingHoursFormProps) {
  const dayMap = useMemo(() => {
    const map: Record<string, WorkingHours> = {};
    workingHours.forEach((wh) => {
      map[wh.dayOfWeek.toLowerCase()] = wh;
    });
    return map;
  }, [workingHours]);

  const initialActive = useMemo(() => {
    const state: Record<string, boolean> = {};
    DAYS_OF_WEEK.forEach(({ key }) => {
      const data = dayMap[key] ?? DEFAULT_HOURS[key];
      state[key] = data.isWorking;
    });
    return state;
  }, [dayMap]);

  const [activeDays, setActiveDays] = useState(initialActive);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {DAYS_OF_WEEK.map(({ key, label }, index) => {
        const data = dayMap[key] ?? DEFAULT_HOURS[key];
        const isActive = activeDays[key];
        const isLast = index === DAYS_OF_WEEK.length - 1;

        return (
          <div
            key={key}
            className={`flex items-center gap-4 px-4 py-2.5 transition-colors ${
              !isLast ? "border-b border-border" : ""
            } ${isActive ? "" : "bg-muted/20"}`}
          >
            {/* Toggle */}
            <Toggle
              id={`toggle-${key}`}
              name={`${key}-isWorking`}
              checked={isActive}
              onChange={(val) => setActiveDays((prev) => ({ ...prev, [key]: val }))}
            />

            {/* Label */}
            <label
              htmlFor={`toggle-${key}`}
              className={`w-28 cursor-pointer select-none text-sm transition-colors ${
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </label>

            {/* Horários */}
            <div className="flex flex-1 items-center gap-2">
              <input
                type="time"
                name={`${key}-startTime`}
                defaultValue={data.startTime}
                disabled={!isActive}
                className="w-[104px] rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-35"
              />
              <span className={`text-xs transition-opacity ${isActive ? "text-muted-foreground" : "opacity-35"}`}>
                —
              </span>
              <input
                type="time"
                name={`${key}-endTime`}
                defaultValue={data.endTime}
                disabled={!isActive}
                className="w-[104px] rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-35"
              />
              
              {/* Hidden inputs for disabled days to ensure values are always submitted */}
              {!isActive && (
                <>
                  <input type="hidden" name={`${key}-startTime`} value={data.startTime} />
                  <input type="hidden" name={`${key}-endTime`} value={data.endTime} />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
