"use client";

interface BreakTime {
  id: string;
  organizationId: string;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BreakTimeFormProps {
  breakTime?: BreakTime | null;
}

export default function BreakTimeForm({ breakTime }: BreakTimeFormProps) {
  const defaultStartTime = breakTime?.startTime || "12:00";
  const defaultEndTime = breakTime?.endTime || "13:00";

  return (
    <div className="flex items-center gap-2">
      <input
        id="break-start"
        type="time"
        defaultValue={defaultStartTime}
        name="breakStartTime"
        className="w-[104px] rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      />
      <span className="text-xs text-muted-foreground">—</span>
      <input
        id="break-end"
        type="time"
        defaultValue={defaultEndTime}
        name="breakEndTime"
        className="w-[104px] rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      />
    </div>
  );
}
