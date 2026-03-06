"use client";

import { Badge, Button, Input } from "@easyfyapp/ui";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Search,
  CalendarRange,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";

import { formatPhoneNumber } from "@/lib/phone-formatter";

import { BookingStatusActions } from "./booking-actions";

// ─── Types ─────────────────────────────────────────────────────────────────

type BookingStatus = "PENDENTE" | "CONFIRMADO" | "CANCELADO" | "CONCLUIDO";

export interface BookingWithService {
  id: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  whatsappSent: boolean;
  notes: string | null;
  service: {
    id: string;
    name: string;
  };
}

type SortColumn = "clientName" | "service" | "startTime" | "status";
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

interface FilterState {
  search: string;
  statuses: BookingStatus[];
  dateFrom: string;
  dateTo: string;
  serviceId: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; variant: "warning" | "success" | "destructive" | "secondary"; color: string }
> = {
  PENDENTE:   { label: "Pendente",   variant: "warning",     color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
  CONFIRMADO: { label: "Confirmado", variant: "success",     color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
  CANCELADO:  { label: "Cancelado",  variant: "destructive", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
  CONCLUIDO:  { label: "Concluído",  variant: "secondary",   color: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200" },
};

const ALL_STATUSES: BookingStatus[] = ["PENDENTE", "CONFIRMADO", "CANCELADO", "CONCLUIDO"];

const DEFAULT_SORT: SortState = { column: "startTime", direction: "desc" };

const DEFAULT_FILTERS: FilterState = {
  search: "",
  statuses: [],
  dateFrom: "",
  dateTo: "",
  serviceId: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function sortBookings(bookings: BookingWithService[], sort: SortState): BookingWithService[] {
  return [...bookings].sort((a, b) => {
    let comparison = 0;

    switch (sort.column) {
      case "clientName":
        comparison = a.clientName.localeCompare(b.clientName, "pt-BR");
        break;
      case "service":
        comparison = a.service.name.localeCompare(b.service.name, "pt-BR");
        break;
      case "startTime":
        comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        break;
      case "status":
        comparison = ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status);
        break;
    }

    return sort.direction === "asc" ? comparison : -comparison;
  });
}

function filterBookings(bookings: BookingWithService[], filters: FilterState): BookingWithService[] {
  return bookings.filter((booking) => {
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const nameMatch = booking.clientName.toLowerCase().includes(query);
      const phoneMatch = booking.clientPhone.includes(query);
      if (!nameMatch && !phoneMatch) return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(booking.status)) {
      return false;
    }

    if (filters.serviceId && booking.service.id !== filters.serviceId) {
      return false;
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom + "T00:00:00");
      if (new Date(booking.startTime) < from) return false;
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo + "T23:59:59");
      if (new Date(booking.startTime) > to) return false;
    }

    return true;
  });
}

function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.statuses.length > 0) count++;
  if (filters.dateFrom || filters.dateTo) count++;
  if (filters.serviceId) count++;
  return count;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SortIcon({ column, sort }: { column: SortColumn; sort: SortState }) {
  if (sort.column !== column) {
    return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/50" />;
  }
  return sort.direction === "asc"
    ? <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-primary" />;
}

function SortableHeader({
  column,
  label,
  sort,
  onSort,
  className = "",
}: {
  column: SortColumn;
  label: string;
  sort: SortState;
  onSort: (col: SortColumn) => void;
  className?: string;
}) {
  const isActive = sort.column === column;
  return (
    <th className={`py-3 ${className}`}>
      <button
        onClick={() => onSort(column)}
        className={`group inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-sm font-medium transition-colors hover:text-foreground ${
          isActive ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
        <SortIcon column={column} sort={sort} />
      </button>
    </th>
  );
}

// ─── Filter Panel ──────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: FilterState;
  services: { id: string; name: string }[];
  onChange: (filters: FilterState) => void;
  onClear: () => void;
  onClose: () => void;
}

function FilterPanel({ filters, services, onChange, onClear, onClose }: FilterPanelProps) {
  const [draft, setDraft] = useState<FilterState>(filters);

  const toggleStatus = (status: BookingStatus) => {
    setDraft((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const applyFilters = () => {
    onChange(draft);
    onClose();
  };

  const clearAll = () => {
    setDraft(DEFAULT_FILTERS);
    onClear();
    onClose();
  };

  return (
    <div className="border-b bg-muted/30 px-6 py-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Buscar cliente
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nome ou telefone..."
              value={draft.search}
              onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
              className="pl-9"
            />
          </div>
        </div>

        {/* Service */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Serviço
          </label>
          <div className="relative">
            <select
              value={draft.serviceId}
              onChange={(e) => setDraft((p) => ({ ...p, serviceId: e.target.value }))}
              className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos os serviços</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Date from */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            De
          </label>
          <input
            type="date"
            value={draft.dateFrom}
            onChange={(e) => setDraft((p) => ({ ...p, dateFrom: e.target.value }))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Date to */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Até
          </label>
          <input
            type="date"
            value={draft.dateTo}
            onChange={(e) => setDraft((p) => ({ ...p, dateTo: e.target.value }))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Status chips */}
      <div className="mt-4 space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const active = draft.statuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? cfg.color
                    : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <button
          onClick={clearAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Limpar filtros
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={applyFilters}>
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Active Filter Chips ────────────────────────────────────────────────────

function ActiveFilterChips({
  filters,
  services,
  onRemove,
}: {
  filters: FilterState;
  services: { id: string; name: string }[];
  onRemove: (key: keyof FilterState, value?: string) => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.search) {
    chips.push({ label: `"${filters.search}"`, onRemove: () => onRemove("search") });
  }

  filters.statuses.forEach((s) => {
    chips.push({
      label: STATUS_CONFIG[s].label,
      onRemove: () => onRemove("statuses", s),
    });
  });

  if (filters.dateFrom || filters.dateTo) {
    const label = [
      filters.dateFrom && format(new Date(filters.dateFrom + "T00:00:00"), "dd/MM/yy"),
      filters.dateTo && format(new Date(filters.dateTo + "T00:00:00"), "dd/MM/yy"),
    ]
      .filter(Boolean)
      .join(" → ");
    chips.push({ label, onRemove: () => { onRemove("dateFrom"); onRemove("dateTo"); } });
  }

  if (filters.serviceId) {
    const svc = services.find((s) => s.id === filters.serviceId);
    chips.push({ label: svc?.name ?? "Serviço", onRemove: () => onRemove("serviceId") });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-muted/20">
      <span className="text-xs text-muted-foreground">Filtros ativos:</span>
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-0.5 rounded-full hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <CalendarRange className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground">
        {hasFilters ? "Nenhum resultado encontrado" : "Nenhum agendamento"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Tente ajustar ou remover os filtros aplicados."
          : "Os agendamentos realizados aparecerão aqui."}
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

interface BookingsTableProps {
  bookings: BookingWithService[];
  services: { id: string; name: string }[];
}

export function BookingsTable({ bookings, services }: BookingsTableProps) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const processedBookings = useMemo(
    () => sortBookings(filterBookings(bookings, filters), sort),
    [bookings, filters, sort]
  );

  const handleSort = useCallback((column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: column === "startTime" ? "desc" : "asc" }
    );
  }, []);

  const handleRemoveFilter = useCallback(
    (key: keyof FilterState, value?: string) => {
      setFilters((prev) => {
        if (key === "statuses" && value) {
          return { ...prev, statuses: prev.statuses.filter((s) => s !== value) };
        }
        if (key === "dateFrom" || key === "dateTo") {
          return { ...prev, dateFrom: "", dateTo: "" };
        }
        return { ...prev, [key]: key === "statuses" ? [] : "" };
      });
    },
    []
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="text-base font-semibold">Todos os Agendamentos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {processedBookings.length === bookings.length
              ? `${bookings.length} agendamento${bookings.length !== 1 ? "s" : ""}`
              : `${processedBookings.length} de ${bookings.length} agendamentos`}
          </p>
        </div>

        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
            filterOpen || activeFilterCount > 0
              ? "border-primary bg-primary/5 text-primary hover:bg-primary/10"
              : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrar
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter Panel ── */}
      {filterOpen && (
        <FilterPanel
          filters={filters}
          services={services}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {/* ── Active Filter Chips ── */}
      {!filterOpen && activeFilterCount > 0 && (
        <ActiveFilterChips
          filters={filters}
          services={services}
          onRemove={handleRemoveFilter}
        />
      )}

      {/* ── Table ── */}
      {processedBookings.length === 0 ? (
        <EmptyState hasFilters={activeFilterCount > 0} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <SortableHeader
                  column="clientName"
                  label="Cliente"
                  sort={sort}
                  onSort={handleSort}
                  className="pl-6 text-left"
                />
                <SortableHeader
                  column="service"
                  label="Serviço"
                  sort={sort}
                  onSort={handleSort}
                  className="text-left"
                />
                <SortableHeader
                  column="startTime"
                  label="Data / Hora"
                  sort={sort}
                  onSort={handleSort}
                  className="text-center"
                />
                <SortableHeader
                  column="status"
                  label="Status"
                  sort={sort}
                  onSort={handleSort}
                  className="text-center"
                />
                <th className="py-3 text-center text-sm font-medium text-muted-foreground">
                  WhatsApp
                </th>
                <th className="py-3 pr-6 text-right text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {processedBookings.map((booking) => {
                const status = STATUS_CONFIG[booking.status];
                return (
                  <tr
                    key={booking.id}
                    className="group transition-colors hover:bg-muted/40"
                  >
                    {/* Cliente */}
                    <td className="py-3.5 pl-6">
                      <div>
                        <p className="font-medium text-foreground">
                          {booking.clientName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatPhoneNumber(booking.clientPhone)}
                        </p>
                      </div>
                    </td>

                    {/* Serviço */}
                    <td className="py-3.5">
                      <span className="text-sm">{booking.service.name}</span>
                    </td>

                    {/* Data/Hora */}
                    <td className="py-3.5 text-center">
                      <div>
                        <p className="font-medium">
                          {format(new Date(booking.startTime), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {format(new Date(booking.startTime), "HH:mm")}
                          {" – "}
                          {format(new Date(booking.endTime), "HH:mm")}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 text-center">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>

                    {/* WhatsApp */}
                    <td className="py-3.5 text-center">
                      <Badge variant={booking.whatsappSent ? "success" : "outline"}>
                        {booking.whatsappSent ? "Enviado" : "Pendente"}
                      </Badge>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 pr-6 text-right">
                      <BookingStatusActions
                        bookingId={booking.id}
                        currentStatus={booking.status}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
