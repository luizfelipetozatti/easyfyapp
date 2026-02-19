import { prisma } from "@easyfyapp/database";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@easyfyapp/ui";

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { getCurrentUserOrgId } from "@/lib/auth/dashboard";
import { formatPhoneNumber } from "@/lib/phone-formatter";

// Helper para converter UTC para timezone específico
function getDateInTimezone(date: Date, timezoneName: string): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezoneName,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const values: Record<string, number> = {};
  
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = parseInt(part.value, 10);
    }
  }
  
  return new Date(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  );
}

export default async function DashboardPage() {
  const orgId = await getCurrentUserOrgId();

  if (!orgId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">
          Nenhuma organização encontrada. Configure sua conta.
        </p>
      </div>
    );
  }

  // Buscar organização com timezone
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { timezone: true },
  });

  if (!organization) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">
          Organização não encontrada.
        </p>
      </div>
    );
  }

  // Obter hora atual convertida para timezone da organização
  const utcNow = new Date();
  const zonedNow = getDateInTimezone(utcNow, organization.timezone);
  
  // Calcular início e fim do dia baseado no timezone da organização
  const todayStart = startOfDay(zonedNow);
  const todayEnd = endOfDay(zonedNow);
  const monthStart = startOfMonth(zonedNow);
  const monthEnd = endOfMonth(zonedNow);

  // Stats paralelos
  const [
    todayBookings,
    monthBookings,
    pendingCount,
    confirmedCount,
    cancelledCount,
    completedCount,
    totalRevenue,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.booking.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.booking.count({
      where: { organizationId: orgId, status: "PENDENTE" },
    }),
    prisma.booking.count({
      where: { organizationId: orgId, status: "CONFIRMADO" },
    }),
    prisma.booking.count({
      where: { organizationId: orgId, status: "CANCELADO" },
    }),
    prisma.booking.count({
      where: { organizationId: orgId, status: "CONCLUIDO" },
    }),
    prisma.booking.findMany({
      where: {
        organizationId: orgId,
        status: "CONCLUIDO",
        startTime: { gte: monthStart, lte: monthEnd },
      },
      include: { service: { select: { price: true } } },
    }),
  ]);

  const revenue = totalRevenue.reduce(
    (acc, b) => acc + Number(b.service.price),
    0
  );
  const revenueFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(revenue);

  // Próximos agendamentos de hoje
  const upcomingToday = await prisma.booking.findMany({
    where: {
      organizationId: orgId,
      startTime: { gte: utcNow, lte: todayEnd },
      status: { in: ["PENDENTE", "CONFIRMADO"] },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral dos seus agendamentos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Hoje"
          value={todayBookings.toString()}
          icon={Calendar}
          description="agendamentos criados hoje"
        />
        <StatCard
          title="Este Mês"
          value={monthBookings.toString()}
          icon={TrendingUp}
          description="agendamentos criados no mês"
        />
        <StatCard
          title="Pendentes"
          value={pendingCount.toString()}
          icon={Clock}
          description="aguardando confirmação"
        />
        <StatCard
          title="Receita Mensal"
          value={revenueFormatted}
          icon={DollarSign}
          description="serviços concluídos"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{confirmedCount}</p>
              <p className="text-sm text-muted-foreground">Confirmados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{cancelledCount}</p>
              <p className="text-sm text-muted-foreground">Cancelados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Concluídos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos de hoje */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Agendamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingToday.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum agendamento pendente para hoje.
            </p>
          ) : (
            <div className="divide-y">
              {upcomingToday.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">{booking.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.service.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {booking.startTime.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPhoneNumber(booking.clientPhone)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
